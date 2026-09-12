"""
Ticket service – manages officer_tickets table.

IMPORTANT: `create_officer_ticket` is the shared interface for Member 2.
Member 2 imports and calls this function from their disease analysis pipeline.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime
from typing import Any, Optional

from app.database import get_supabase

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

    Called by Member 2's disease analysis pipeline after AI scoring.

    Args:
        report_id:        UUID of the reports row.
        reason:           One of LOW_CONFIDENCE | HIGH_SEVERITY |
                          OUTBREAK_RISK | UNKNOWN_DISEASE | FARMER_REQUEST
        priority:         LOW | MEDIUM | HIGH
        assigned_officer: Optional officer user ID.

    Returns:
        The newly created officer_tickets row dict.
    """
    db = get_supabase()

    # Avoid duplicate tickets for same report + reason
    existing = (
        db.table("officer_tickets")
        .select("id")
        .eq("report_id", report_id)
        .eq("reason", reason)
        .in_("status", [OPEN, ASSIGNED, UNDER_REVIEW, FIELD_VISIT_REQUIRED])
        .execute()
    )
    if existing.data:
        logger.info(
            "Ticket already exists for report %s reason %s, skipping.", report_id, reason
        )
        return existing.data[0]

    payload: dict[str, Any] = {
        "id": str(uuid.uuid4()),
        "report_id": report_id,
        "reason": reason,
        "priority": priority,
        "status": OPEN,
        "created_at": datetime.utcnow().isoformat(),
    }
    if assigned_officer:
        payload["assigned_officer"] = assigned_officer

    result = db.table("officer_tickets").insert(payload).execute()
    logger.info("Created officer ticket %s for report %s", payload["id"], report_id)
    return result.data[0]


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
        q = q.eq("status", status)
    if priority:
        q = q.eq("priority", priority)
    if assigned_officer:
        q = q.eq("assigned_officer", assigned_officer)

    return q.execute().data


def get_ticket_detail(ticket_id: str) -> Optional[dict[str, Any]]:
    db = get_supabase()
    result = (
        db.table("officer_tickets")
        .select(
            "*, "
            "reports(*, analysis_results(*), farms(*, users(name, preferred_language))), "
            "field_visits(*)"
        )
        .eq("id", ticket_id)
        .single()
        .execute()
    )
    return result.data


def update_ticket(
    ticket_id: str,
    updates: dict[str, Any],
) -> dict[str, Any]:
    db = get_supabase()
    updates["updated_at"] = datetime.utcnow().isoformat()
    result = (
        db.table("officer_tickets").update(updates).eq("id", ticket_id).execute()
    )
    return result.data[0] if result.data else {}


def get_dashboard_stats() -> dict[str, Any]:
    db = get_supabase()

    def count(filters: dict) -> int:
        q = db.table("officer_tickets").select("id", count="exact")
        for k, v in filters.items():
            q = q.eq(k, v)
        return q.execute().count or 0

    today = datetime.utcnow().date().isoformat()

    open_cases = count({"status": OPEN})
    high_priority = count({"priority": "HIGH"})

    # Field visits today
    fv_today = (
        db.table("field_visits")
        .select("id", count="exact")
        .gte("created_at", today)
        .execute()
        .count
        or 0
    )

    # Outbreak stats
    outbreaks_possible = (
        db.table("outbreaks")
        .select("id", count="exact")
        .eq("status", "CANDIDATE")
        .execute()
        .count
        or 0
    )
    outbreaks_confirmed = (
        db.table("outbreaks")
        .select("id", count="exact")
        .eq("status", "CONFIRMED")
        .execute()
        .count
        or 0
    )

    return {
        "open_cases": open_cases,
        "high_priority_cases": high_priority,
        "possible_outbreaks": outbreaks_possible,
        "confirmed_outbreaks": outbreaks_confirmed,
        "todays_field_visits": fv_today,
    }
