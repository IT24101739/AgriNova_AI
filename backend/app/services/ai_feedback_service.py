"""
AI Feedback Service
───────────────────
Records officer-confirmed diagnoses for future model training/validation.
These records form the feedback loop that improves the AI over time.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime
from typing import Any, Optional

from app.database import get_supabase

logger = logging.getLogger(__name__)


def save_feedback(
    *,
    report_id: str,
    predicted_disease: str,
    confidence: float,
    confirmed_disease: str,
) -> dict[str, Any]:
    """
    Persist an AI feedback record after an officer confirms/corrects a diagnosis.

    Args:
        report_id:         UUID of the reports row.
        predicted_disease: Disease the AI predicted.
        confidence:        AI confidence (0.0–1.0).
        confirmed_disease: What the officer confirmed as the actual disease.

    Returns:
        The saved ai_feedback row.
    """
    db = get_supabase()
    is_correct = predicted_disease.strip().lower() == confirmed_disease.strip().lower()

    payload = {
        "id": str(uuid.uuid4()),
        "report_id": report_id,
        "predicted_disease": predicted_disease,
        "confirmed_disease": confirmed_disease,
        "confidence": confidence,
        "correct": is_correct,
        "created_at": datetime.utcnow().isoformat(),
    }

    result = db.table("ai_feedback").insert(payload).execute()
    logger.info(
        "AI feedback saved: predicted=%s confirmed=%s correct=%s",
        predicted_disease,
        confirmed_disease,
        is_correct,
    )
    return result.data[0]


def get_feedback_records(
    limit: int = 100,
    offset: int = 0,
    only_incorrect: bool = False,
) -> list[dict[str, Any]]:
    """Return paginated feedback records for admin review."""
    db = get_supabase()
    q = (
        db.table("ai_feedback")
        .select("*, reports(crop, disease, image_url, created_at)")
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
    )
    if only_incorrect:
        q = q.eq("correct", False)
    return q.execute().data


def get_feedback_summary() -> dict[str, Any]:
    """Aggregate stats for admin dashboard."""
    db = get_supabase()
    all_records = db.table("ai_feedback").select("correct").execute().data
    total = len(all_records)
    correct = sum(1 for r in all_records if r.get("correct"))
    incorrect = total - correct
    accuracy = round((correct / total) * 100, 1) if total > 0 else None

    return {
        "total_feedback": total,
        "correct_predictions": correct,
        "incorrect_predictions": incorrect,
        "accuracy_percent": accuracy,
    }
