"""
Outbreak Service
─────────────────
Detects, confirms, and manages regional disease outbreaks.

Detection algorithm:
  1. Group all OPEN/ACTIVE reports by disease + crop.
  2. For groups with >= OUTBREAK_MIN_REPORTS reports within OUTBREAK_WINDOW_DAYS:
     a. Check that at least 2 are within OUTBREAK_RADIUS_KM of each other.
     b. Create an outbreaks row with status=CANDIDATE if not already present.
"""
from __future__ import annotations

import logging
import math
import os
import uuid
from datetime import datetime, timedelta
from typing import Any, Optional

from app.database import get_supabase
from app.services.notification_service import notify_outbreak_alert

logger = logging.getLogger(__name__)

OUTBREAK_RADIUS_KM = float(os.getenv("OUTBREAK_RADIUS_KM", "25"))
OUTBREAK_MIN_REPORTS = int(os.getenv("OUTBREAK_MIN_REPORTS", "3"))
OUTBREAK_WINDOW_DAYS = int(os.getenv("OUTBREAK_WINDOW_DAYS", "14"))


# ── Haversine distance ────────────────────────────────────────────────────────

def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


# ── Detection ─────────────────────────────────────────────────────────────────

def detect_outbreak_candidates() -> list[dict[str, Any]]:
    """
    Scans recent reports and creates CANDIDATE outbreak rows where clusters exist.
    Returns list of newly created or existing candidate records.
    """
    db = get_supabase()
    cutoff = (datetime.utcnow() - timedelta(days=OUTBREAK_WINDOW_DAYS)).isoformat()

    # Pull recent reports with location
    reports_raw = (
        db.table("reports")
        .select("id, disease, crop, confidence, severity, created_at, farms(latitude, longitude, district)")
        .gte("created_at", cutoff)
        .not_.is_("disease", "null")
        .execute()
        .data
    )

    # Group by disease+crop
    groups: dict[str, list[dict]] = {}
    for r in reports_raw:
        farm = r.get("farms") or {}
        lat = farm.get("latitude")
        lon = farm.get("longitude")
        if lat is None or lon is None:
            continue
        key = f"{r['disease']}|{r['crop']}"
        groups.setdefault(key, []).append({**r, "_lat": float(lat), "_lon": float(lon)})

    new_candidates = []
    for key, group in groups.items():
        if len(group) < OUTBREAK_MIN_REPORTS:
            continue

        # Check spatial proximity – at least 2 pairs within radius
        cluster_center_lat = sum(r["_lat"] for r in group) / len(group)
        cluster_center_lon = sum(r["_lon"] for r in group) / len(group)
        close_pairs = 0
        for i in range(len(group)):
            for j in range(i + 1, len(group)):
                d = _haversine_km(
                    group[i]["_lat"], group[i]["_lon"],
                    group[j]["_lat"], group[j]["_lon"],
                )
                if d <= OUTBREAK_RADIUS_KM:
                    close_pairs += 1
                    if close_pairs >= 2:
                        break
            if close_pairs >= 2:
                break

        if close_pairs < 2:
            continue

        disease, crop = key.split("|", 1)

        # Avoid duplicate candidates
        existing = (
            db.table("outbreaks")
            .select("id, status")
            .eq("disease", disease)
            .eq("crop", crop)
            .in_("status", ["CANDIDATE", "CONFIRMED"])
            .execute()
            .data
        )
        if existing:
            continue

        avg_confidence = sum(r.get("confidence") or 0 for r in group) / len(group)
        payload = {
            "id": str(uuid.uuid4()),
            "disease": disease,
            "crop": crop,
            "latitude": cluster_center_lat,
            "longitude": cluster_center_lon,
            "radius_km": OUTBREAK_RADIUS_KM,
            "status": "CANDIDATE",
            "report_count": len(group),
            "avg_confidence": round(avg_confidence, 3),
            "created_at": datetime.utcnow().isoformat(),
        }
        result = db.table("outbreaks").insert(payload).execute()
        new_candidates.append(result.data[0])
        logger.info("New outbreak candidate: %s %s (%d reports)", disease, crop, len(group))

    return new_candidates


def get_outbreak_candidates() -> list[dict[str, Any]]:
    db = get_supabase()
    return (
        db.table("outbreaks")
        .select("*")
        .in_("status", ["CANDIDATE"])
        .order("created_at", desc=True)
        .execute()
        .data
    )


def get_confirmed_outbreaks() -> list[dict[str, Any]]:
    db = get_supabase()
    return (
        db.table("outbreaks")
        .select("*")
        .eq("status", "CONFIRMED")
        .order("confirmed_at", desc=True)
        .execute()
        .data
    )


# ── Confirm / Reject ──────────────────────────────────────────────────────────

def confirm_outbreak(
    outbreak_id: str,
    *,
    radius_km: Optional[float] = None,
    notes: Optional[str] = None,
) -> dict[str, Any]:
    """
    Confirm an outbreak candidate.
    1. Update outbreak status → CONFIRMED.
    2. Find all farms within radius growing the same crop.
    3. Notify their farmers.
    """
    db = get_supabase()

    # Fetch outbreak
    outbreak = (
        db.table("outbreaks").select("*").eq("id", outbreak_id).single().execute().data
    )
    if not outbreak:
        raise ValueError(f"Outbreak {outbreak_id} not found")

    effective_radius = radius_km or outbreak.get("radius_km") or OUTBREAK_RADIUS_KM
    disease = outbreak["disease"]
    crop = outbreak["crop"]
    center_lat = float(outbreak["latitude"])
    center_lon = float(outbreak["longitude"])

    # Update to confirmed
    db.table("outbreaks").update(
        {
            "status": "CONFIRMED",
            "radius_km": effective_radius,
            "confirmed_at": datetime.utcnow().isoformat(),
            "notes": notes,
        }
    ).eq("id", outbreak_id).execute()

    # Find farms growing same crop
    farms = (
        db.table("farms")
        .select("id, farmer_id, latitude, longitude, crop")
        .eq("crop", crop)
        .execute()
        .data
    )

    notified = 0
    for farm in farms:
        lat = farm.get("latitude")
        lon = farm.get("longitude")
        farmer_id = farm.get("farmer_id")
        if not all([lat, lon, farmer_id]):
            continue
        dist = _haversine_km(center_lat, center_lon, float(lat), float(lon))
        if dist <= effective_radius:
            try:
                notify_outbreak_alert(
                    farmer_id=farmer_id,
                    disease=disease,
                    crop=crop,
                )
                notified += 1
            except Exception as exc:  # noqa: BLE001
                logger.warning("Failed to notify farmer %s: %s", farmer_id, exc)

    logger.info("Outbreak %s confirmed — notified %d farmers", outbreak_id, notified)
    return {"outbreak_id": outbreak_id, "status": "CONFIRMED", "farmers_notified": notified}


def reject_outbreak(outbreak_id: str, reason: Optional[str] = None) -> dict[str, Any]:
    db = get_supabase()
    db.table("outbreaks").update(
        {"status": "REJECTED", "notes": reason, "updated_at": datetime.utcnow().isoformat()}
    ).eq("id", outbreak_id).execute()
    return {"outbreak_id": outbreak_id, "status": "REJECTED"}


def get_map_reports(
    crop: Optional[str] = None,
    disease: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
) -> list[dict[str, Any]]:
    """Geo-tagged reports for the regional map."""
    db = get_supabase()
    q = (
        db.table("reports")
        .select(
            "id, crop, disease, confidence, severity, spread_risk, status, created_at, "
            "farms(latitude, longitude, district)"
        )
        .not_.is_("farms.latitude", "null")
    )
    if crop:
        q = q.eq("crop", crop)
    if disease:
        q = q.eq("disease", disease)
    if severity:
        q = q.eq("severity", severity)
    if status:
        q = q.eq("status", status)

    return q.execute().data
