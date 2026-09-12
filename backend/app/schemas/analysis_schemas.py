from __future__ import annotations

from enum import Enum
from typing import Any, List, Optional

from pydantic import BaseModel


# ── Enums ─────────────────────────────────────────────────────────────────────

class DecisionType(str, Enum):
    AUTO_ADVICE = "AUTO_ADVICE"
    NEED_MORE_INFO = "NEED_MORE_INFO"
    OFFICER_REVIEW = "OFFICER_REVIEW"
    OUTBREAK_WARNING = "OUTBREAK_WARNING"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


# ── Request bodies ─────────────────────────────────────────────────────────────

class CompleteAnalysisRequest(BaseModel):
    preferred_language: str = "en"  # en | si | ta


# ── Sub-models ─────────────────────────────────────────────────────────────────

class WeatherData(BaseModel):
    temperature: float
    humidity: float
    rainfall: float
    risk: str
    supports_prediction: bool = False


class OutbreakData(BaseModel):
    nearby_cases: int
    radius_km: float
    risk: str
    matching_report_ids: List[str] = []


class DiagnosisData(BaseModel):
    disease: str
    confidence: float


class FarmerAdvice(BaseModel):
    language: str
    diagnosis_text: str
    treatment_steps: List[str]
    warning: Optional[str] = None


# ── Full response ──────────────────────────────────────────────────────────────

class CompleteAnalysisResponse(BaseModel):
    report_id: str
    diagnosis: DiagnosisData
    severity: str
    weather: WeatherData
    outbreak: OutbreakData
    spread_risk: str
    decision: str
    reasons: List[str]
    farmer_advice: Optional[FarmerAdvice] = None
    needs_additional_photo: bool = False


# ── Generic API envelope ───────────────────────────────────────────────────────

class APIResponse(BaseModel):
    success: bool
    data: Any
    message: str = ""


def ok(data: Any, message: str = "") -> dict:
    return {"success": True, "data": data, "message": message}


def err(message: str, data: Any = None) -> dict:
    return {"success": False, "data": data, "message": message}
