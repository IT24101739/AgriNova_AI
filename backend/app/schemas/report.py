"""
Pydantic schemas for Report endpoints.
These define the API request/response contract — stable for Member 2 integration.
"""

from __future__ import annotations
from pydantic import BaseModel, Field, UUID4
from typing import Optional
from datetime import datetime


# ---------------------------------------------------------------------------
# Nested schemas
# ---------------------------------------------------------------------------

class ImageAnalysisResult(BaseModel):
    """
    Populated after disease_classifier + severity_estimator complete.
    Member 2 reads this block from GET /api/reports/{report_id}.
    """
    disease: Optional[str] = None
    confidence: Optional[float] = None
    severity: Optional[str] = None          # LOW | MODERATE | HIGH
    affected_percentage: Optional[float] = None

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class FarmCreate(BaseModel):
    """Used when creating a farm record alongside the first report."""
    farmer_id: UUID4
    crop: str
    latitude: float
    longitude: float
    district: Optional[str] = None


# ---------------------------------------------------------------------------
# Report response (stable contract for Member 2)
# ---------------------------------------------------------------------------

class ReportResponse(BaseModel):
    """
    Full report response including image_analysis block.
    Stable contract — do not remove or rename fields.
    """
    id: UUID4
    farm_id: UUID4
    crop: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    preferred_language: str
    status: str
    created_at: datetime
    image_analysis: Optional[ImageAnalysisResult] = None

    class Config:
        from_attributes = True


class ReportListItem(BaseModel):
    """Lightweight item for list views."""
    id: UUID4
    crop: str
    status: str
    created_at: datetime
    disease: Optional[str] = None
    severity: Optional[str] = None
    image_url: Optional[str] = None

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Standard API envelope
# ---------------------------------------------------------------------------

class ApiResponse(BaseModel):
    success: bool = True
    data: Optional[dict] = None
    message: str = ""
