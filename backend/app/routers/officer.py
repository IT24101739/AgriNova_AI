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
    delete_field_visit,
    delete_ticket,
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


@router.delete("/tickets/{ticket_id}")
def remove_ticket(ticket_id: str):
    """Delete an officer ticket and its associated records."""
    delete_ticket(ticket_id)
    return ok({"ticket_id": ticket_id}, "Ticket deleted successfully")


@router.delete("/field-visits/{visit_id}")
def remove_field_visit(visit_id: str):
    """Delete a field visit record."""
    delete_field_visit(visit_id)
    return ok({"visit_id": visit_id}, "Field visit deleted successfully")


# ═══════════════════════════════════════════════════════════════════════════════
# FIELD VISIT
# ═══════════════════════════════════════════════════════════════════════════════

# ═══════════════════════════════════════════════════════════════════════════════
# FIELD VISIT
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/tickets/{ticket_id}/field-visit")
def record_field_visit(ticket_id: str, body: FieldVisitRequest):
    """
    Record a field visit for a ticket.
    1. Save field_visit row (ORM + Supabase).
    2. Update ticket status → CONFIRMED.
    3. Update report status → CONFIRMED.
    4. Notify farmer.
    5. Save AI feedback.
    """
    db = get_supabase()
    ticket = _require(get_ticket_detail(ticket_id), "Ticket")
    report = ticket.get("reports") or {}
    report_id = report.get("id")
    farm = report.get("farms") or {}
    farmer_id = farm.get("farmer_id")

    fv_id = str(uuid.uuid4())
    now = datetime.utcnow()

    # 1. Save field visit in ORM
    from app.models.database import SessionLocal
    from app.models.report_model import FieldVisit, Report
    try:
        session = SessionLocal()
        fv = FieldVisit(
            id=uuid.UUID(fv_id),
            ticket_id=uuid.UUID(ticket_id),
            confirmed_disease=body.confirmed_disease,
            severity=body.severity,
            observations=body.observations,
            notes=body.notes,
            action_taken=body.action_taken,
            photo_url=body.photo_url,
            visit_date=body.visit_date or now,
            created_at=now,
        )
        session.add(fv)
        session.commit()
        session.close()
    except Exception as exc:
        logger.error("ORM field_visit save error: %s", exc)

    # Attempt Supabase insert if table exists
    visit_result_data = None
    try:
        visit_payload = {
            "id": fv_id,
            "ticket_id": ticket_id,
            "confirmed_disease": body.confirmed_disease,
            "severity": body.severity,
            "observations": body.observations,
            "notes": body.notes,
            "action_taken": body.action_taken,
            "photo_url": body.photo_url,
            "visit_date": body.visit_date.isoformat(),
            "created_at": now.isoformat(),
        }
        res = db.table("field_visits").insert(visit_payload).execute()
        if res.data:
            visit_result_data = res.data[0]
    except Exception as exc:
        logger.warning("Supabase field_visits insert skipped/failed: %s", exc)

    # 2. Update ticket
    update_ticket(ticket_id, {"status": "CONFIRMED"})

    # 3. Update report
    if report_id:
        try:
            db.table("reports").update(
                {"disease": body.confirmed_disease, "severity": body.severity, "status": "CONFIRMED"}
            ).eq("id", report_id).execute()
        except Exception as exc:
            logger.warning("Supabase report update skipped: %s", exc)

        try:
            session = SessionLocal()
            rep = session.query(Report).filter(Report.id == uuid.UUID(str(report_id))).first()
            if rep:
                rep.disease = body.confirmed_disease
                rep.severity = body.severity
                rep.status = "CONFIRMED"
                session.commit()
            session.close()
        except Exception as exc:
            logger.error("ORM report update error: %s", exc)

    # 4. Notify farmer
    if farmer_id and report_id:
        try:
            notification_service.notify_diagnosis_confirmed(
                farmer_id=str(farmer_id),
                report_id=str(report_id),
                confirmed_disease=body.confirmed_disease,
                crop=report.get("crop") or "crop",
            )
        except Exception as exc:
            logger.warning("Notification to farmer failed: %s", exc)

    # 5. AI feedback
    if report_id:
        try:
            ai_feedback_service.save_feedback(
                report_id=str(report_id),
                predicted_disease=report.get("disease") or "Unknown",
                confidence=float(report.get("confidence") or 0),
                confirmed_disease=body.confirmed_disease,
                source="officer_field_visit",
            )
        except Exception as exc:
            logger.warning("AI feedback save failed: %s", exc)

    return ok(visit_result_data or {"id": fv_id, "ticket_id": ticket_id, "confirmed_disease": body.confirmed_disease}, "Field visit recorded")


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

    # Update report in Supabase and ORM
    if report_id:
        try:
            db.table("reports").update(
                {"disease": body.confirmed_disease, "status": "CONFIRMED"}
            ).eq("id", report_id).execute()
        except Exception as exc:
            logger.warning("Supabase report update skipped: %s", exc)

        try:
            from app.models.database import SessionLocal
            from app.models.report_model import Report
            session = SessionLocal()
            rep = session.query(Report).filter(Report.id == uuid.UUID(str(report_id))).first()
            if rep:
                rep.disease = body.confirmed_disease
                rep.status = "CONFIRMED"
                session.commit()
            session.close()
        except Exception as exc:
            logger.error("ORM report update error: %s", exc)

    # Update ticket
    update_ticket(ticket_id, {"status": "RESOLVED"})

    # Notify farmer
    if farmer_id and report_id:
        try:
            notification_service.notify_diagnosis_confirmed(
                farmer_id=str(farmer_id),
                report_id=str(report_id),
                confirmed_disease=body.confirmed_disease,
                crop=report.get("crop") or "crop",
            )
        except Exception as exc:
            logger.warning("Notification to farmer failed: %s", exc)

    # AI feedback
    if report_id:
        try:
            ai_feedback_service.save_feedback(
                report_id=str(report_id),
                predicted_disease=report.get("disease") or "Unknown",
                confidence=float(report.get("confidence") or 0),
                confirmed_disease=body.confirmed_disease,
                source="officer_remote",
            )
        except Exception as exc:
            logger.warning("AI feedback save failed: %s", exc)

    return ok({"confirmed_disease": body.confirmed_disease}, "Diagnosis confirmed")


# ═══════════════════════════════════════════════════════════════════════════════
# RESEARCH LAB
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/lab-requests")
def list_lab_requests(status: Optional[str] = None):
    """List lab requests for research lab portal or officer overview."""
    results = []

    # 1. Try Supabase
    try:
        db = get_supabase()
        q = db.table("lab_requests").select("*, reports(*, farms(*))").order("created_at", desc=True)
        if status:
            q = q.eq("status", status)
        res = q.execute()
        results = res.data or []
    except Exception as exc:
        logger.warning("Supabase lab_requests query skipped/failed: %s", exc)

    # 2. Local ORM
    if not results:
        from app.models.database import SessionLocal
        from app.models.report_model import LabRequest, Report
        try:
            session = SessionLocal()
            q_orm = session.query(LabRequest).order_by(LabRequest.created_at.desc())
            if status:
                q_orm = q_orm.filter(LabRequest.status == status)
            labs = q_orm.all()
            for lr in labs:
                rep_data = {}
                if lr.report_id:
                    rep = session.query(Report).filter(Report.id == lr.report_id).first()
                    if rep:
                        farm_data = {}
                        if rep.farm:
                            farm_data = {
                                "crop": rep.farm.crop,
                                "district": rep.farm.district,
                                "latitude": rep.farm.latitude,
                                "longitude": rep.farm.longitude,
                            }
                        rep_data = {
                            "id": str(rep.id),
                            "crop": rep.crop,
                            "disease": rep.disease,
                            "confidence": rep.confidence,
                            "severity": rep.severity,
                            "image_url": rep.image_url,
                            "description": rep.description,
                            "farms": farm_data,
                        }
                results.append({
                    "id": str(lr.id),
                    "ticket_id": str(lr.ticket_id) if lr.ticket_id else None,
                    "report_id": str(lr.report_id) if lr.report_id else None,
                    "reason": lr.reason,
                    "notes": lr.notes,
                    "sample_reference": lr.sample_reference,
                    "status": lr.status,
                    "confirmed_disease": lr.confirmed_disease,
                    "lab_notes": lr.lab_notes,
                    "result_date": lr.result_date.isoformat() if lr.result_date else None,
                    "created_at": lr.created_at.isoformat() if lr.created_at else None,
                    "reports": rep_data,
                })
            session.close()
        except Exception as exc:
            logger.error("ORM lab_requests query failed: %s", exc)

    # 3. Enrich all items with convenient top-level fields
    enriched = []
    for item in results:
        rep = item.get("reports") or {}
        farm = rep.get("farms") or {}
        item["crop"] = rep.get("crop") or farm.get("crop") or "Crop Sample"
        item["suspected_disease"] = rep.get("disease") or item.get("reason") or "Suspected Pathogen"
        item["severity"] = rep.get("severity") or "HIGH"
        item["confidence"] = rep.get("confidence")
        item["district"] = farm.get("district") or "Western Province"
        item["image_url"] = rep.get("image_url")
        item["lab_name"] = item.get("lab_name") or "Central Agricultural Pathology Lab"
        enriched.append(item)

    return ok(enriched)


@router.post("/tickets/{ticket_id}/send-to-lab")
def send_to_lab(ticket_id: str, body: LabRequest):
    """Escalate unclear sample to research lab."""
    db = get_supabase()
    ticket = _require(get_ticket_detail(ticket_id), "Ticket")
    report = ticket.get("reports") or {}
    report_id = report.get("id")

    lab_id = str(uuid.uuid4())
    now = datetime.utcnow()

    # 1. Save to ORM
    from app.models.database import SessionLocal
    from app.models.report_model import LabRequest as LabModel
    try:
        session = SessionLocal()
        lr = LabModel(
            id=uuid.UUID(lab_id),
            ticket_id=uuid.UUID(ticket_id),
            report_id=uuid.UUID(str(report_id)) if report_id else None,
            reason=body.reason,
            notes=body.notes,
            sample_reference=body.sample_reference,
            status="SAMPLE_REQUESTED",
            created_at=now,
        )
        session.add(lr)
        session.commit()
        session.close()
    except Exception as exc:
        logger.error("ORM LabRequest save failed: %s", exc)

    # 2. Try Supabase
    sb_result = None
    try:
        lab_payload = {
            "id": lab_id,
            "ticket_id": ticket_id,
            "report_id": report_id,
            "reason": body.reason,
            "notes": body.notes,
            "sample_reference": body.sample_reference,
            "status": "SAMPLE_REQUESTED",
            "created_at": now.isoformat(),
        }
        res = db.table("lab_requests").insert(lab_payload).execute()
        if res.data:
            sb_result = res.data[0]
    except Exception as exc:
        logger.warning("Supabase lab_requests insert skipped: %s", exc)

    # Update ticket status
    update_ticket(ticket_id, {"status": "LAB_REVIEW"})

    return ok(sb_result or {"id": lab_id, "ticket_id": ticket_id, "status": "SAMPLE_REQUESTED"}, "Sent to research lab")


@router.patch("/lab-requests/{lab_request_id}/status")
def update_lab_status(lab_request_id: str, body: dict):
    """Update lab testing workflow status (e.g. SAMPLE_REQUESTED -> TESTING)."""
    new_status = body.get("status", "TESTING")

    # 1. Update Supabase
    try:
        db = get_supabase()
        db.table("lab_requests").update({"status": new_status}).eq("id", lab_request_id).execute()
    except Exception:
        pass

    # 2. Update ORM
    from app.models.database import SessionLocal
    from app.models.report_model import LabRequest as LabModel
    try:
        session = SessionLocal()
        lr = session.query(LabModel).filter(LabModel.id == uuid.UUID(lab_request_id)).first()
        if lr:
            lr.status = new_status
            session.commit()
        session.close()
    except Exception as exc:
        logger.error("ORM update lab status error: %s", exc)

    return ok({"id": lab_request_id, "status": new_status}, "Lab status updated")


@router.api_route("/lab-requests/{lab_request_id}/result", methods=["PATCH", "POST"])
def record_lab_result(lab_request_id: str, body: LabResultRequest):
    """
    Record laboratory diagnosis result.
    Re-connects diagnosis to the original report, updates ticket, notifies farmer, and logs AI feedback.
    """
    db = get_supabase()
    now_iso = datetime.utcnow().isoformat()
    now = datetime.utcnow()

    # 1. Find the lab request to get report_id & ticket_id
    report_id = None
    ticket_id = None

    from app.models.database import SessionLocal
    from app.models.report_model import LabRequest as LabModel, Report
    try:
        session = SessionLocal()
        lr = session.query(LabModel).filter(LabModel.id == uuid.UUID(lab_request_id)).first()
        if lr:
            lr.confirmed_disease = body.confirmed_disease
            lr.lab_notes = body.notes
            lr.result_date = now
            lr.status = "RESULT_RECEIVED"
            report_id = str(lr.report_id) if lr.report_id else None
            ticket_id = str(lr.ticket_id) if lr.ticket_id else None
            session.commit()
        session.close()
    except Exception as exc:
        logger.error("ORM lab result update error: %s", exc)

    # 2. Supabase update
    sb_result = None
    try:
        res = (
            db.table("lab_requests")
            .update(
                {
                    "confirmed_disease": body.confirmed_disease,
                    "lab_notes": body.notes,
                    "result_date": body.result_date or now_iso,
                    "status": "RESULT_RECEIVED",
                }
            )
            .eq("id", lab_request_id)
            .execute()
        )
        if res.data:
            sb_result = res.data[0]
            if not report_id:
                report_id = sb_result.get("report_id")
            if not ticket_id:
                ticket_id = sb_result.get("ticket_id")
    except Exception as exc:
        logger.warning("Supabase lab result update skipped: %s", exc)

    # 3. Reconnect to report: update disease and status to CONFIRMED
    if report_id:
        try:
            db.table("reports").update(
                {"disease": body.confirmed_disease, "status": "CONFIRMED"}
            ).eq("id", report_id).execute()
        except Exception:
            pass

        try:
            session = SessionLocal()
            rep = session.query(Report).filter(Report.id == uuid.UUID(str(report_id))).first()
            if rep:
                rep.disease = body.confirmed_disease
                rep.status = "CONFIRMED"
                session.commit()
            session.close()
        except Exception as exc:
            logger.error("ORM report update from lab error: %s", exc)

    # 4. Update ticket status
    if ticket_id:
        update_ticket(ticket_id, {"status": "CONFIRMED"})

    # 5. Notify farmer and record AI feedback
    if report_id:
        try:
            # Look up report & farmer
            ticket_detail = get_ticket_detail(ticket_id) if ticket_id else None
            r_data = ticket_detail.get("reports", {}) if ticket_detail else {}
            farmer_id = r_data.get("farms", {}).get("farmer_id")
            if farmer_id:
                notification_service.notify_diagnosis_confirmed(
                    farmer_id=str(farmer_id),
                    report_id=str(report_id),
                    confirmed_disease=body.confirmed_disease,
                    crop=r_data.get("crop") or "crop",
                )
            ai_feedback_service.save_feedback(
                report_id=str(report_id),
                predicted_disease=r_data.get("disease") or "Unknown",
                confidence=float(r_data.get("confidence") or 0),
                confirmed_disease=body.confirmed_disease,
                source="research_lab",
            )
        except Exception as exc:
            logger.warning("Notification or AI feedback from lab result failed: %s", exc)

    return ok(sb_result or {"id": lab_request_id, "confirmed_disease": body.confirmed_disease, "status": "RESULT_RECEIVED"}, "Lab result recorded and reconnected to case")


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
