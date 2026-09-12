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
        sb = get_supabase()
        try:
            res = (
                sb.table("reports")
                .select("disease, farms(latitude, longitude)")
                .eq("id", report_id)
                .single()
                .execute()
            )
        except Exception as exc:
            raise HTTPException(status_code=503, detail=f"DB error: {exc}")

        data = res.data
        if not data:
            raise HTTPException(status_code=404, detail="Report not found.")

        farm = data.get("farms") or {}
        latitude = farm.get("latitude")
        longitude = farm.get("longitude")
        disease_name = data.get("disease") or ""

        if latitude is None or longitude is None:
            raise HTTPException(status_code=422, detail="Report farm has no coordinates.")

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
