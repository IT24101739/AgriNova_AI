"""Field visit request/response schemas."""
from datetime import date
from typing import Optional
from pydantic import BaseModel


class FieldVisitRequest(BaseModel):
    visit_date: date
    observations: str
    confirmed_disease: str
    severity: str              # LOW | MEDIUM | HIGH
    notes: Optional[str] = None
    action_taken: Optional[str] = None
    photo_url: Optional[str] = None
