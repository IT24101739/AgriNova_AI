"""
Additional shared routes (notifications, admin management, and lab aliases).
Prefix: /api  (registered directly in main.py)
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Query, Request

from app.services import ai_feedback_service, notification_service
from app.database import get_supabase
from app.models.database import SessionLocal
from app.models.report_model import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["shared"])


def ok(data=None, message="OK"):
    return {"success": True, "data": data, "message": message}


# ── Notifications (supports both /users/{user_id}/notifications and /notifications) ──

@router.get("/notifications")
def get_notifications_query(
    user_id: Optional[str] = Query(None),
    unread_only: bool = False,
    limit: int = 50,
    offset: int = 0,
):
    """Fallback endpoint called by analysisService.js."""
    target_user_id = user_id or "00000000-0000-0000-0000-000000000001"
    data = notification_service.get_user_notifications(
        target_user_id, unread_only=unread_only, limit=limit, offset=offset
    )
    return ok(data)


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


# ── Research Lab Route Alias ──────────────────────────────────────────────────

@router.api_route("/lab-requests/{lab_request_id}/result", methods=["PATCH", "POST"])
def alias_record_lab_result(lab_request_id: str, body: dict):
    from app.routers.officer import record_lab_result, LabResultRequest
    req = LabResultRequest(**body)
    return record_lab_result(lab_request_id, req)


# ── Admin Management ─────────────────────────────────────────────────────────

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


@router.get("/admin/users")
def get_admin_users(limit: int = 50):
    """List all registered system users across all roles."""
    users = []

    # 1. Supabase users
    try:
        db = get_supabase()
        res = db.table("users").select("*").limit(limit).execute()
        users = res.data or []
    except Exception as exc:
        logger.warning("Supabase users query skipped/failed: %s", exc)

    # 2. Local ORM users
    if not users:
        try:
            session = SessionLocal()
            orm_users = session.query(User).limit(limit).all()
            for u in orm_users:
                users.append({
                    "id": str(u.id),
                    "email": u.email,
                    "name": u.name,
                    "role": u.role,
                    "district": u.district,
                    "phone": u.phone,
                    "badge": u.badge,
                    "created_at": u.created_at.isoformat() if u.created_at else None,
                })
            session.close()
        except Exception as exc:
            logger.error("ORM users query error: %s", exc)

    # 3. Include default demo user profiles if list is small
    demo_profiles = [
        {"id": "00000000-0000-0000-0000-000000000001", "name": "Sunil Wickramasinghe", "email": "farmer@gmail.com", "role": "farmer", "district": "Gampaha"},
        {"id": "00000000-0000-0000-0000-000000000002", "name": "Dr. Bandara Rajapaksha", "email": "officer@gmail.com", "role": "officer", "district": "Western Province"},
        {"id": "00000000-0000-0000-0000-000000000003", "name": "National Pathology Research Lab", "email": "lab@gmail.com", "role": "lab", "district": "Peradeniya Research Center"},
        {"id": "00000000-0000-0000-0000-000000000004", "name": "System Administrator", "email": "admin@gmail.com", "role": "admin", "district": "Ministry HQ Colombo"},
    ]
    seen_emails = {u.get("email") for u in users if u.get("email")}
    for dp in demo_profiles:
        if dp["email"] not in seen_emails:
            users.append(dp)

    return ok(users)


@router.get("/admin/guidance")
def get_treatment_guidance():
    """Returns official approved disease definitions & treatment protocols."""
    guidance_path = Path(__file__).parent.parent / "data" / "treatment_guidance.json"
    try:
        data = json.loads(guidance_path.read_text(encoding="utf-8"))
        return ok(data)
    except Exception as exc:
        logger.error("Error reading treatment guidance: %s", exc)
        return ok({}, "Guidance loaded")
