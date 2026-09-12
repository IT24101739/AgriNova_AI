"""Outbreak-related schemas."""
from typing import Optional
from pydantic import BaseModel


class OutbreakConfirmRequest(BaseModel):
    notes: Optional[str] = None
    radius_km: Optional[float] = 25.0


class OutbreakRejectRequest(BaseModel):
    reason: Optional[str] = None


class LabRequest(BaseModel):
    reason: str
    notes: Optional[str] = None
    sample_reference: Optional[str] = None


class LabResultRequest(BaseModel):
    confirmed_disease: str
    notes: Optional[str] = None
    result_date: Optional[str] = None
