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
            ob_id = str(uuid.uuid4())
            now_iso = datetime.utcnow().isoformat()

            # Supabase insert with verified schema columns only
            sb_candidate = None
            try:
                payload = {
                    "id": ob_id,
                    "disease": disease,
                    "crop": crop,
                    "latitude": cluster_center_lat,
                    "longitude": cluster_center_lon,
                    "radius_km": OUTBREAK_RADIUS_KM,
                    "status": "CANDIDATE",
                }
                result = db.table("outbreaks").insert(payload).execute()
                if result.data:
                    sb_candidate = result.data[0]
            except Exception as exc:
                logger.warning("Supabase outbreak insert error: %s", exc)

            # Local ORM insert with full metrics
            try:
                from app.models.database import SessionLocal
                from app.models.report_model import Outbreak
                session = SessionLocal()
                ob = Outbreak(
                    id=uuid.UUID(ob_id),
                    disease=disease,
                    crop=crop,
                    latitude=cluster_center_lat,
                    longitude=cluster_center_lon,
                    radius_km=OUTBREAK_RADIUS_KM,
                    status="CANDIDATE",
                    report_count=len(group),
                    avg_confidence=round(avg_confidence, 3),
                    created_at=datetime.utcnow(),
                )
                session.add(ob)
                session.commit()
                session.close()
            except Exception as exc:
                logger.error("ORM outbreak candidate save error: %s", exc)

            cand = sb_candidate or {
                "id": ob_id,
                "disease": disease,
                "crop": crop,
                "latitude": cluster_center_lat,
                "longitude": cluster_center_lon,
                "radius_km": OUTBREAK_RADIUS_KM,
                "status": "CANDIDATE",
                "created_at": now_iso,
            }
            cand["report_count"] = len(group)
            cand["avg_confidence"] = round(avg_confidence, 3)
            new_candidates.append(cand)
            logger.info("New outbreak candidate: %s %s (%d reports)", disease, crop, len(group))

        return new_candidates
    except Exception as exc:
        logger.warning("detect_outbreak_candidates failed (%s). Returning empty list.", exc)
        return []


def get_outbreak_candidates() -> list[dict[str, Any]]:
    candidates = []
    try:
        db = get_supabase()
        res = (
            db.table("outbreaks")
            .select("*")
            .in_("status", ["CANDIDATE", "candidate"])
            .execute()
        )
        candidates = res.data or []
    except Exception as exc:
        logger.warning("get_outbreak_candidates Supabase query failed (%s).", exc)

    # Check ORM fallback
    from app.models.database import SessionLocal
    from app.models.report_model import Outbreak
    try:
        session = SessionLocal()
        orm_obs = session.query(Outbreak).filter(Outbreak.status == "CANDIDATE").all()
        orm_map = {str(o.id): o for o in orm_obs}
        session.close()

        # If supabase has results, enrich with ORM metrics
        if candidates:
            for c in candidates:
                matched = orm_map.get(str(c.get("id")))
                c["report_count"] = matched.report_count if matched else c.get("report_count", 3)
                c["avg_confidence"] = matched.avg_confidence if matched else c.get("avg_confidence", 0.85)
                c["created_at"] = matched.created_at.isoformat() if matched and matched.created_at else c.get("created_at")
        elif orm_obs:
            for o in orm_obs:
                candidates.append({
                    "id": str(o.id),
                    "disease": o.disease,
                    "crop": o.crop,
                    "latitude": o.latitude,
                    "longitude": o.longitude,
                    "radius_km": o.radius_km,
                    "status": o.status,
                    "report_count": o.report_count or 3,
                    "avg_confidence": o.avg_confidence or 0.85,
                    "created_at": o.created_at.isoformat() if o.created_at else None,
                })
    except Exception as exc:
        logger.warning("get_outbreak_candidates ORM check error: %s", exc)

    return candidates


def get_confirmed_outbreaks() -> list[dict[str, Any]]:
    outbreaks = []
    try:
        db = get_supabase()
        res = (
            db.table("outbreaks")
            .select("*")
            .eq("status", "CONFIRMED")
            .order("confirmed_at", desc=True)
            .execute()
        )
        outbreaks = res.data or []
    except Exception as exc:
        logger.warning("get_confirmed_outbreaks query failed (%s).", exc)

    if not outbreaks:
        try:
            from app.models.database import SessionLocal
            from app.models.report_model import Outbreak
            session = SessionLocal()
            orm_obs = session.query(Outbreak).filter(Outbreak.status == "CONFIRMED").all()
            for o in orm_obs:
                outbreaks.append({
                    "id": str(o.id),
                    "disease": o.disease,
                    "crop": o.crop,
                    "latitude": o.latitude,
                    "longitude": o.longitude,
                    "radius_km": o.radius_km,
                    "status": o.status,
                    "confirmed_at": o.confirmed_at.isoformat() if o.confirmed_at else None,
                })
            session.close()
        except Exception as exc:
            logger.error("get_confirmed_outbreaks ORM query error: %s", exc)

    return outbreaks


def confirm_outbreak(
    outbreak_id: str,
    *,
    radius_km: Optional[float] = None,
    notes: Optional[str] = None,
) -> dict[str, Any]:
    db = get_supabase()
    outbreak = None
    try:
        outbreak = (
            db.table("outbreaks").select("*").eq("id", outbreak_id).single().execute().data
        )
    except Exception:
        pass

    if not outbreak:
        # Check ORM
        from app.models.database import SessionLocal
        from app.models.report_model import Outbreak
        session = SessionLocal()
        o = session.query(Outbreak).filter(Outbreak.id == uuid.UUID(outbreak_id)).first()
        if o:
            outbreak = {
                "id": str(o.id),
                "disease": o.disease,
                "crop": o.crop,
                "latitude": o.latitude,
                "longitude": o.longitude,
                "radius_km": o.radius_km,
                "status": o.status,
            }
        session.close()

    if not outbreak:
        raise ValueError(f"Outbreak {outbreak_id} not found")

    effective_radius = radius_km or outbreak.get("radius_km") or OUTBREAK_RADIUS_KM
    disease = outbreak["disease"]
    crop = outbreak["crop"]
    center_lat = float(outbreak["latitude"])
    center_lon = float(outbreak["longitude"])
    now_iso = datetime.utcnow().isoformat()

    # 1. Update Supabase
    try:
        db.table("outbreaks").update(
            {
                "status": "CONFIRMED",
                "radius_km": effective_radius,
                "confirmed_at": now_iso,
            }
        ).eq("id", outbreak_id).execute()
    except Exception as exc:
        logger.warning("Supabase confirm_outbreak update skipped: %s", exc)

    # 2. Update ORM
    try:
        from app.models.database import SessionLocal
        from app.models.report_model import Outbreak
        session = SessionLocal()
        o = session.query(Outbreak).filter(Outbreak.id == uuid.UUID(outbreak_id)).first()
        if o:
            o.status = "CONFIRMED"
            o.radius_km = effective_radius
            o.confirmed_at = datetime.utcnow()
            o.notes = notes
            session.commit()
        session.close()
    except Exception as exc:
        logger.error("ORM confirm_outbreak update error: %s", exc)

    # 3. Find nearby farms growing this crop
    farms = []
    try:
        res = (
            db.table("farms")
            .select("id, farmer_id, latitude, longitude, crop")
            .eq("crop", crop)
            .execute()
        )
        farms = res.data or []
    except Exception:
        pass

    if not farms:
        try:
            from app.models.database import SessionLocal
            from app.models.report_model import Farm
            session = SessionLocal()
            orm_farms = session.query(Farm).filter(Farm.crop == crop).all()
            farms = [
                {
                    "id": str(f.id),
                    "farmer_id": str(f.farmer_id),
                    "latitude": f.latitude,
                    "longitude": f.longitude,
                    "crop": f.crop,
                }
                for f in orm_farms
            ]
            session.close()
        except Exception as exc:
            logger.error("ORM farms query error: %s", exc)

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
                    farmer_id=str(farmer_id),
                    disease=disease,
                    crop=crop,
                )
                notified += 1
            except Exception as exc:
                logger.warning("Failed to notify farmer %s: %s", farmer_id, exc)

    logger.info("Outbreak %s confirmed — notified %d farmers", outbreak_id, notified)
    return {"outbreak_id": outbreak_id, "status": "CONFIRMED", "farmers_notified": notified}


def reject_outbreak(outbreak_id: str, reason: Optional[str] = None) -> dict[str, Any]:
    try:
        db = get_supabase()
        db.table("outbreaks").update({"status": "REJECTED"}).eq("id", outbreak_id).execute()
    except Exception as exc:
        logger.warning("Supabase reject_outbreak skipped: %s", exc)

    try:
        from app.models.database import SessionLocal
        from app.models.report_model import Outbreak
        session = SessionLocal()
        o = session.query(Outbreak).filter(Outbreak.id == uuid.UUID(outbreak_id)).first()
        if o:
            o.status = "REJECTED"
            o.notes = reason
            session.commit()
        session.close()
    except Exception as exc:
        logger.error("ORM reject_outbreak error: %s", exc)

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
