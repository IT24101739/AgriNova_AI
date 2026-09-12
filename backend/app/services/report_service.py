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

    # 1. Upload image to Supabase Storage
    logger.info("ReportService: uploading image to storage")
    image_url = storage_service.upload_image(image_bytes, image_filename)

    # 2. Insert report with ANALYZING status
    report = Report(
        id=uuid.uuid4(),
        farm_id=farm_id,
        crop=crop,
        description=description,
        preferred_language=preferred_language,
        image_url=image_url,
        status=ReportStatus.ANALYZING,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    logger.info(f"ReportService: report created id={report.id}")

    # 3 & 4. Run AI pipeline
    ai_disease = {}
    ai_severity = {}
    pipeline_ok = True

    try:
        logger.info("ReportService: running disease classifier")
        classifier = get_classifier()
        ai_disease = classifier.predict_disease(image_bytes)
    except Exception as e:
        logger.error(f"ReportService: disease classifier failed — {e}", exc_info=True)
        pipeline_ok = False

    try:
        logger.info("ReportService: running severity estimator")
        estimator = get_estimator()
        ai_severity = estimator.estimate_severity(image_bytes)
    except Exception as e:
        logger.error(f"ReportService: severity estimator failed — {e}", exc_info=True)
        pipeline_ok = False

    # 5. Insert AnalysisResult
    analysis = AnalysisResult(
        id=uuid.uuid4(),
        report_id=report.id,
        disease=ai_disease.get("disease"),
        disease_confidence=ai_disease.get("confidence"),
        severity=ai_severity.get("severity"),
        affected_percentage=ai_severity.get("affected_percentage"),
        # weather_risk, outbreak_risk, final_confidence → populated by Member 2
    )
    db.add(analysis)

    # 6. Update report status
    report.status = ReportStatus.IMAGE_ANALYZED if pipeline_ok else ReportStatus.FAILED
    report.disease = ai_disease.get("disease")
    report.confidence = ai_disease.get("confidence")
    report.severity = ai_severity.get("severity")

    db.commit()
    db.refresh(report)
    logger.info(f"ReportService: pipeline complete, status={report.status}")

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
