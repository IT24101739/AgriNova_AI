"""
weather.py – Dev 2

Simple GET endpoint so the frontend can fetch weather risk independently.

  GET /api/weather/risk?report_id=<uuid>
  GET /api/weather/risk?lat=<float>&lon=<float>&disease=<str>
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.schemas.analysis_schemas import err, ok
from app.services.weather_service import get_weather_risk
from app.utils.db import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/weather", tags=["Weather"])


@router.get("/risk")
async def weather_risk(
    report_id: Optional[str] = Query(default=None),
    lat: Optional[float] = Query(default=None),
    lon: Optional[float] = Query(default=None),
    disease: Optional[str] = Query(default=""),
):
    """
    Return weather risk for a location.

    Supply EITHER:
      • report_id  – coordinates and disease are read from the DB
      • lat + lon  – coordinates supplied directly (disease optional)
    """
    if report_id:
        data = None
        try:
            sb = get_supabase()
            res = (
                sb.table("reports")
                .select("disease, farms(latitude, longitude)")
                .eq("id", report_id)
                .single()
                .execute()
            )
            data = res.data
        except Exception as exc:
            logger.warning("Supabase weather lookup not available (%s). Trying local ORM.", exc)

        if not data:
            from app.models.database import SessionLocal
            from app.models.report_model import Report
            import uuid
            db = SessionLocal()
            try:
                rep = db.query(Report).filter(Report.id == uuid.UUID(str(report_id))).first()
                if rep:
                    data = {
                        "disease": rep.disease or "",
                        "farms": {
                            "latitude": rep.farm.latitude if rep.farm else 6.9271,
                            "longitude": rep.farm.longitude if rep.farm else 79.8612,
                        },
                    }
            except Exception as e:
                logger.error("ORM lookup in weather failed: %s", e)
            finally:
                db.close()

        if not data:
            raise HTTPException(status_code=404, detail="Report not found.")

        farm = data.get("farms") or {}
        latitude = farm.get("latitude")
        longitude = farm.get("longitude")
        disease_name = data.get("disease") or ""

        if latitude is None or longitude is None:
            latitude = 6.9271
            longitude = 79.8612

    elif lat is not None and lon is not None:
        latitude = lat
        longitude = lon
        disease_name = disease or ""

    else:
        raise HTTPException(
            status_code=422,
            detail="Provide either report_id or both lat and lon query parameters.",
        )

    result = await get_weather_risk(float(latitude), float(longitude), disease_name)
    return ok(result, "Weather risk calculated.")
