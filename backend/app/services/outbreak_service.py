"""
outbreak_service.py – Dev 2

Scans the shared `reports` table for nearby same-disease / same-crop reports
within a configurable radius and time window. Uses the Haversine formula —
no PostGIS extension required.

All thresholds are configurable via environment variables.
NO LLM is involved here – fully deterministic.
"""

from __future__ import annotations

import logging
import math
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

from app.utils.db import get_supabase

logger = logging.getLogger(__name__)

# ── Configurable thresholds ───────────────────────────────────────────────────
RADIUS_KM: float = float(os.getenv("OUTBREAK_RADIUS_KM", "5.0"))
WINDOW_DAYS: int = int(os.getenv("OUTBREAK_WINDOW_DAYS", "7"))
THRESHOLD_MEDIUM: int = int(os.getenv("OUTBREAK_MEDIUM_THRESHOLD", "1"))
THRESHOLD_HIGH: int = int(os.getenv("OUTBREAK_HIGH_THRESHOLD", "3"))


# ── Haversine ─────────────────────────────────────────────────────────────────

def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in km between two WGS-84 coordinates."""
    R = 6_371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ── Risk scoring ──────────────────────────────────────────────────────────────

def _score(count: int) -> str:
    if count == 0:
        return "LOW"
    if count <= THRESHOLD_MEDIUM + 1:   # 1-2  → MEDIUM
        return "MEDIUM"
    return "HIGH"                        # 3+   → HIGH


# ── Main function ─────────────────────────────────────────────────────────────

async def check_nearby_outbreak(
    report_id: str,
    latitude: float,
    longitude: float,
    crop: str,
    predicted_disease: str,
    radius_km: float = RADIUS_KM,
    window_days: int = WINDOW_DAYS,
) -> Dict[str, Any]:
    """
    Find recent reports with matching crop + disease within *radius_km*.

    Args:
        report_id:          The current report being analysed (excluded from results).
        latitude / longitude: Farm coordinates.
        crop:               Crop type (must match DB value exactly).
        predicted_disease:  Disease string from Member 1's classifier.
        radius_km:          Search radius (km).
        window_days:        How many past days to look back.

    Returns:
        {
            "nearby_case_count":   int,
            "radius_km":           float,
            "outbreak_risk":       "LOW" | "MEDIUM" | "HIGH",
            "matching_report_ids": [str, ...],
        }
    """
    supabase = get_supabase()
    cutoff = (
        datetime.now(tz=timezone.utc) - timedelta(days=window_days)
    ).isoformat()

    try:
        # Pull candidate rows – filter on disease + crop server-side to keep
        # the result set small before Haversine filtering in Python.
        result = (
            supabase.table("reports")
            .select("id, disease, crop, created_at, farms(latitude, longitude)")
            .eq("crop", crop)
            .eq("disease", predicted_disease)
            .gte("created_at", cutoff)
            .neq("id", report_id)
            .execute()
        )
        candidates: List[dict] = result.data or []
    except Exception as exc:
        logger.error("Outbreak DB query failed: %s", exc)
        return {
            "nearby_case_count": 0,
            "radius_km": radius_km,
            "outbreak_risk": "LOW",
            "matching_report_ids": [],
            "db_error": str(exc),
        }

    matching_ids: List[str] = []
    for row in candidates:
        farm = row.get("farms") or {}
        farm_lat = farm.get("latitude")
        farm_lon = farm.get("longitude")
        if farm_lat is None or farm_lon is None:
            continue
        dist = _haversine_km(latitude, longitude, float(farm_lat), float(farm_lon))
        if dist <= radius_km:
            matching_ids.append(row["id"])

    count = len(matching_ids)
    return {
        "nearby_case_count": count,
        "radius_km": radius_km,
        "outbreak_risk": _score(count),
        "matching_report_ids": matching_ids,
    }
