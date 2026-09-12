"""
Outbreak Service — Combined Dev 2 (Advisory Scan) & Dev 3 (Officer Outbreak Management)
"""

from __future__ import annotations

import logging
import math
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from app.database import get_supabase
from app.services.notification_service import notify_outbreak_alert

logger = logging.getLogger(__name__)

# Configurable thresholds
RADIUS_KM: float = float(os.getenv("OUTBREAK_RADIUS_KM", "25.0"))
WINDOW_DAYS: int = int(os.getenv("OUTBREAK_WINDOW_DAYS", "14"))
OUTBREAK_RADIUS_KM = RADIUS_KM
OUTBREAK_MIN_REPORTS: int = int(os.getenv("OUTBREAK_MIN_REPORTS", "3"))
OUTBREAK_WINDOW_DAYS = WINDOW_DAYS
THRESHOLD_MEDIUM: int = int(os.getenv("OUTBREAK_MEDIUM_THRESHOLD", "1"))
THRESHOLD_HIGH: int = int(os.getenv("OUTBREAK_HIGH_THRESHOLD", "3"))


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in km between two WGS-84 coordinates."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _score(count: int) -> str:
    if count == 0:
        return "LOW"
    if count <= THRESHOLD_MEDIUM + 1:
        return "MEDIUM"
    return "HIGH"


# ── Dev 2: Farmer Advisory Nearby Scan ───────────────────────────────────────

async def check_nearby_outbreak(
    report_id: str,
    latitude: float,
    longitude: float,
    crop: str,
    predicted_disease: str,
    radius_km: float = RADIUS_KM,
    window_days: int = WINDOW_DAYS,
) -> Dict[str, Any]:
    """Find recent reports with matching crop + disease within radius_km."""
    supabase = get_supabase()
    cutoff = (
        datetime.now(tz=timezone.utc) - timedelta(days=window_days)
    ).isoformat()

    try:
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


# ── Dev 3: Officer Outbreak Management & Map ─────────────────────────────────

def detect_outbreak_candidates() -> list[dict[str, Any]]:
    """Scans recent reports and creates CANDIDATE outbreak rows where clusters exist."""
    try:
        db = get_supabase()
        cutoff = (datetime.utcnow() - timedelta(days=OUTBREAK_WINDOW_DAYS)).isoformat()

        reports_raw = (
            db.table("reports")
            .select("id, disease, crop, confidence, severity, created_at, farms(latitude, longitude, district)")
            .gte("created_at", cutoff)
            .not_.is_("disease", "null")
            .execute()
            .data
        )

        groups: dict[str, list[dict]] = {}
        for r in (reports_raw or []):
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
    except Exception as exc:
        logger.warning("detect_outbreak_candidates failed (%s). Returning empty list.", exc)
        return []


def get_outbreak_candidates() -> list[dict[str, Any]]:
    try:
        db = get_supabase()
        res = (
            db.table("outbreaks")
            .select("*")
            .in_("status", ["CANDIDATE"])
            .order("created_at", desc=True)
            .execute()
        )
        return res.data or []
    except Exception as exc:
        logger.warning("get_outbreak_candidates query failed (%s). Returning empty list.", exc)
        return []


def get_confirmed_outbreaks() -> list[dict[str, Any]]:
    try:
        db = get_supabase()
        res = (
            db.table("outbreaks")
            .select("*")
            .eq("status", "CONFIRMED")
            .order("confirmed_at", desc=True)
            .execute()
        )
        return res.data or []
    except Exception as exc:
        logger.warning("get_confirmed_outbreaks query failed (%s). Returning empty list.", exc)
        return []


def confirm_outbreak(
    outbreak_id: str,
    *,
    radius_km: Optional[float] = None,
    notes: Optional[str] = None,
) -> dict[str, Any]:
    db = get_supabase()
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

    db.table("outbreaks").update(
        {
            "status": "CONFIRMED",
            "radius_km": effective_radius,
            "confirmed_at": datetime.utcnow().isoformat(),
            "notes": notes,
        }
    ).eq("id", outbreak_id).execute()

    farms = (
        db.table("farms")
        .select("id, farmer_id, latitude, longitude, crop")
        .eq("crop", crop)
        .execute()
        .data
    )

    notified = 0
    for farm in (farms or []):
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
            except Exception as exc:
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
    try:
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

        res = q.execute()
        if res.data:
            return res.data
    except Exception as exc:
        logger.warning("Supabase map_reports query failed (%s). Falling back to local ORM.", exc)

    # Fallback to local ORM
    from app.models.database import SessionLocal
    from app.models.report_model import Report
    session = SessionLocal()
    try:
        q = session.query(Report)
        if crop:
            q = q.filter(Report.crop == crop)
        if disease:
            q = q.filter(Report.disease == disease)
        if severity:
            q = q.filter(Report.severity == severity)
        if status:
            q = q.filter(Report.status == status)

        results = []
        for r in q.order_by(Report.created_at.desc()).limit(100).all():
            farm_info = {}
            if r.farm:
                farm_info = {
                    "latitude": r.farm.latitude,
                    "longitude": r.farm.longitude,
                    "district": r.farm.district,
                }
            results.append({
                "id": str(r.id),
                "crop": r.crop,
                "disease": r.disease,
                "confidence": r.confidence,
                "severity": r.severity,
                "spread_risk": r.spread_risk,
                "status": r.status,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "farms": farm_info,
            })
        return results
    except Exception as exc:
        logger.error("ORM map_reports query failed: %s", exc)
        return []
    finally:
        session.close()
