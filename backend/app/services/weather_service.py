"""
weather_service.py – Dev 2

Fetches recent weather from Open-Meteo (free, no API key required) and
applies deterministic disease-support rules.

NO LLM is involved here – all logic is pure Python.
"""

from __future__ import annotations

import logging
from typing import Any, Dict

import httpx

logger = logging.getLogger(__name__)

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

# Disease categories that thrive under high-humidity / wet conditions
_FUNGAL_KEYWORDS = [
    "blight",
    "mold",
    "mould",
    "rust",
    "brown spot",
    "leaf blast",
    "black rot",
    "scab",
    "anthracnose",
    "downy mildew",
    "powdery mildew",
    "septoria",
    "gray leaf spot",
    "grey leaf spot",
]

_BACTERIAL_KEYWORDS = [
    "bacterial",
    "xanthomonas",
    "pseudomonas",
]


def _classify_disease(disease: str) -> str:
    """Return 'fungal', 'bacterial', or 'other'."""
    dl = disease.lower()
    if any(k in dl for k in _FUNGAL_KEYWORDS):
        return "fungal"
    if any(k in dl for k in _BACTERIAL_KEYWORDS):
        return "bacterial"
    return "other"


def _assess_risk(
    humidity: float,
    rainfall: float,
    disease_type: str,
) -> tuple[str, bool]:
    """
    Return (risk_level, supports_prediction) deterministically.

    Fungal:
        humidity > 80 AND rainfall > 10 mm  → HIGH, True
        humidity > 70 OR  rainfall > 5 mm   → MEDIUM, True
        otherwise                            → LOW, False

    Bacterial:
        humidity > 85                        → HIGH, True
        humidity > 65                        → MEDIUM, False
        otherwise                            → LOW, False

    Other:
        humidity > 80                        → MEDIUM, False
        otherwise                            → LOW, False
    """
    if disease_type == "fungal":
        if humidity > 80 and rainfall > 10:
            return "HIGH", True
        if humidity > 70 or rainfall > 5:
            return "MEDIUM", True
        return "LOW", False

    if disease_type == "bacterial":
        if humidity > 85:
            return "HIGH", True
        if humidity > 65:
            return "MEDIUM", False
        return "LOW", False

    # generic / viral
    if humidity > 80:
        return "MEDIUM", False
    return "LOW", False


def _safe_avg(values: list) -> float:
    valid = [v for v in values if v is not None]
    return round(sum(valid) / len(valid), 1) if valid else 0.0


def _safe_sum(values: list) -> float:
    return round(sum(v for v in values if v is not None), 1)


async def get_weather_risk(
    latitude: float,
    longitude: float,
    disease: str,
) -> Dict[str, Any]:
    """
    Main entry point.

    Args:
        latitude:  farm latitude
        longitude: farm longitude
        disease:   canonical disease name (English)

    Returns:
        {
            "temperature": float,
            "humidity":    float,
            "rainfall":    float,
            "weather_risk":        "LOW" | "MEDIUM" | "HIGH",
            "supports_prediction": bool,
        }
    """
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "temperature_2m,relative_humidity_2m,precipitation",
        "past_days": 1,
        "forecast_days": 0,
        "timezone": "auto",
    }

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.get(OPEN_METEO_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
    except Exception as exc:
        logger.warning("Open-Meteo request failed: %s – returning neutral values", exc)
        return {
            "temperature": 27.0,
            "humidity": 60.0,
            "rainfall": 0.0,
            "weather_risk": "LOW",
            "supports_prediction": False,
            "api_error": str(exc),
        }

    hourly = data.get("hourly", {})
    temps = hourly.get("temperature_2m", [])
    humids = hourly.get("relative_humidity_2m", [])
    precips = hourly.get("precipitation", [])

    # Use last 24 readings (= last 24 hours of hourly data)
    avg_temp = _safe_avg(temps[-24:])
    avg_humidity = _safe_avg(humids[-24:])
    total_rainfall = _safe_sum(precips[-24:])

    disease_type = _classify_disease(disease)
    risk, supports = _assess_risk(avg_humidity, total_rainfall, disease_type)

    return {
        "temperature": avg_temp,
        "humidity": avg_humidity,
        "rainfall": total_rainfall,
        "weather_risk": risk,
        "supports_prediction": supports,
    }
