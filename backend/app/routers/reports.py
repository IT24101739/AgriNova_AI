"""
Reports router — Feature Slice 1 API endpoints.

POST   /api/reports                    — submit new crop disease report
GET    /api/reports/{report_id}        — get report + image_analysis (Member 2 contract)
GET    /api/farms/{farm_id}/reports    — list all reports for a farm
"""

import uuid
import logging
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.models.database import get_db
from app.services import report_service
from app.schemas.report import ReportResponse, ReportListItem, ImageAnalysisResult

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["reports"])

# Maximum upload size: 10 MB
MAX_IMAGE_SIZE = 10 * 1024 * 1024


# ---------------------------------------------------------------------------
# POST /api/reports
# ---------------------------------------------------------------------------

@router.post("/reports", status_code=status.HTTP_201_CREATED)
async def submit_report(
    # Form fields
    farmer_id: str = Form(..., description="UUID of the farmer (from Supabase Auth)"),
    crop: str = Form(..., description="Crop type e.g. Tomato, Potato, Pepper"),
    description: Optional[str] = Form(None),
    preferred_language: str = Form("en", description="en | si | ta"),
    latitude: float = Form(...),
    longitude: float = Form(...),
    district: Optional[str] = Form(None),
    farm_id: Optional[str] = Form(None, description="Existing farm UUID, or omit to auto-create"),
    # Image file
    image: UploadFile = File(..., description="Leaf/crop photo (JPEG, PNG, WebP)"),
    db: Session = Depends(get_db),
):
    """
    Submit a new crop disease report.

    Accepts multipart/form-data with the leaf image and farm metadata.
    Runs the full AI pipeline (disease classifier + severity estimator).
    Returns the created report with image_analysis results.
    """
    # --- Validate image size ---
    image_bytes = await image.read()
    if len(image_bytes) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image too large. Maximum size is 10 MB.",
        )

    # --- Validate image content type ---
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported image type: {image.content_type}",
        )

    # --- Validate language ---
    if preferred_language not in ("en", "si", "ta"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="preferred_language must be one of: en, si, ta",
        )

    # --- Parse UUIDs ---
    try:
        farmer_uuid = uuid.UUID(farmer_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid farmer_id UUID format.")

    farm_uuid = None
    if farm_id:
        try:
            farm_uuid = uuid.UUID(farm_id)
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid farm_id UUID format.")

    try:
        # Get or create farm
        farm = report_service.get_or_create_farm(
            db=db,
            farm_id=farm_uuid,
            farmer_id=farmer_uuid,
            crop=crop,
            latitude=latitude,
            longitude=longitude,
            district=district,
        )

        # Run full pipeline
        report = report_service.create_report(
            db=db,
            farm_id=farm.id,
            crop=crop,
            description=description,
            preferred_language=preferred_language,
            latitude=latitude,
            longitude=longitude,
            image_bytes=image_bytes,
            image_filename=image.filename or "upload.jpg",
        )

    except ValueError as e:
        logger.warning(f"Report rejected: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except RuntimeError as e:
        logger.error(f"Report creation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Unexpected error in submit_report: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis pipeline error: {str(e)}",
        )

    return {
        "success": True,
        "data": _serialize_report(report, farm),
        "message": "Report submitted successfully. Analysis complete.",
    }


# ---------------------------------------------------------------------------
# GET /api/reports/{report_id}  — Member 2 contract
# ---------------------------------------------------------------------------

@router.get("/reports/{report_id}")
def get_report(
    report_id: str,
    db: Session = Depends(get_db),
):
    """
    Get a single report with full image_analysis block.
    This is the stable contract for Member 2's diagnosis aggregator.
    """
    try:
        report_uuid = uuid.UUID(report_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid report_id UUID format.")

    report = report_service.get_report(db, report_uuid)
    if not report:
        # Check Supabase database
        try:
            from app.database import get_supabase
            sb = get_supabase()
            sb_res = sb.table("reports").select("*, farms(*), analysis_results(*)").eq("id", str(report_uuid)).execute()
            if sb_res.data and len(sb_res.data) > 0:
                r = sb_res.data[0]
                farm_data = r.get("farms") or {}
                raw_analysis = r.get("analysis_results") or {}
                if isinstance(raw_analysis, list) and len(raw_analysis) > 0:
                    raw_analysis = raw_analysis[0]
                elif not isinstance(raw_analysis, dict):
                    raw_analysis = {}

                return {
                    "success": True,
                    "data": {
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
                        "created_at": r.get("created_at"),
                        "image_analysis": {
                            "disease": raw_analysis.get("disease") or r.get("disease"),
                            "confidence": raw_analysis.get("disease_confidence") or r.get("confidence"),
                            "severity": raw_analysis.get("severity") or r.get("severity"),
                            "affected_percentage": raw_analysis.get("affected_percentage"),
                            "spread_risk": raw_analysis.get("spread_risk") or r.get("spread_risk"),
                        },
                    },
                    "message": "",
                }
        except Exception as sb_err:
            logger.debug("Supabase lookup fallback: %s", sb_err)

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report {report_id} not found.",
        )

    # Fetch the farm to get lat/lng
    from app.models.report_model import Farm
    farm = db.query(Farm).filter(Farm.id == report.farm_id).first()

    return {
        "success": True,
        "data": _serialize_report(report, farm),
        "message": "",
    }


# ---------------------------------------------------------------------------
# GET /api/reports  — Fetch reports from Supabase database
# ---------------------------------------------------------------------------

@router.get("/reports")
def list_reports(
    farmer_id: Optional[str] = None,
    farm_id: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """
    List past crop diagnosis reports taken directly from the Supabase database.
    Optional query filters: farmer_id, farm_id.
    """
    farmer_uuid = None
    if farmer_id:
        try:
            farmer_uuid = uuid.UUID(farmer_id)
        except ValueError:
            logger.debug("Non-UUID farmer_id provided (%s), skipping filter", farmer_id)

    farm_uuid = None
    if farm_id:
        try:
            farm_uuid = uuid.UUID(farm_id)
        except ValueError:
            logger.debug("Non-UUID farm_id provided (%s), skipping filter", farm_id)

    reports = report_service.get_reports_from_supabase(
        db=db,
        farmer_id=farmer_uuid,
        farm_id=farm_uuid,
        limit=limit,
    )

    return {
        "success": True,
        "data": {
            "reports": reports,
            "count": len(reports),
        },
        "message": f"Retrieved {len(reports)} reports from Supabase database.",
    }


# ---------------------------------------------------------------------------
# GET /api/farms/{farm_id}/reports
# ---------------------------------------------------------------------------

@router.get("/farms/{farm_id}/reports")
def get_farm_reports(
    farm_id: str,
    db: Session = Depends(get_db),
):
    """List all reports for a given farm, taking data from Supabase."""
    farm_uuid = None
    try:
        farm_uuid = uuid.UUID(farm_id)
    except ValueError:
        pass

    reports = report_service.get_reports_from_supabase(db=db, farm_id=farm_uuid)

    return {
        "success": True,
        "data": {
            "reports": reports,
            "count": len(reports),
        },
        "message": "",
    }


# ---------------------------------------------------------------------------
# Serialization helpers
# ---------------------------------------------------------------------------

def _serialize_report(report, farm) -> dict:
    """Build the full report dict including image_analysis (Member 2 contract)."""
    analysis = report.analysis_result

    image_analysis = None
    if analysis:
        image_analysis = {
            "disease": analysis.disease,
            "confidence": analysis.disease_confidence,
            "severity": analysis.severity,
            "affected_percentage": analysis.affected_percentage,
        }

    return {
        "id": str(report.id),
        "farm_id": str(report.farm_id),
        "crop": report.crop,
        "latitude": farm.latitude if farm else None,
        "longitude": farm.longitude if farm else None,
        "description": report.description,
        "image_url": report.image_url,
        "preferred_language": report.preferred_language,
        "status": report.status,
        "created_at": report.created_at.isoformat(),
        "image_analysis": image_analysis,
    }


def _serialize_list_item(report) -> dict:
    """Lightweight report summary for list views."""
    return {
        "id": str(report.id),
        "crop": report.crop,
        "status": report.status,
        "created_at": report.created_at.isoformat(),
        "disease": report.disease,
        "severity": report.severity,
        "image_url": report.image_url,
    }
