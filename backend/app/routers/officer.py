"""
Officer Router
──────────────
All endpoints for the Agriculture Officer dashboard.

Prefix: /api/officer  (registered in main.py)
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query

from app.ai.officer_assistant import CaseContext, generate_case_summary
from app.database import get_supabase
from app.schemas.feedback_schema import DiagnosisConfirmRequest
from app.schemas.field_visit_schema import FieldVisitRequest
from app.schemas.notification_schema import NotificationMarkRead
from app.schemas.outbreak_schema import (
    LabRequest,
    LabResultRequest,
    OutbreakConfirmRequest,
    OutbreakRejectRequest,
)
from app.schemas.ticket_schema import CreateTicketRequest, TicketUpdateRequest
from app.services import ai_feedback_service, notification_service, outbreak_service
from app.services.ticket_service import (
    create_officer_ticket,
    get_dashboard_stats,
    get_ticket_detail,
    get_tickets,
    update_ticket,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/officer", tags=["officer"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def ok(data: Any = None, message: str = "OK") -> dict:
    return {"success": True, "data": data, "message": message}


def _require(obj: Any, label: str) -> Any:
    if not obj:
        raise HTTPException(status_code=404, detail=f"{label} not found")
    return obj


# ═══════════════════════════════════════════════════════════════════════════════
# DASHBOARD
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/dashboard/stats")
def dashboard_stats():
    """Summary statistics for the officer dashboard header cards."""
    return ok(get_dashboard_stats())


# ═══════════════════════════════════════════════════════════════════════════════
# TICKETS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/tickets")
def list_tickets(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_officer: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
):
    """List officer tickets with optional filters."""
    tickets = get_tickets(
        status=status,
        priority=priority,
        assigned_officer=assigned_officer,
        limit=limit,
        offset=offset,
    )
    return ok(tickets)


@router.get("/tickets/{ticket_id}")
def get_ticket(ticket_id: str):
    """Full ticket detail including AI case summary."""
    ticket = _require(get_ticket_detail(ticket_id), "Ticket")

    # Build AI case summary from nested report data
    report = ticket.get("reports") or {}
    analysis = report.get("analysis_results") or {}
    if isinstance(analysis, list):
        analysis = analysis[0] if analysis else {}
    farm = report.get("farms") or {}

    ctx = CaseContext(
        farmer_description=report.get("description") or "",
        predicted_disease=report.get("disease") or "Unknown",
        confidence=float(report.get("confidence") or 0),
        severity=analysis.get("severity") or report.get("severity") or "LOW",
        spread_risk=analysis.get("spread_risk") or report.get("spread_risk") or "LOW",
        outbreak_risk=analysis.get("outbreak_risk") or "LOW",
        weather_summary=analysis.get("weather_risk") or "",
        nearby_report_count=0,   # enriched below
        weather_supports_spread=False,
        crop=report.get("crop") or "",
        location=farm.get("district") or "",
    )

    # Count nearby reports for same disease (last 7 days)
    try:
        db = get_supabase()
        nearby = (
            db.table("reports")
            .select("id", count="exact")
            .eq("disease", ctx.predicted_disease)
            .neq("id", report.get("id", ""))
            .execute()
        )
        ctx.nearby_report_count = nearby.count or 0
    except Exception:  # noqa: BLE001
        pass

    ai_summary = generate_case_summary(ctx)

    return ok(
        {
            **ticket,
            "ai_summary": ai_summary.to_dict(),
        }
    )


@router.post("/tickets")
def create_ticket(body: CreateTicketRequest):
    """
    Create a new officer ticket.
    Primarily called by Member 2's analysis pipeline via ticket_service.create_officer_ticket().
    Also exposed as REST endpoint for testing.
    """
    ticket = create_officer_ticket(
        report_id=body.report_id,
        reason=body.reason,
        priority=body.priority,
    )
    return ok(ticket, "Ticket created")


@router.patch("/tickets/{ticket_id}")
def patch_ticket(ticket_id: str, body: TicketUpdateRequest):
    """Update ticket status, priority, or assigned officer."""
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = update_ticket(ticket_id, updates)
    return ok(result)


# ═══════════════════════════════════════════════════════════════════════════════
# FIELD VISIT
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/tickets/{ticket_id}/field-visit")
def record_field_visit(ticket_id: str, body: FieldVisitRequest):
    """
    Record a field visit for a ticket.
    1. Save field_visit row.
    2. Update ticket status → CONFIRMED.
    3. Update report status.
    4. Notify farmer.
    5. Save AI feedback.
    """
    db = get_supabase()
    ticket = _require(get_ticket_detail(ticket_id), "Ticket")
    report = ticket.get("reports") or {}
    report_id = report.get("id")
    farm = report.get("farms") or {}
    farmer_id = farm.get("farmer_id")

    # 1. Save field visit
    visit_payload = {
        "id": str(uuid.uuid4()),
        "ticket_id": ticket_id,
        "confirmed_disease": body.confirmed_disease,
        "severity": body.severity,
        "observations": body.observations,
        "notes": body.notes,
        "action_taken": body.action_taken,
        "photo_url": body.photo_url,
        "visit_date": body.visit_date.isoformat(),
        "created_at": datetime.utcnow().isoformat(),
    }
    visit_result = db.table("field_visits").insert(visit_payload).execute()

    # 2. Update ticket
    update_ticket(ticket_id, {"status": "CONFIRMED"})

    # 3. Update report
    if report_id:
        db.table("reports").update(
            {"disease": body.confirmed_disease, "severity": body.severity, "status": "CONFIRMED"}
        ).eq("id", report_id).execute()

    # 4. Notify farmer
    if farmer_id and report_id:
        notification_service.notify_diagnosis_confirmed(
            farmer_id=farmer_id,
            report_id=report_id,
            confirmed_disease=body.confirmed_disease,
            crop=report.get("crop") or "crop",
        )

    # 5. AI feedback
    if report_id:
        ai_feedback_service.save_feedback(
            report_id=report_id,
            predicted_disease=report.get("disease") or "Unknown",
            confidence=float(report.get("confidence") or 0),
            confirmed_disease=body.confirmed_disease,
        )

    return ok(visit_result.data[0] if visit_result.data else {}, "Field visit recorded")


# ═══════════════════════════════════════════════════════════════════════════════
# CONFIRM DIAGNOSIS (without field visit)
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/tickets/{ticket_id}/confirm-diagnosis")
def confirm_diagnosis(ticket_id: str, body: DiagnosisConfirmRequest):
    """
    Officer confirms or corrects diagnosis remotely (no field visit).
    Triggers: feedback save, farmer notification, ticket resolved.
    """
    db = get_supabase()
    ticket = _require(get_ticket_detail(ticket_id), "Ticket")
    report = ticket.get("reports") or {}
    report_id = report.get("id")
    farm = report.get("farms") or {}
    farmer_id = farm.get("farmer_id")

    # Update report
    if report_id:
        db.table("reports").update(
            {"disease": body.confirmed_disease, "status": "CONFIRMED"}
        ).eq("id", report_id).execute()

    # Update ticket
    update_ticket(ticket_id, {"status": "RESOLVED"})

    # Notify farmer
    if farmer_id and report_id:
        notification_service.notify_diagnosis_confirmed(
            farmer_id=farmer_id,
            report_id=report_id,
            confirmed_disease=body.confirmed_disease,
            crop=report.get("crop") or "crop",
        )

    # AI feedback
    if report_id:
        ai_feedback_service.save_feedback(
            report_id=report_id,
            predicted_disease=report.get("disease") or "Unknown",
            confidence=float(report.get("confidence") or 0),
            confirmed_disease=body.confirmed_disease,
        )

    return ok({"confirmed_disease": body.confirmed_disease}, "Diagnosis confirmed")


# ═══════════════════════════════════════════════════════════════════════════════
# RESEARCH LAB
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/tickets/{ticket_id}/send-to-lab")
def send_to_lab(ticket_id: str, body: LabRequest):
    """Escalate unclear sample to research lab."""
    db = get_supabase()
    ticket = _require(get_ticket_detail(ticket_id), "Ticket")
    report = ticket.get("reports") or {}

    lab_payload = {
        "id": str(uuid.uuid4()),
        "ticket_id": ticket_id,
        "report_id": report.get("id"),
        "reason": body.reason,
        "notes": body.notes,
        "sample_reference": body.sample_reference,
        "status": "SAMPLE_REQUESTED",
        "created_at": datetime.utcnow().isoformat(),
    }
    result = db.table("lab_requests").insert(lab_payload).execute()

    # Update ticket status
    update_ticket(ticket_id, {"status": "LAB_REVIEW"})

    return ok(result.data[0] if result.data else {}, "Sent to research lab")


@router.patch("/lab-requests/{lab_request_id}/result")
def record_lab_result(lab_request_id: str, body: LabResultRequest):
    """Record lab result when received."""
    db = get_supabase()
    result = (
        db.table("lab_requests")
        .update(
            {
                "confirmed_disease": body.confirmed_disease,
                "lab_notes": body.notes,
                "result_date": body.result_date or datetime.utcnow().isoformat(),
                "status": "RESULT_RECEIVED",
            }
        )
        .eq("id", lab_request_id)
        .execute()
    )
    return ok(result.data[0] if result.data else {}, "Lab result recorded")


# ═══════════════════════════════════════════════════════════════════════════════
# REGIONAL MAP
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/map/reports")
def map_reports(
    crop: Optional[str] = None,
    disease: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
):
    """Geo-tagged reports for the regional Leaflet map."""
    data = outbreak_service.get_map_reports(
        crop=crop,
        disease=disease,
        severity=severity,
        status=status,
    )
    return ok(data)


@router.get("/map/outbreaks")
def map_outbreaks():
    """Confirmed outbreak zones for the map."""
    return ok(outbreak_service.get_confirmed_outbreaks())


# ═══════════════════════════════════════════════════════════════════════════════
# OUTBREAK MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/outbreaks/candidates")
def outbreak_candidates():
    """Outbreak candidate clusters awaiting officer review."""
    # Run detection to surface any new candidates
    outbreak_service.detect_outbreak_candidates()
    return ok(outbreak_service.get_outbreak_candidates())


@router.get("/outbreaks/confirmed")
def confirmed_outbreaks():
    return ok(outbreak_service.get_confirmed_outbreaks())


@router.post("/outbreaks/{outbreak_id}/confirm")
def confirm_outbreak(outbreak_id: str, body: OutbreakConfirmRequest):
    result = outbreak_service.confirm_outbreak(
        outbreak_id,
        radius_km=body.radius_km,
        notes=body.notes,
    )
    return ok(result, "Outbreak confirmed and farmers notified")


@router.post("/outbreaks/{outbreak_id}/reject")
def reject_outbreak(outbreak_id: str, body: OutbreakRejectRequest):
    result = outbreak_service.reject_outbreak(outbreak_id, reason=body.reason)
    return ok(result, "Outbreak rejected")
