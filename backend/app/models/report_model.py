"""
SQLAlchemy ORM models mapping to shared database schema.
Column names match the agreed shared schema exactly — do not rename.
"""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, DateTime, ForeignKey, Text, Enum as SAEnum, TypeDecorator, CHAR, Boolean, Integer
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship
from app.models.database import Base
import enum


class GUID(TypeDecorator):
    """Platform-independent GUID type. Uses PostgreSQL UUID when available, else CHAR(36)."""
    impl = CHAR(36)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if dialect.name == "postgresql":
            return value if isinstance(value, uuid.UUID) else uuid.UUID(str(value))
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(str(value))


UUIDType = GUID


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class ReportStatus(str, enum.Enum):
    PENDING = "PENDING"
    ANALYZING = "ANALYZING"
    IMAGE_ANALYZED = "IMAGE_ANALYZED"
    DIAGNOSED = "DIAGNOSED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class SeverityLevel(str, enum.Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"


class Language(str, enum.Enum):
    EN = "en"
    SI = "si"
    TA = "ta"


# ---------------------------------------------------------------------------
# Farm
# ---------------------------------------------------------------------------

class Farm(Base):
    __tablename__ = "farms"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    farmer_id = Column(UUIDType, nullable=False, index=True)
    crop = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    district = Column(String(100), nullable=True)

    reports = relationship("Report", back_populates="farm")


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------

class Report(Base):
    __tablename__ = "reports"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    farm_id = Column(UUIDType, ForeignKey("farms.id"), nullable=False, index=True)
    crop = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(Text, nullable=True)
    preferred_language = Column(String(5), nullable=False, default="en")

    # AI-populated fields
    disease = Column(String(200), nullable=True)
    confidence = Column(Float, nullable=True)
    severity = Column(String(20), nullable=True)
    spread_risk = Column(String(20), nullable=True)

    status = Column(String(30), nullable=False, default=ReportStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    farm = relationship("Farm", back_populates="reports")
    analysis_result = relationship("AnalysisResult", back_populates="report", uselist=False)


# ---------------------------------------------------------------------------
# AnalysisResult — populated by Member 1's AI pipeline
# ---------------------------------------------------------------------------

class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    report_id = Column(UUIDType, ForeignKey("reports.id"), nullable=False, unique=True, index=True)

    # Populated by disease_classifier.py
    disease = Column(String(200), nullable=True)
    disease_confidence = Column(Float, nullable=True)

    # Populated by severity_estimator.py
    severity = Column(String(20), nullable=True)
    affected_percentage = Column(Float, nullable=True)

    # Populated by Member 2 (weather/aggregation) — leave nullable
    weather_risk = Column(String(20), nullable=True)
    outbreak_risk = Column(String(20), nullable=True)
    final_confidence = Column(Float, nullable=True)
    spread_risk = Column(String(20), nullable=True)
    report = relationship("Report", back_populates="analysis_result")


# ---------------------------------------------------------------------------
# User / Profile
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=True)
    role = Column(String(50), nullable=False, default="farmer")
    district = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    badge = Column(String(100), nullable=True)
    preferred_language = Column(String(5), nullable=False, default="en")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


# ---------------------------------------------------------------------------
# Officer Ticket
# ---------------------------------------------------------------------------

class OfficerTicket(Base):
    __tablename__ = "officer_tickets"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    report_id = Column(UUIDType, ForeignKey("reports.id"), nullable=True, index=True)
    reason = Column(Text, nullable=True)
    priority = Column(String(20), nullable=False, default="MEDIUM")
    assigned_officer = Column(UUIDType, nullable=True)
    status = Column(String(30), nullable=False, default="OPEN")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)


# ---------------------------------------------------------------------------
# Field Visit
# ---------------------------------------------------------------------------

class FieldVisit(Base):
    __tablename__ = "field_visits"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    ticket_id = Column(UUIDType, ForeignKey("officer_tickets.id"), nullable=True, index=True)
    confirmed_disease = Column(String(200), nullable=False)
    severity = Column(String(20), nullable=True)
    observations = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    action_taken = Column(Text, nullable=True)
    photo_url = Column(Text, nullable=True)
    visit_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


# ---------------------------------------------------------------------------
# Research Lab Request
# ---------------------------------------------------------------------------

class LabRequest(Base):
    __tablename__ = "lab_requests"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    ticket_id = Column(UUIDType, ForeignKey("officer_tickets.id"), nullable=True, index=True)
    report_id = Column(UUIDType, ForeignKey("reports.id"), nullable=True, index=True)
    reason = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)
    sample_reference = Column(String(100), nullable=True)
    status = Column(String(30), nullable=False, default="SAMPLE_REQUESTED")  # SAMPLE_REQUESTED | TESTING | RESULT_RECEIVED
    confirmed_disease = Column(String(200), nullable=True)
    lab_notes = Column(Text, nullable=True)
    result_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


# ---------------------------------------------------------------------------
# Outbreak
# ---------------------------------------------------------------------------

class Outbreak(Base):
    __tablename__ = "outbreaks"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    disease = Column(String(200), nullable=False)
    crop = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius_km = Column(Float, nullable=False, default=25.0)
    status = Column(String(30), nullable=False, default="CANDIDATE")  # CANDIDATE | CONFIRMED | REJECTED
    report_count = Column(Integer, nullable=True, default=1)
    avg_confidence = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    confirmed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


# ---------------------------------------------------------------------------
# Notification
# ---------------------------------------------------------------------------

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDType, nullable=False, index=True)
    report_id = Column(UUIDType, ForeignKey("reports.id"), nullable=True)
    type = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


# ---------------------------------------------------------------------------
# AI Feedback
# ---------------------------------------------------------------------------

class AIFeedback(Base):
    __tablename__ = "ai_feedback"

    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)
    report_id = Column(UUIDType, ForeignKey("reports.id"), nullable=True)
    predicted_disease = Column(String(200), nullable=False)
    confirmed_disease = Column(String(200), nullable=False)
    confidence = Column(Float, nullable=True)
    correct = Column(Boolean, default=False, nullable=False)
    source = Column(String(50), default="officer", nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

