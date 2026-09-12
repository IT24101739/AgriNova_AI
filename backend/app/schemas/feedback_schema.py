"""AI feedback schemas."""
from typing import Optional
from pydantic import BaseModel


class DiagnosisConfirmRequest(BaseModel):
    confirmed_disease: str
    notes: Optional[str] = None
    officer_id: Optional[str] = None
