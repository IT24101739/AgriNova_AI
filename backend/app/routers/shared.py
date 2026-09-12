"""
Additional shared routes (notifications, admin AI feedback).
Prefix: /api  (registered directly in main.py)
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter

from app.services import ai_feedback_service, notification_service

router = APIRouter(prefix="/api", tags=["shared"])


def ok(data=None, message="OK"):
    return {"success": True, "data": data, "message": message}


# ── Notifications (consumed by Member 2's Farmer Alerts) ──────────────────────

@router.get("/users/{user_id}/notifications")
def get_notifications(
    user_id: str,
    unread_only: bool = False,
    limit: int = 50,
    offset: int = 0,
):
    data = notification_service.get_user_notifications(
        user_id, unread_only=unread_only, limit=limit, offset=offset
    )
    return ok(data)


@router.get("/users/{user_id}/notifications/unread-count")
def unread_count(user_id: str):
    count = notification_service.get_unread_count(user_id)
    return ok({"count": count})


@router.patch("/notifications/{notification_id}/read")
def mark_read(notification_id: str):
    result = notification_service.mark_notification_read(notification_id)
    return ok(result, "Marked as read")


# ── Admin AI Feedback ─────────────────────────────────────────────────────────

@router.get("/admin/ai-feedback")
def get_ai_feedback(
    limit: int = 100,
    offset: int = 0,
    only_incorrect: bool = False,
):
    data = ai_feedback_service.get_feedback_records(
        limit=limit, offset=offset, only_incorrect=only_incorrect
    )
    return ok(data)


@router.get("/admin/ai-feedback/summary")
def ai_feedback_summary():
    return ok(ai_feedback_service.get_feedback_summary())
