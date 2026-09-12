"""
additional_image.py – Dev 2

Handles submission of an additional photo for NEED_MORE_INFO cases.

  POST /api/reports/{report_id}/additional-image

Workflow:
  1. Receive image file upload.
  2. Store the file in Supabase Storage (same bucket as Member 1).
  3. Call Member 1's image-analysis service to classify the new photo.
  4. Update the report row with the new disease / confidence values.
  5. Trigger complete-analysis again with the refreshed data.
  6. Return the updated analysis.

NOTE: Member 1 owns the image classifier.  This module calls their
internal endpoint (/api/image/analyze) rather than duplicating the model.
The URL is configured via the MEMBER1_API_BASE env var.
"""

from __future__ import annotations

import logging
import os
import uuid
from io import BytesIO

import httpx
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.schemas.analysis_schemas import CompleteAnalysisRequest, err, ok
from app.utils.db import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/reports", tags=["Additional Image"])

MEMBER1_API_BASE: str = os.getenv("MEMBER1_API_BASE", "http://localhost:8000")
STORAGE_BUCKET: str = os.getenv("SUPABASE_STORAGE_BUCKET", "crop-images")


async def _upload_to_storage(report_id: str, file_bytes: bytes, content_type: str) -> str:
    """Upload image bytes to Supabase Storage and return the public URL."""
    sb = get_supabase()
    filename = f"additional/{report_id}/{uuid.uuid4()}.jpg"
    try:
        sb.storage.from_(STORAGE_BUCKET).upload(
            path=filename,
            file=file_bytes,
            file_options={"content-type": content_type},
        )
        public_url = sb.storage.from_(STORAGE_BUCKET).get_public_url(filename)
        return public_url
    except Exception as exc:
        logger.error("Supabase Storage upload failed: %s", exc)
        raise HTTPException(status_code=503, detail="Failed to upload image to storage.")


async def _call_member1_classifier(image_url: str, crop: str) -> dict:
    """
    Call Member 1's image classification endpoint.
    Returns { disease, confidence, severity }.
    """
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{MEMBER1_API_BASE}/api/image/analyze",
                json={"image_url": image_url, "crop": crop},
            )
            resp.raise_for_status()
            body = resp.json()
            return body.get("data", {})
    except Exception as exc:
        logger.error("Member 1 classifier call failed: %s", exc)
        raise HTTPException(
            status_code=502,
            detail="Image analysis service is unavailable. Please try again later.",
        )


@router.post("/{report_id}/additional-image")
async def submit_additional_image(
    report_id: str,
    image: UploadFile = File(..., description="Additional crop/leaf photo"),
):
    """
    Accept an additional photo for a NEED_MORE_INFO report,
    re-classify it, and re-run the full analysis pipeline.

    Returns the updated complete-analysis result.
    """
    sb = get_supabase()

    # ── Load the original report ──────────────────────────────────────────────
    try:
        res = (
            sb.table("reports")
            .select("*, farms(latitude, longitude, crop)")
            .eq("id", report_id)
            .single()
            .execute()
        )
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"DB error: {exc}")

    report = res.data
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    if report.get("status") not in (None, "pending", "need_more_info", "analyzed"):
        raise HTTPException(
            status_code=409,
            detail=f"Report status is '{report.get('status')}' — cannot submit additional image.",
        )

    farm = report.get("farms") or {}
    crop = report.get("crop") or farm.get("crop") or "unknown"

    # ── Validate file type ────────────────────────────────────────────────────
    allowed_types = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
    content_type = image.content_type or "image/jpeg"
    if content_type not in allowed_types:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{content_type}'. Please upload a JPEG or PNG image.",
        )

    # ── Upload to Supabase Storage ────────────────────────────────────────────
    file_bytes = await image.read()
    if len(file_bytes) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(status_code=413, detail="Image file must be smaller than 10 MB.")

    image_url = await _upload_to_storage(report_id, file_bytes, content_type)

    # ── Call Member 1's classifier ────────────────────────────────────────────
    classifier_result = await _call_member1_classifier(image_url, crop)

    new_disease = classifier_result.get("disease") or report.get("disease")
    new_confidence = classifier_result.get("confidence") or report.get("confidence")
    new_severity = classifier_result.get("severity") or report.get("severity")

    # ── Update the report row with new prediction ─────────────────────────────
    try:
        sb.table("reports").update({
            "disease": new_disease,
            "confidence": new_confidence,
            "severity": new_severity,
            "image_url": image_url,
            "status": "re_analyzed",
        }).eq("id", report_id).execute()
    except Exception as exc:
        logger.error("Failed to update report: %s", exc)
        raise HTTPException(status_code=503, detail="Failed to update report with new image data.")

    # ── Clear existing analysis so complete-analysis re-runs fresh ────────────
    try:
        sb.table("analysis_results").delete().eq("report_id", report_id).execute()
    except Exception as exc:
        logger.warning("Could not clear old analysis: %s", exc)

    # ── Trigger complete-analysis (internal redirect) ─────────────────────────
    # We import and call the service functions directly to avoid an HTTP hop.
    from app.routers.analysis import complete_analysis

    return await complete_analysis(
        report_id=report_id,
        body=CompleteAnalysisRequest(preferred_language="en"),
    )
