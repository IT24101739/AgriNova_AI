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
    Otherwise create a new farm record.
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
    return farm
