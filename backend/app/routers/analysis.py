"""
analysis.py – Dev 2

Main orchestration router.

Endpoints:
  POST /api/reports/{report_id}/complete-analysis
  GET  /api/reports/{report_id}/advice           (re-generate advice in a different language)
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.ai.diagnosis_aggregator import aggregate_diagnosis
from app.ai.treatment_advisor import generate_treatment_advice
from app.schemas.analysis_schemas import CompleteAnalysisRequest, err, ok
from app.services.outbreak_service import check_nearby_outbreak
from app.services.weather_service import get_weather_risk
from app.utils.db import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/reports", tags=["Analysis"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _fmt_weather(w: dict) -> str:
    return (
        f"Temperature {w.get('temperature', '?')}°C, "
        f"Humidity {w.get('humidity', '?')}%, "
        f"Rainfall {w.get('rainfall', '?')} mm"
    )


async def _load_report_and_farm(report_id: str) -> tuple[dict, dict]:
    """Load report + its farm from DB.  Raises HTTPException on missing data."""
    sb = get_supabase()
    try:
        res = (
            sb.table("reports")
            .select("*, farms(id, latitude, longitude, crop, district, farmer_id)")
            .eq("id", report_id)
            .single()
            .execute()
        )
    except Exception as exc:
        logger.error("DB error loading report %s: %s", report_id, exc)
        raise HTTPException(status_code=503, detail="Database error while loading report.")

    report = res.data
    if not report:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found.")

    farm = report.get("farms")
    if not farm:
        raise HTTPException(status_code=422, detail="Report is not linked to a farm with coordinates.")

    return report, farm


async def _existing_analysis(report_id: str) -> Optional[dict]:
    """Return the saved analysis_results row if it exists, else None."""
    sb = get_supabase()
    try:
        res = (
            sb.table("analysis_results")
            .select("*")
            .eq("report_id", report_id)
            .execute()
        )
        rows = res.data or []
        return rows[0] if rows else None
    except Exception as exc:
        logger.warning("Could not check existing analysis: %s", exc)
        return None


async def _save_analysis(report_id: str, weather: dict, outbreak: dict, aggregation: dict) -> None:
    """Persist the analysis_results row (idempotent upsert)."""
    sb = get_supabase()
    payload = {
        "report_id": report_id,
        "disease": aggregation["final_disease"],
        "disease_confidence": aggregation["final_confidence"],
        "severity": None,          # stored on reports row; reference only
        "weather_risk": weather.get("weather_risk"),
        "outbreak_risk": outbreak.get("outbreak_risk"),
        "final_confidence": aggregation["final_confidence"],
        "spread_risk": aggregation["spread_risk"],
    }
    try:
        sb.table("analysis_results").upsert(payload, on_conflict="report_id").execute()
    except Exception as exc:
        logger.error("Failed to save analysis_results: %s", exc)


async def _create_officer_ticket(report_id: str, reasons: list[str], outbreak_risk: str) -> None:
    """Stub an officer_tickets row.  Member 3 handles the full workflow."""
    sb = get_supabase()
    priority = "HIGH" if outbreak_risk == "HIGH" else "MEDIUM"
    try:
        sb.table("officer_tickets").insert({
            "report_id": report_id,
            "reason": " | ".join(reasons),
            "priority": priority,
            "status": "open",
        }).execute()
    except Exception as exc:
        logger.warning("Could not create officer ticket: %s", exc)


async def _create_outbreak_candidate(report_id: str, report: dict, farm: dict, outbreak: dict) -> None:
    """Insert a candidate row into the outbreaks table for Member 3 to review."""
    sb = get_supabase()
    try:
        existing = (
            sb.table("outbreaks")
            .select("id")
            .eq("disease", report.get("disease"))
            .eq("status", "suspected")
            .execute()
        )
        if existing.data:
            return  # candidate already exists
        sb.table("outbreaks").insert({
            "disease": report.get("disease"),
            "crop": report.get("crop") or farm.get("crop"),
            "latitude": farm.get("latitude"),
            "longitude": farm.get("longitude"),
            "radius_km": outbreak.get("radius_km", 5),
            "status": "suspected",
        }).execute()
    except Exception as exc:
        logger.warning("Could not create outbreak candidate: %s", exc)


async def _notify_farmer(farmer_id: str, report_id: str, disease: str, decision: str) -> None:
    """Insert a notification row for the farmer."""
    sb = get_supabase()
    msg_map = {
        "AUTO_ADVICE":       f"Your crop diagnosis is ready: {disease}. Treatment advice is available.",
        "NEED_MORE_INFO":    f"More information is needed to diagnose your crop. Please upload an additional photo.",
        "OFFICER_REVIEW":    f"Your report for {disease} has been sent to an agriculture officer for review.",
        "OUTBREAK_WARNING":  f"ALERT: A potential outbreak of {disease} has been detected in your area.",
    }
    try:
        sb.table("notifications").insert({
            "user_id": farmer_id,
            "report_id": report_id,
            "type": decision,
            "message": msg_map.get(decision, f"Diagnosis update for {disease}."),
            "read": False,
        }).execute()
    except Exception as exc:
        logger.warning("Could not create notification: %s", exc)


# ── POST /api/reports/{report_id}/complete-analysis ──────────────────────────

@router.post("/{report_id}/complete-analysis")
async def complete_analysis(
    report_id: str,
    body: CompleteAnalysisRequest = CompleteAnalysisRequest(),
):
    """
    Orchestrate the full Dev-2 pipeline:
      1. Load Member 1's report data.
      2. Weather risk check.
      3. Nearby outbreak check.
      4. Diagnosis aggregation (deterministic).
      5. Persist analysis_results row.
      6. Generate treatment advice (LLM, if decision = AUTO_ADVICE | OUTBREAK_WARNING).
      7. Stub officer_ticket if needed (Member 3 owns the workflow).
      8. Stub outbreak candidate if risk is HIGH.
      9. Notify farmer.
     10. Return full response.

    This endpoint is idempotent — if analysis already exists it is returned
    without re-running the pipeline.
    """
    preferred_language = body.preferred_language or "en"

    # ── 0. Idempotency check ──────────────────────────────────────────────────
    existing = await _existing_analysis(report_id)
    if existing:
        # Re-generate advice in the requested language if needed
        # (cheap — reuses saved analysis data)
        report, farm = await _load_report_and_farm(report_id)
        if existing.get("disease"):
            weather_summary = _fmt_weather({
                "temperature": 0, "humidity": 0, "rainfall": 0
            })
            advice = await generate_treatment_advice(
                disease=existing["disease"],
                severity=report.get("severity", "MODERATE"),
                spread_risk=existing.get("spread_risk", "LOW"),
                outbreak_risk=existing.get("outbreak_risk", "LOW"),
                weather_summary=weather_summary,
                language=preferred_language,
            )
            return ok({
                "report_id": report_id,
                "diagnosis": {
                    "disease": existing["disease"],
                    "confidence": existing["final_confidence"],
                },
                "severity": report.get("severity", "MODERATE"),
                "weather": {"risk": existing.get("weather_risk", "LOW")},
                "outbreak": {"risk": existing.get("outbreak_risk", "LOW")},
                "spread_risk": existing.get("spread_risk", "LOW"),
                "decision": "AUTO_ADVICE",
                "reasons": ["Analysis already completed — returning cached result."],
                "farmer_advice": advice,
                "needs_additional_photo": False,
            }, "Cached analysis returned.")

    # ── 1. Load report + farm ─────────────────────────────────────────────────
    report, farm = await _load_report_and_farm(report_id)

    disease: str = report.get("disease") or ""
    if not disease:
        raise HTTPException(
            status_code=422,
            detail="Report does not yet have a disease prediction. Run Member 1's image analysis first.",
        )

    raw_confidence = report.get("confidence", 0.5)
    # confidence may be stored as 0-100 (percentage) or 0-1 (fraction)
    image_confidence = float(raw_confidence) / 100 if float(raw_confidence) > 1 else float(raw_confidence)
    severity: str = report.get("severity") or "MODERATE"
    crop: str = report.get("crop") or farm.get("crop") or ""
    latitude: float = float(farm["latitude"])
    longitude: float = float(farm["longitude"])
    farmer_id: str = farm.get("farmer_id") or ""

    # ── 2. Weather check ──────────────────────────────────────────────────────
    weather = await get_weather_risk(latitude, longitude, disease)

    # ── 3. Outbreak check ─────────────────────────────────────────────────────
    outbreak = await check_nearby_outbreak(
        report_id=report_id,
        latitude=latitude,
        longitude=longitude,
        crop=crop,
        predicted_disease=disease,
    )

    # ── 4. Diagnosis aggregation ──────────────────────────────────────────────
    aggregation = aggregate_diagnosis(
        disease=disease,
        image_confidence=image_confidence,
        severity=severity,
        weather_risk=weather["weather_risk"],
        weather_supports=weather["supports_prediction"],
        nearby_case_count=outbreak["nearby_case_count"],
        outbreak_risk=outbreak["outbreak_risk"],
    )
    decision: str = aggregation["decision"]
    spread_risk: str = aggregation["spread_risk"]

    # ── 5. Persist analysis ───────────────────────────────────────────────────
    await _save_analysis(report_id, weather, outbreak, aggregation)

    # Update reports.spread_risk and reports.status
    try:
        get_supabase().table("reports").update({
            "spread_risk": spread_risk,
            "status": "analyzed",
        }).eq("id", report_id).execute()
    except Exception as exc:
        logger.warning("Could not update report status: %s", exc)

    # ── 6. Treatment advice (LLM) ─────────────────────────────────────────────
    farmer_advice = None
    needs_additional_photo = False
    weather_summary = _fmt_weather(weather)

    if decision in ("AUTO_ADVICE", "OUTBREAK_WARNING"):
        farmer_advice = await generate_treatment_advice(
            disease=aggregation["final_disease"],
            severity=severity,
            spread_risk=spread_risk,
            outbreak_risk=outbreak["outbreak_risk"],
            weather_summary=weather_summary,
            language=preferred_language,
        )

    elif decision == "NEED_MORE_INFO":
        needs_additional_photo = True

    # ── 7. Officer ticket stub ────────────────────────────────────────────────
    if decision in ("OFFICER_REVIEW", "OUTBREAK_WARNING"):
        await _create_officer_ticket(report_id, aggregation["reasons"], outbreak["outbreak_risk"])

    # ── 8. Outbreak candidate ─────────────────────────────────────────────────
    if outbreak["outbreak_risk"] == "HIGH":
        await _create_outbreak_candidate(report_id, report, farm, outbreak)

    # ── 9. Farmer notification ────────────────────────────────────────────────
    if farmer_id:
        await _notify_farmer(farmer_id, report_id, disease, decision)

    # ── 10. Response ──────────────────────────────────────────────────────────
    return ok(
        {
            "report_id": report_id,
            "diagnosis": {
                "disease": aggregation["final_disease"],
                "confidence": aggregation["final_confidence"],
            },
            "severity": severity,
            "weather": {
                "temperature": weather["temperature"],
                "humidity": weather["humidity"],
                "rainfall": weather["rainfall"],
                "risk": weather["weather_risk"],
            },
            "outbreak": {
                "nearby_cases": outbreak["nearby_case_count"],
                "radius_km": outbreak["radius_km"],
                "risk": outbreak["outbreak_risk"],
            },
            "spread_risk": spread_risk,
            "decision": decision,
            "reasons": aggregation["reasons"],
            "farmer_advice": farmer_advice,
            "needs_additional_photo": needs_additional_photo,
        },
        "Analysis complete.",
    )


# ── GET /api/reports/{report_id}/advice ───────────────────────────────────────

@router.get("/{report_id}/advice")
async def get_advice_in_language(
    report_id: str,
    language: str = Query(default="en", regex="^(en|si|ta)$"),
):
    """
    Re-generate farmer advice in a different language without re-running the
    full analysis pipeline.  Reads the saved analysis_results row.
    """
    existing = await _existing_analysis(report_id)
    if not existing:
        raise HTTPException(
            status_code=404,
            detail="No analysis found for this report. Run complete-analysis first.",
        )

    report, _ = await _load_report_and_farm(report_id)
    disease = existing.get("disease") or report.get("disease") or ""
    severity = report.get("severity", "MODERATE")
    spread_risk = existing.get("spread_risk", "LOW")
    outbreak_risk = existing.get("outbreak_risk", "LOW")

    advice = await generate_treatment_advice(
        disease=disease,
        severity=severity,
        spread_risk=spread_risk,
        outbreak_risk=outbreak_risk,
        weather_summary="(weather data not re-fetched for language change)",
        language=language,
    )
    return ok(advice, f"Advice in '{language}'.")
