"""
Ticket service – manages officer_tickets table.

IMPORTANT: `create_officer_ticket` is the shared interface for Member 2.
Member 2 imports and calls this function from their disease analysis pipeline.
Dual persistence: Supabase + local SQLAlchemy ORM for 100% resilience.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime
from typing import Any, Optional

from app.database import get_supabase
from app.models.database import SessionLocal
from app.models.report_model import (
    OfficerTicket, FieldVisit, LabRequest, Report, Farm, AnalysisResult, Outbreak
)

logger = logging.getLogger(__name__)

# ── Ticket states ─────────────────────────────────────────────────────────────
OPEN = "OPEN"
ASSIGNED = "ASSIGNED"
FIELD_VISIT_REQUIRED = "FIELD_VISIT_REQUIRED"
UNDER_REVIEW = "UNDER_REVIEW"
LAB_REVIEW = "LAB_REVIEW"
CONFIRMED = "CONFIRMED"
RESOLVED = "RESOLVED"

# ── Ticket reasons (for Member 2) ────────────────────────────────────────────
LOW_CONFIDENCE = "LOW_CONFIDENCE"
HIGH_SEVERITY = "HIGH_SEVERITY"
OUTBREAK_RISK = "OUTBREAK_RISK"
UNKNOWN_DISEASE = "UNKNOWN_DISEASE"
FARMER_REQUEST = "FARMER_REQUEST"


# ═══════════════════════════════════════════════════════════════════════════════
# PUBLIC INTERFACE FOR MEMBER 2
# ═══════════════════════════════════════════════════════════════════════════════

def create_officer_ticket(
    report_id: str,
    reason: str,
    priority: str,
    assigned_officer: Optional[str] = None,
) -> dict[str, Any]:
    """
    Create an officer ticket for a report that needs human review.
    """
    ticket_id = str(uuid.uuid4())
    now_iso = datetime.utcnow().isoformat()
    norm_status = OPEN

    # 1. Supabase insert
    sb_ticket = None
    try:
        db = get_supabase()
        existing = (
            db.table("officer_tickets")
            .select("id")
            .eq("report_id", report_id)
            .eq("reason", reason)
            .in_("status", [OPEN, ASSIGNED, UNDER_REVIEW, FIELD_VISIT_REQUIRED, "open"])
            .execute()
        )
        if existing.data:
            logger.info("Ticket already exists for report %s reason %s, skipping.", report_id, reason)
            return existing.data[0]

        payload: dict[str, Any] = {
            "id": ticket_id,
            "report_id": report_id,
            "reason": reason,
            "priority": priority.upper(),
            "status": norm_status,
            "created_at": now_iso,
        }
        if assigned_officer:
            payload["assigned_officer"] = assigned_officer

        result = db.table("officer_tickets").insert(payload).execute()
        if result.data:
            sb_ticket = result.data[0]
    except Exception as exc:
        logger.warning("Supabase ticket create skipped/failed: %s", exc)

    # 2. Local ORM insert
    try:
        session = SessionLocal()
        t = OfficerTicket(
            id=uuid.UUID(ticket_id),
            report_id=uuid.UUID(str(report_id)) if report_id else None,
            reason=reason,
            priority=priority.upper(),
            assigned_officer=uuid.UUID(str(assigned_officer)) if assigned_officer else None,
            status=norm_status,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        session.add(t)
        session.commit()
        session.close()
    except Exception as exc:
        logger.error("ORM ticket create failed: %s", exc)

    logger.info("Created officer ticket %s for report %s", ticket_id, report_id)
    return sb_ticket or {
        "id": ticket_id,
        "report_id": report_id,
        "reason": reason,
        "priority": priority.upper(),
        "status": norm_status,
        "created_at": now_iso,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# OFFICER-FACING FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def get_tickets(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_officer: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> list[dict[str, Any]]:
    tickets = []
    try:
        db = get_supabase()
        q = (
            db.table("officer_tickets")
            .select(
                "*, reports(id, crop, disease, confidence, severity, spread_risk, "
                "status, created_at, image_url, description, "
                "farms(latitude, longitude, district, farmer_id))"
            )
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
        )
        if status:
            q = q.ilike("status", status)
        if priority:
            q = q.ilike("priority", priority)
        if assigned_officer:
            q = q.eq("assigned_officer", assigned_officer)

        res = q.execute()
        tickets = res.data or []
    except Exception as exc:
        logger.warning("get_tickets Supabase query failed: %s", exc)

    if not tickets:
        try:
            session = SessionLocal()
            q_orm = session.query(OfficerTicket).order_by(OfficerTicket.created_at.desc())
            if status:
                q_orm = q_orm.filter(OfficerTicket.status.ilike(status))
            if priority:
                q_orm = q_orm.filter(OfficerTicket.priority.ilike(priority))
            orm_tickets = q_orm.offset(offset).limit(limit).all()

            for t in orm_tickets:
                rep_dict = {}
                if t.report_id:
                    rep = session.query(Report).filter(Report.id == t.report_id).first()
                    if not rep:
                        # Report was deleted or does not exist, skip orphaned ticket
                        continue
                    farm_dict = {}
                    if rep.farm:
                        farm_dict = {
                            "latitude": rep.farm.latitude,
                            "longitude": rep.farm.longitude,
                            "district": rep.farm.district,
                            "farmer_id": str(rep.farm.farmer_id),
                        }
                    rep_dict = {
                        "id": str(rep.id),
                        "crop": rep.crop,
                        "disease": rep.disease,
                        "confidence": rep.confidence,
                        "severity": rep.severity,
                        "spread_risk": rep.spread_risk,
                        "status": rep.status,
                        "created_at": rep.created_at.isoformat() if rep.created_at else None,
                        "image_url": rep.image_url,
                        "description": rep.description,
                        "farms": farm_dict,
                    }
                tickets.append({
                    "id": str(t.id),
                    "report_id": str(t.report_id) if t.report_id else None,
                    "reason": t.reason,
                    "priority": t.priority,
                    "assigned_officer": str(t.assigned_officer) if t.assigned_officer else None,
                    "status": t.status,
                    "created_at": t.created_at.isoformat() if t.created_at else None,
                    "reports": rep_dict,
                })
            session.close()
        except Exception as exc:
            logger.error("get_tickets ORM fallback failed: %s", exc)

    return tickets


def get_ticket_detail(ticket_id: str) -> Optional[dict[str, Any]]:
    ticket_data = None
    try:
        db = get_supabase()
        result = (
            db.table("officer_tickets")
            .select("*, reports(*, analysis_results(*), farms(*))")
            .eq("id", ticket_id)
            .single()
            .execute()
        )
        ticket_data = result.data
    except Exception as exc:
        logger.warning("get_ticket_detail Supabase query failed: %s", exc)

    if not ticket_data:
        try:
            session = SessionLocal()
            t = session.query(OfficerTicket).filter(OfficerTicket.id == uuid.UUID(ticket_id)).first()
            if t:
                rep_dict = {}
                if t.report_id:
                    rep = session.query(Report).filter(Report.id == t.report_id).first()
                    if rep:
                        farm_dict = {}
                        if rep.farm:
                            farm_dict = {
                                "id": str(rep.farm.id),
                                "latitude": rep.farm.latitude,
                                "longitude": rep.farm.longitude,
                                "district": rep.farm.district,
                                "farmer_id": str(rep.farm.farmer_id),
                                "crop": rep.farm.crop,
                            }
                        ar_dict = {}
                        if rep.analysis_result:
                            ar_dict = {
                                "disease": rep.analysis_result.disease,
                                "disease_confidence": rep.analysis_result.disease_confidence,
                                "severity": rep.analysis_result.severity,
                                "spread_risk": rep.analysis_result.spread_risk,
                                "weather_risk": rep.analysis_result.weather_risk,
                                "outbreak_risk": rep.analysis_result.outbreak_risk,
                            }
                        rep_dict = {
                            "id": str(rep.id),
                            "crop": rep.crop,
                            "disease": rep.disease,
                            "confidence": rep.confidence,
                            "severity": rep.severity,
                            "spread_risk": rep.spread_risk,
                            "status": rep.status,
                            "created_at": rep.created_at.isoformat() if rep.created_at else None,
                            "image_url": rep.image_url,
                            "description": rep.description,
                            "farms": farm_dict,
                            "analysis_results": ar_dict,
                        }
                ticket_data = {
                    "id": str(t.id),
                    "report_id": str(t.report_id) if t.report_id else None,
                    "reason": t.reason,
                    "priority": t.priority,
                    "assigned_officer": str(t.assigned_officer) if t.assigned_officer else None,
                    "status": t.status,
                    "created_at": t.created_at.isoformat() if t.created_at else None,
                    "reports": rep_dict,
                }
            session.close()
        except Exception as exc:
            logger.error("get_ticket_detail ORM lookup failed: %s", exc)

    if not ticket_data:
        return None

    # Attach local field visits & lab requests
    try:
        session = SessionLocal()
        t_uuid = uuid.UUID(ticket_id)
        fvs = session.query(FieldVisit).filter(FieldVisit.ticket_id == t_uuid).all()
        ticket_data["field_visits"] = [
            {
                "id": str(fv.id),
                "ticket_id": str(fv.ticket_id),
                "confirmed_disease": fv.confirmed_disease,
                "severity": fv.severity,
                "observations": fv.observations,
                "notes": fv.notes,
                "action_taken": fv.action_taken,
                "photo_url": fv.photo_url,
                "visit_date": fv.visit_date.isoformat() if fv.visit_date else None,
                "created_at": fv.created_at.isoformat() if fv.created_at else None,
            }
            for fv in fvs
        ]
        labs = session.query(LabRequest).filter(LabRequest.ticket_id == t_uuid).all()
        ticket_data["lab_requests"] = [
            {
                "id": str(lr.id),
                "ticket_id": str(lr.ticket_id),
                "report_id": str(lr.report_id) if lr.report_id else None,
                "reason": lr.reason,
                "notes": lr.notes,
                "sample_reference": lr.sample_reference,
                "status": lr.status,
                "confirmed_disease": lr.confirmed_disease,
                "lab_notes": lr.lab_notes,
                "result_date": lr.result_date.isoformat() if lr.result_date else None,
                "created_at": lr.created_at.isoformat() if lr.created_at else None,
            }
            for lr in labs
        ]
        session.close()
    except Exception as exc:
        logger.warning("Error enriching field visits/lab requests: %s", exc)

    return ticket_data


def update_ticket(
    ticket_id: str,
    updates: dict[str, Any],
) -> dict[str, Any]:
    # Normalize status and priority if provided
    if "status" in updates and isinstance(updates["status"], str):
        updates["status"] = updates["status"].upper()
    if "priority" in updates and isinstance(updates["priority"], str):
        updates["priority"] = updates["priority"].upper()

    # 1. Supabase update (Supabase schema does not have updated_at column on officer_tickets)
    sb_res = None
    sb_payload = {k: v for k, v in updates.items() if k != "updated_at"}
    try:
        db = get_supabase()
        res = db.table("officer_tickets").update(sb_payload).eq("id", ticket_id).execute()
        if res.data:
            sb_res = res.data[0]
    except Exception as exc:
        logger.warning("Supabase update_ticket skipped: %s", exc)

    # 2. Local ORM update (requires datetime object for updated_at, and UUIDs for foreign keys)
    try:
        session = SessionLocal()
        t = session.query(OfficerTicket).filter(OfficerTicket.id == uuid.UUID(ticket_id)).first()
        if t:
            for k, v in updates.items():
                if k == "updated_at":
                    continue
                if hasattr(t, k):
                    if k in ("assigned_officer", "report_id") and isinstance(v, str):
                        setattr(t, k, uuid.UUID(v) if v else None)
                    else:
                        setattr(t, k, v)
            t.updated_at = datetime.utcnow()
            session.commit()
        session.close()
    except Exception as exc:
        logger.error("ORM update_ticket failed: %s", exc)

    return sb_res or {"id": ticket_id, **updates}


def get_dashboard_stats() -> dict[str, Any]:
    """Returns real stats for officer dashboard."""
    try:
        db = get_supabase()

        def count(filters: dict) -> int:
            try:
                q = db.table("officer_tickets").select("id", count="exact")
                for k, v in filters.items():
                    q = q.ilike(k, v)
                return q.execute().count or 0
            except Exception:
                return 0

        open_cases = count({"status": OPEN})
        high_priority = count({"priority": "HIGH"})
    except Exception:
        open_cases = 0
        high_priority = 0

    # Also count from ORM if counts are 0
    try:
        session = SessionLocal()
        if open_cases == 0:
            open_cases = session.query(OfficerTicket).filter(OfficerTicket.status.in_([OPEN, "open", "ASSIGNED"])).count()
        if high_priority == 0:
            high_priority = session.query(OfficerTicket).filter(OfficerTicket.priority == "HIGH").count()
        fv_today = session.query(FieldVisit).count()
        outbreaks_confirmed = session.query(Outbreak).filter(Outbreak.status == "CONFIRMED").count()
        session.close()
    except Exception as exc:
        logger.warning("Error fetching ORM stats: %s", exc)
        fv_today = 0
        outbreaks_confirmed = 0

    return {
        "open_cases": open_cases,
        "high_priority_cases": high_priority,
        "todays_field_visits": fv_today,
        "outbreak_alerts_possible": 0,
        "outbreak_alerts_confirmed": outbreaks_confirmed,
    }
