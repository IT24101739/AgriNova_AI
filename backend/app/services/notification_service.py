"""
Notification Service
─────────────────────
Creates and manages database notifications.
Member 2's Farmer Alerts page calls GET /api/users/{user_id}/notifications
to consume these.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime
from typing import Any, Optional

from app.database import get_supabase

logger = logging.getLogger(__name__)

# Notification types
TYPE_DIAGNOSIS_CONFIRMED = "DIAGNOSIS_CONFIRMED"
TYPE_TICKET_RESOLVED = "TICKET_RESOLVED"
TYPE_OUTBREAK_ALERT = "OUTBREAK_ALERT"
TYPE_FIELD_VISIT_SCHEDULED = "FIELD_VISIT_SCHEDULED"
TYPE_LAB_RESULT = "LAB_RESULT"


def create_notification(
    *,
    user_id: str,
    report_id: Optional[str] = None,
    type: str,
    message: str,
) -> dict[str, Any]:
    db = get_supabase()
    payload = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "report_id": report_id,
        "type": type,
        "message": message,
        "read": False,
        "created_at": datetime.utcnow().isoformat(),
    }
    result = db.table("notifications").insert(payload).execute()
    logger.info("Notification created for user %s: %s", user_id, type)
    return result.data[0]


def notify_diagnosis_confirmed(
    *,
    farmer_id: str,
    report_id: str,
    confirmed_disease: str,
    crop: str,
) -> dict[str, Any]:
    msg = (
        f"An agriculture officer has confirmed the diagnosis for your {crop} report: "
        f"{confirmed_disease}. Please follow the recommended treatment plan."
    )
    return create_notification(
        user_id=farmer_id,
        report_id=report_id,
        type=TYPE_DIAGNOSIS_CONFIRMED,
        message=msg,
    )


def notify_ticket_resolved(
    *,
    farmer_id: str,
    report_id: str,
    disease: str,
) -> dict[str, Any]:
    msg = (
        f"Your crop disease report has been reviewed and resolved by an agriculture officer. "
        f"Diagnosed disease: {disease}."
    )
    return create_notification(
        user_id=farmer_id,
        report_id=report_id,
        type=TYPE_TICKET_RESOLVED,
        message=msg,
    )


def notify_outbreak_alert(
    *,
    farmer_id: str,
    disease: str,
    crop: str,
) -> dict[str, Any]:
    msg = (
        f"{disease} has been confirmed near your area. "
        f"Please inspect your {crop} plants and report any suspicious symptoms immediately."
    )
    return create_notification(
        user_id=farmer_id,
        type=TYPE_OUTBREAK_ALERT,
        message=msg,
    )


def get_user_notifications(
    user_id: str,
    unread_only: bool = False,
    limit: int = 50,
    offset: int = 0,
) -> list[dict[str, Any]]:
    db = get_supabase()
    q = (
        db.table("notifications")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
    )
    if unread_only:
        q = q.eq("read", False)
    return q.execute().data


def mark_notification_read(notification_id: str) -> dict[str, Any]:
    db = get_supabase()
    result = (
        db.table("notifications")
        .update({"read": True})
        .eq("id", notification_id)
        .execute()
    )
    return result.data[0] if result.data else {}


def get_unread_count(user_id: str) -> int:
    db = get_supabase()
    result = (
        db.table("notifications")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .eq("read", False)
        .execute()
    )
    return result.count or 0
