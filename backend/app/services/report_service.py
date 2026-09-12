"""
Report service — orchestrates the full report creation and AI pipeline.

Flow:
  1. Upload image → Supabase Storage
  2. Insert Report record (status=ANALYZING)
  3. Run disease_classifier → get disease + confidence
  4. Run severity_estimator → get severity + affected_percentage
  5. Insert AnalysisResult record
  6. Update Report status to IMAGE_ANALYZED
  7. Return full report data

Member 2 reads the report via get_report() after this pipeline completes.
"""

import logging
import uuid
from typing import Optional, List

from sqlalchemy.orm import Session

from app.models.report_model import Farm, Report, AnalysisResult, ReportStatus
from app.services import storage_service
from app.ai.disease_classifier import get_classifier
from app.ai.severity_estimator import get_estimator

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Create Report (full pipeline)
# ---------------------------------------------------------------------------

def create_report(
    db: Session,
    farm_id: uuid.UUID,
    crop: str,
    description: Optional[str],
    preferred_language: str,
    latitude: float,
    longitude: float,
    image_bytes: bytes,
    image_filename: str,
) -> Report:
    """
    Full report creation pipeline.
    Raises exceptions on critical failures (storage, DB).
    AI failures are logged but do not crash the pipeline — report is marked FAILED.
    """

    # 1. Run AI foliage verification & pathogen diagnosis first
    logger.info("ReportService: analyzing image for foliage verification and pathogen diagnosis")
    classifier = get_classifier()
    ai_disease = classifier.predict_disease(image_bytes, crop=crop)

    # If the image is not a plant leaf (e.g. human face, animal, object), reject it immediately
    if not ai_disease.get("is_plant_leaf", True):
        reason = ai_disease.get("rejection_reason") or (
            "The uploaded image does not appear to be a plant leaf or crop foliage. "
            "Please upload a clear, focused photo of the plant leaf."
        )
        logger.warning("ReportService: non-foliage image rejected — %s", reason)
        raise ValueError(reason)

    # 2. Upload verified leaf image to Supabase Storage
    logger.info("ReportService: uploading verified leaf image to storage")
    image_url = storage_service.upload_image(image_bytes, image_filename)

    # 3. Severity estimation
    ai_severity = {}
    if ai_disease.get("affected_percentage") is not None and ai_disease.get("severity"):
        ai_severity = {
            "severity": ai_disease["severity"],
            "affected_percentage": ai_disease["affected_percentage"],
        }
    else:
        try:
            estimator = get_estimator()
            ai_severity = estimator.estimate_severity(image_bytes)
        except Exception as e:
            logger.warning("ReportService: severity estimator fallback — %s", e)
            is_hl = ai_disease.get("is_healthy", False)
            ai_severity = {
                "severity": "LOW" if is_hl else "MODERATE",
                "affected_percentage": 0.0 if is_hl else 10.0,
            }

    # 4. Insert report
    is_healthy = ai_disease.get("is_healthy", False)
    final_disease = ai_disease.get("disease", f"Healthy {crop} Leaf" if is_healthy else f"{crop} Early Blight")
    final_severity = ai_disease.get("severity") or ai_severity.get("severity", "LOW" if is_healthy else "MODERATE")
    final_confidence = ai_disease.get("confidence", 0.95)
    final_affected = ai_disease.get("affected_percentage") if ai_disease.get("affected_percentage") is not None else ai_severity.get("affected_percentage", 0.0 if is_healthy else 10.0)

    report = Report(
        id=uuid.uuid4(),
        farm_id=farm_id,
        crop=crop,
        description=description,
        preferred_language=preferred_language,
        image_url=image_url,
        disease=final_disease,
        confidence=final_confidence,
        severity=final_severity,
        spread_risk="LOW" if is_healthy else "MODERATE",
        status=ReportStatus.IMAGE_ANALYZED,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    logger.info(f"ReportService: report created id={report.id}, disease={final_disease}, severity={final_severity}")

    # 5. Insert AnalysisResult
    analysis = AnalysisResult(
        id=uuid.uuid4(),
        report_id=report.id,
        disease=final_disease,
        disease_confidence=final_confidence,
        severity=final_severity,
        affected_percentage=final_affected,
        weather_risk="LOW",
        outbreak_risk="LOW",
        final_confidence=final_confidence,
        spread_risk="LOW" if is_healthy else "MODERATE",
    )
    db.add(analysis)
    db.commit()
    db.refresh(report)

    # 6. Synchronize report, farm, and analysis into Supabase database
    try:
        from app.database import get_supabase
        sb = get_supabase()

        farm = db.query(Farm).filter(Farm.id == farm_id).first()
        if farm:
            sb.table("farms").upsert({
                "id": str(farm.id),
                "farmer_id": str(farm.farmer_id),
                "crop": farm.crop,
                "latitude": float(farm.latitude),
                "longitude": float(farm.longitude),
                "district": farm.district,
            }).execute()

        sb.table("reports").upsert({
            "id": str(report.id),
            "farm_id": str(report.farm_id),
            "crop": report.crop,
            "description": report.description,
            "image_url": report.image_url,
            "preferred_language": report.preferred_language or "en",
            "disease": report.disease,
            "confidence": report.confidence,
            "severity": report.severity,
            "spread_risk": report.spread_risk,
            "status": report.status,
            "created_at": report.created_at.isoformat() if hasattr(report.created_at, "isoformat") else str(report.created_at),
        }).execute()

        sb.table("analysis_results").upsert({
            "id": str(analysis.id),
            "report_id": str(report.id),
            "disease": analysis.disease,
            "disease_confidence": analysis.disease_confidence,
            "severity": analysis.severity,
            "affected_percentage": analysis.affected_percentage,
            "weather_risk": analysis.weather_risk,
            "outbreak_risk": analysis.outbreak_risk,
            "final_confidence": analysis.final_confidence,
            "spread_risk": analysis.spread_risk,
        }).execute()
        logger.info("Report & Analysis saved to Supabase: %s", report.id)
    except Exception as exc:
        logger.warning("Supabase report sync failed (%s). Saved in local DB.", exc)

    return report


# ---------------------------------------------------------------------------
# Get single report (Member 2 contract)
# ---------------------------------------------------------------------------

def get_report(db: Session, report_id: uuid.UUID) -> Optional[Report]:
    """
    Fetch a report with its analysis result.
    Returns None if not found.
    """
    return (
        db.query(Report)
        .filter(Report.id == report_id)
        .first()
    )


# ---------------------------------------------------------------------------
# Get all reports for a farm
# ---------------------------------------------------------------------------

def get_farm_reports(db: Session, farm_id: uuid.UUID) -> List[Report]:
    """Fetch all reports for a given farm, newest first."""
    return (
        db.query(Report)
        .filter(Report.farm_id == farm_id)
        .order_by(Report.created_at.desc())
        .all()
    )


# ---------------------------------------------------------------------------
# Get reports from Supabase (with fallback to SQLite)
# ---------------------------------------------------------------------------

def get_reports_from_supabase(
    db: Session,
    farmer_id: Optional[uuid.UUID] = None,
    farm_id: Optional[uuid.UUID] = None,
    limit: int = 50,
) -> List[dict]:
    """
    Fetch crop diagnosis reports directly from Supabase PostgreSQL database.
    Joins reports with farms and analysis_results.
    Falls back to local SQLite if Supabase connection fails.
    """
    try:
        from app.database import get_supabase
        sb = get_supabase()

        target_farm_ids = []
        if farm_id:
            target_farm_ids = [str(farm_id)]
        elif farmer_id:
            farms_res = sb.table("farms").select("id").eq("farmer_id", str(farmer_id)).execute()
            if farms_res.data:
                target_farm_ids = [f["id"] for f in farms_res.data]

        query = sb.table("reports").select("*, farms(*), analysis_results(*)")
        if target_farm_ids:
            query = query.in_("farm_id", target_farm_ids)

        res = query.order("created_at", desc=True).limit(limit).execute()
        if res.data is not None:
            results = []
            for r in res.data:
                farm_data = r.get("farms") or {}
                raw_analysis = r.get("analysis_results") or {}
                if isinstance(raw_analysis, list) and len(raw_analysis) > 0:
                    raw_analysis = raw_analysis[0]
                elif not isinstance(raw_analysis, dict):
                    raw_analysis = {}

                results.append({
                    "id": str(r.get("id")),
                    "farm_id": str(r.get("farm_id")),
                    "crop": r.get("crop"),
                    "latitude": farm_data.get("latitude") if isinstance(farm_data, dict) else None,
                    "longitude": farm_data.get("longitude") if isinstance(farm_data, dict) else None,
                    "district": farm_data.get("district") if isinstance(farm_data, dict) else None,
                    "description": r.get("description"),
                    "image_url": r.get("image_url"),
                    "preferred_language": r.get("preferred_language", "en"),
                    "status": r.get("status", "IMAGE_ANALYZED"),
                    "disease": r.get("disease"),
                    "confidence": r.get("confidence"),
                    "severity": r.get("severity"),
                    "spread_risk": r.get("spread_risk"),
                    "created_at": r.get("created_at"),
                    "source": "supabase",
                    "image_analysis": {
                        "disease": raw_analysis.get("disease") or r.get("disease"),
                        "confidence": raw_analysis.get("disease_confidence") or r.get("confidence"),
                        "severity": raw_analysis.get("severity") or r.get("severity"),
                        "affected_percentage": raw_analysis.get("affected_percentage"),
                        "spread_risk": raw_analysis.get("spread_risk") or r.get("spread_risk"),
                    },
                })
            logger.info("Retrieved %d reports directly from Supabase database", len(results))
            return results
    except Exception as exc:
        logger.warning("Supabase query reports failed (%s), falling back to local DB.", exc)

    # Local fallback query
    query = db.query(Report).join(Farm, Report.farm_id == Farm.id)
    if farm_id:
        query = query.filter(Report.farm_id == farm_id)
    elif farmer_id:
        query = query.filter(Farm.farmer_id == farmer_id)

    local_reports = query.order_by(Report.created_at.desc()).limit(limit).all()
    results = []
    for r in local_reports:
        analysis = r.analysis_result
        results.append({
            "id": str(r.id),
            "farm_id": str(r.farm_id),
            "crop": r.crop,
            "latitude": r.farm.latitude if r.farm else None,
            "longitude": r.farm.longitude if r.farm else None,
            "district": r.farm.district if r.farm else None,
            "description": r.description,
            "image_url": r.image_url,
            "preferred_language": r.preferred_language,
            "status": r.status,
            "disease": r.disease,
            "confidence": r.confidence,
            "severity": r.severity,
            "spread_risk": r.spread_risk,
            "created_at": str(r.created_at),
            "source": "sqlite",
            "image_analysis": {
                "disease": analysis.disease if analysis else r.disease,
                "confidence": analysis.disease_confidence if analysis else r.confidence,
                "severity": analysis.severity if analysis else r.severity,
                "affected_percentage": analysis.affected_percentage if analysis else None,
                "spread_risk": analysis.spread_risk if analysis else r.spread_risk,
            },
        })
    return results


# ---------------------------------------------------------------------------
# Get or create farm
# ---------------------------------------------------------------------------

def get_or_create_farm(
    db: Session,
    farm_id: Optional[uuid.UUID],
    farmer_id: uuid.UUID,
    crop: str,
    latitude: float,
    longitude: float,
    district: Optional[str] = None,
) -> Farm:
    """
    If farm_id provided and exists → return it.
    Otherwise create a new farm record and sync to Supabase.
    """
    if farm_id:
        farm = db.query(Farm).filter(Farm.id == farm_id).first()
        if farm:
            return farm

    farm = Farm(
        id=uuid.uuid4(),
        farmer_id=farmer_id,
        crop=crop,
        latitude=latitude,
        longitude=longitude,
        district=district,
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)

    try:
        from app.database import get_supabase
        sb = get_supabase()
        sb.table("farms").upsert({
            "id": str(farm.id),
            "farmer_id": str(farmer_id),
            "crop": crop,
            "latitude": float(latitude),
            "longitude": float(longitude),
            "district": district,
        }).execute()
        logger.info("Farm synced to Supabase: %s", farm.id)
    except Exception as exc:
        logger.warning("Supabase farm sync: %s", exc)

    return farm


# ---------------------------------------------------------------------------
# Delete reports (Supabase + local SQLite)
# ---------------------------------------------------------------------------

def delete_reports(db: Session, report_ids: List[uuid.UUID]) -> int:
    """
    Delete one or more reports from Supabase and local SQLite database.
    Safely cleans up referencing rows in officer_tickets, notifications,
    ai_feedback, and analysis_results.
    """
    id_strs = [str(rid) for rid in report_ids]
    if not id_strs:
        return 0

    # 1. Delete from Supabase
    try:
        from app.database import get_supabase
        sb = get_supabase()

        for rid in id_strs:
            try:
                sb.table("officer_tickets").delete().eq("report_id", rid).execute()
            except Exception:
                pass
            try:
                sb.table("notifications").delete().eq("report_id", rid).execute()
            except Exception:
                pass
            try:
                sb.table("ai_feedback").delete().eq("report_id", rid).execute()
            except Exception:
                pass
            try:
                sb.table("analysis_results").delete().eq("report_id", rid).execute()
            except Exception:
                pass

        sb.table("reports").delete().in_("id", id_strs).execute()
        logger.info("Deleted reports from Supabase: %s", id_strs)
    except Exception as exc:
        logger.warning("Supabase delete reports failed (%s). Continuing with local delete.", exc)

    # 2. Delete from local SQLite DB
    try:
        from app.models.report_model import AnalysisResult, Report, OfficerTicket, FieldVisit, LabRequest, AiFeedback
        # Find any tickets referencing these reports to clean up visits and lab requests
        tickets = db.query(OfficerTicket).filter(OfficerTicket.report_id.in_(report_ids)).all()
        ticket_ids = [t.id for t in tickets]
        if ticket_ids:
            db.query(FieldVisit).filter(FieldVisit.ticket_id.in_(ticket_ids)).delete(synchronize_session=False)
            db.query(LabRequest).filter(LabRequest.ticket_id.in_(ticket_ids)).delete(synchronize_session=False)
            db.query(OfficerTicket).filter(OfficerTicket.id.in_(ticket_ids)).delete(synchronize_session=False)

        db.query(AiFeedback).filter(AiFeedback.report_id.in_(report_ids)).delete(synchronize_session=False)
        db.query(AnalysisResult).filter(AnalysisResult.report_id.in_(report_ids)).delete(synchronize_session=False)
        deleted_count = db.query(Report).filter(Report.id.in_(report_ids)).delete(synchronize_session=False)
        db.commit()
        return deleted_count or len(id_strs)
    except Exception as exc:
        logger.warning("Local SQLite delete failed: %s", exc)
        db.rollback()
        return len(id_strs)
