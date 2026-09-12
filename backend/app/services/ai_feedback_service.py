"""
AI Feedback Service
───────────────────
Records officer/lab confirmed diagnoses for future model training/validation.
These records form the feedback loop that improves the AI over time.
Persists to both Supabase and local SQLAlchemy ORM for total resilience.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime
from typing import Any, Optional

from app.database import get_supabase
from app.models.database import SessionLocal
from app.models.report_model import AIFeedback

logger = logging.getLogger(__name__)


def save_feedback(
    *,
    report_id: Optional[str] = None,
    predicted_disease: str,
    confidence: float,
    confirmed_disease: str,
    source: str = "officer",
) -> dict[str, Any]:
    """
    Persist an AI feedback record after an expert confirms/corrects a diagnosis.
    """
    is_correct = predicted_disease.strip().lower() == confirmed_disease.strip().lower()
    feedback_id = str(uuid.uuid4())
    now_iso = datetime.utcnow().isoformat()

    # 1. Save to Supabase (only existing columns: id, report_id, predicted_disease, confirmed_disease, confidence)
    supabase_data = None
    try:
        db = get_supabase()
        sb_payload = {
            "id": feedback_id,
            "predicted_disease": predicted_disease,
            "confirmed_disease": confirmed_disease,
            "confidence": float(confidence),
        }
        if report_id:
            sb_payload["report_id"] = report_id

        res = db.table("ai_feedback").insert(sb_payload).execute()
        if res.data:
            supabase_data = res.data[0]
    except Exception as exc:
        logger.warning("Supabase ai_feedback insert skipped/failed: %s", exc)

    # 2. Save to local SQLAlchemy ORM (SQLite)
    try:
        session = SessionLocal()
        fb = AIFeedback(
            id=uuid.UUID(feedback_id),
            report_id=uuid.UUID(str(report_id)) if report_id else None,
            predicted_disease=predicted_disease,
            confirmed_disease=confirmed_disease,
            confidence=float(confidence),
            correct=is_correct,
            source=source,
            created_at=datetime.utcnow(),
        )
        session.add(fb)
        session.commit()
        session.close()
    except Exception as exc:
        logger.error("ORM ai_feedback save failed: %s", exc)

    logger.info(
        "AI feedback saved: predicted=%s confirmed=%s correct=%s",
        predicted_disease,
        confirmed_disease,
        is_correct,
    )

    return {
        "id": feedback_id,
        "report_id": report_id,
        "predicted_disease": predicted_disease,
        "confirmed_disease": confirmed_disease,
        "confidence": confidence,
        "correct": is_correct,
        "source": source,
        "created_at": now_iso,
    }


def get_feedback_records(
    limit: int = 100,
    offset: int = 0,
    only_incorrect: bool = False,
) -> list[dict[str, Any]]:
    """Return paginated feedback records for admin review."""
    records = []

    # 1. Try Supabase
    try:
        db = get_supabase()
        q = (
            db.table("ai_feedback")
            .select("*, reports(crop, disease, image_url, created_at)")
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
        )
        data = q.execute().data or []
        for r in data:
            pred = r.get("predicted_disease") or ""
            conf = r.get("confirmed_disease") or ""
            r["correct"] = (pred.strip().lower() == conf.strip().lower())
            records.append(r)
    except Exception as exc:
        logger.warning("Supabase ai_feedback query error: %s", exc)

    # 2. Also check ORM
    if not records:
        try:
            session = SessionLocal()
            orms = session.query(AIFeedback).order_by(AIFeedback.created_at.desc()).offset(offset).limit(limit).all()
            for o in orms:
                records.append({
                    "id": str(o.id),
                    "report_id": str(o.report_id) if o.report_id else None,
                    "predicted_disease": o.predicted_disease,
                    "confirmed_disease": o.confirmed_disease,
                    "confidence": o.confidence,
                    "correct": o.correct,
                    "source": o.source,
                    "created_at": o.created_at.isoformat() if o.created_at else None,
                })
            session.close()
        except Exception as exc:
            logger.error("ORM ai_feedback query error: %s", exc)

    if only_incorrect:
        records = [r for r in records if not r.get("correct")]

    return records


def get_feedback_summary() -> dict[str, Any]:
    """Aggregate stats for admin dashboard."""
    all_records = get_feedback_records(limit=1000)
    total = len(all_records)
    correct = sum(1 for r in all_records if r.get("correct"))
    incorrect = total - correct
    accuracy = round((correct / total) * 100, 1) if total > 0 else 0.0

    return {
        "total_feedback": total,
        "correct_predictions": correct,
        "incorrect_predictions": incorrect,
        "accuracy_percent": accuracy,
    }
