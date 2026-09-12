"""
Officer Case Assistant (AI)
────────────────────────────
Provides a structured summary of a complex report for the agriculture officer.

The AI does NOT make the final decision — it summarises evidence so the
officer can make a faster, better-informed call.

Priority is computed deterministically first; the LLM (if configured) then
produces a natural-language explanation.  If no LLM key is present the module
falls back to a rule-based summary string.
"""
from __future__ import annotations

import json
import logging
import os
from typing import Any

from app.utils.priority_scorer import PriorityInput, PriorityResult, compute_priority

logger = logging.getLogger(__name__)


# ── Input dataclass ──────────────────────────────────────────────────────────

class CaseContext:
    """All evidence available for a single officer ticket."""

    def __init__(
        self,
        *,
        farmer_description: str = "",
        predicted_disease: str = "Unknown",
        confidence: float = 0.0,
        severity: str = "LOW",
        spread_risk: str = "LOW",
        outbreak_risk: str = "LOW",
        weather_summary: str = "",
        nearby_report_count: int = 0,
        weather_supports_spread: bool = False,
        crop: str = "",
        location: str = "",
    ) -> None:
        self.farmer_description = farmer_description
        self.predicted_disease = predicted_disease
        self.confidence = confidence
        self.severity = severity
        self.spread_risk = spread_risk
        self.outbreak_risk = outbreak_risk
        self.weather_summary = weather_summary
        self.nearby_report_count = nearby_report_count
        self.weather_supports_spread = weather_supports_spread
        self.crop = crop
        self.location = location


# ── Output structure ─────────────────────────────────────────────────────────

class OfficerCaseSummary:
    def __init__(
        self,
        *,
        summary: str,
        suggested_priority: str,
        reasons: list[str],
        score: int,
    ) -> None:
        self.summary = summary
        self.suggested_priority = suggested_priority
        self.reasons = reasons
        self.score = score

    def to_dict(self) -> dict[str, Any]:
        return {
            "summary": self.summary,
            "suggested_priority": self.suggested_priority,
            "reasons": self.reasons,
            "score": self.score,
        }


# ── Deterministic fallback summary ───────────────────────────────────────────

def _build_fallback_summary(ctx: CaseContext, priority: PriorityResult) -> str:
    parts: list[str] = []

    # Disease + confidence
    conf_pct = f"{ctx.confidence:.0%}"
    parts.append(
        f"The image model identified {ctx.predicted_disease} with {conf_pct} confidence"
        f" on a {ctx.crop or 'crop'} sample."
    )

    # Severity
    if ctx.severity == "HIGH":
        parts.append("Disease severity is rated HIGH, indicating significant crop damage risk.")
    elif ctx.severity == "MEDIUM":
        parts.append("Disease severity is MEDIUM.")

    # Nearby cases
    if ctx.nearby_report_count >= 3:
        parts.append(
            f"{ctx.nearby_report_count} nearby farms reported similar symptoms recently,"
            " suggesting possible regional spread."
        )

    # Outbreak risk
    if ctx.outbreak_risk == "HIGH":
        parts.append("Outbreak risk is flagged as HIGH — a confirmed outbreak may be imminent.")

    # Weather
    if ctx.weather_supports_spread:
        parts.append("Current weather conditions are favourable for disease spread.")

    # Farmer description
    if ctx.farmer_description:
        parts.append(f'Farmer reported: "{ctx.farmer_description[:200]}".')

    return " ".join(parts)


# ── LLM summary (optional) ───────────────────────────────────────────────────

def _llm_summary(ctx: CaseContext, priority: PriorityResult) -> str | None:
    api_key = os.getenv("LLM_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None

    try:
        from openai import OpenAI  # type: ignore

        base_url = os.getenv("LLM_BASE_URL")
        model = os.getenv("LLM_MODEL")

        if os.getenv("GEMINI_API_KEY") and not os.getenv("LLM_BASE_URL"):
            base_url = "https://generativelanguage.googleapis.com/v1beta/openai/"
            if not model:
                model = "gemini-1.5-flash"

        base_url = base_url or "https://api.openai.com/v1"
        model = model or "gpt-4o-mini"

        client = OpenAI(
            api_key=api_key,
            base_url=base_url,
        )


        system = (
            "You are an agricultural AI assistant helping agriculture officers review "
            "crop disease reports. Be concise, factual, and evidence-based. "
            "Do NOT make the final decision — only summarise evidence for the officer."
        )

        prompt = f"""
Summarise this crop disease case for an agriculture officer in 2-3 sentences.

Case details:
- Crop: {ctx.crop}
- Location: {ctx.location}
- Predicted disease: {ctx.predicted_disease}
- AI confidence: {ctx.confidence:.0%}
- Severity: {ctx.severity}
- Outbreak risk: {ctx.outbreak_risk}
- Spread risk: {ctx.spread_risk}
- Weather: {ctx.weather_summary or 'No data'}
- Nearby similar reports (7 days): {ctx.nearby_report_count}
- Weather supports spread: {ctx.weather_supports_spread}
- Farmer description: {ctx.farmer_description[:300] or 'Not provided'}
- Priority score: {priority.score} ({priority.level})
- Priority reasons: {'; '.join(priority.reasons)}

Write a single cohesive summary paragraph. End with the recommended action level.
"""

        resp = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            max_tokens=300,
            temperature=0.2,
        )
        return resp.choices[0].message.content.strip()

    except Exception as exc:  # noqa: BLE001
        logger.warning("LLM summary failed, falling back to rule-based: %s", exc)
        return None


# ── Public API ────────────────────────────────────────────────────────────────

def generate_case_summary(ctx: CaseContext) -> OfficerCaseSummary:
    """
    Primary entry point.  Returns an OfficerCaseSummary with:
      - summary (natural language)
      - suggested_priority (LOW | MEDIUM | HIGH)
      - reasons (list of human-readable strings)
      - score (integer)
    """
    priority_input = PriorityInput(
        severity=ctx.severity,
        outbreak_risk=ctx.outbreak_risk,
        confidence=ctx.confidence,
        nearby_report_count=ctx.nearby_report_count,
        weather_supports_spread=ctx.weather_supports_spread,
    )
    priority = compute_priority(priority_input)

    # Try LLM first, fall back to deterministic
    summary = _llm_summary(ctx, priority) or _build_fallback_summary(ctx, priority)

    return OfficerCaseSummary(
        summary=summary,
        suggested_priority=priority.level,
        reasons=priority.reasons,
        score=priority.score,
    )
