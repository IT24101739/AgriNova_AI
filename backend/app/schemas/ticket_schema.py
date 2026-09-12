"""Ticket-related request/response schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class TicketUpdateRequest(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_officer: Optional[str] = None


class TicketFilterParams(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    crop: Optional[str] = None
    disease: Optional[str] = None
    assigned_officer: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None


class CreateTicketRequest(BaseModel):
    """Used by Member 2 (analysis pipeline) to create tickets."""
    report_id: str
    reason: str   # LOW_CONFIDENCE | HIGH_SEVERITY | OUTBREAK_RISK | UNKNOWN_DISEASE
    priority: str  # LOW | MEDIUM | HIGH
