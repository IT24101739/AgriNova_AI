"""
diagnosis_aggregator.py – Dev 2

Deterministic rule engine that combines:
  • image_confidence  (from Member 1's classifier)
  • severity          (LOW / MODERATE / HIGH / CRITICAL)
  • weather_risk      (LOW / MEDIUM / HIGH)
  • weather_supports  (bool)
  • nearby_case_count
  • outbreak_risk     (LOW / MEDIUM / HIGH)

…and outputs a routing decision plus a spread-risk level.

NO LLM is used here.  Safety-sensitive routing must be deterministic.
"""

from __future__ import annotations

from typing import List

# ── Configurable thresholds ───────────────────────────────────────────────────
CONF_AUTO = 0.80          # >= this → normally AUTO_ADVICE
CONF_MORE_INFO = 0.50     # 0.50-0.79 → NEED_MORE_INFO
                          # < 0.50   → OFFICER_REVIEW

SEVERITY_ESCALATE = {"HIGH", "CRITICAL"}
OUTBREAK_ESCALATE = {"HIGH"}
OUTBREAK_MIN_COUNT = 3    # need at least this many nearby cases for OUTBREAK_WARNING

_RISK_SCORE = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}
_SEV_SCORE = {"LOW": 0, "MODERATE": 1, "HIGH": 2, "CRITICAL": 3}


# ── Spread-risk helper ────────────────────────────────────────────────────────

def _spread_risk(weather_risk: str, outbreak_risk: str, severity: str) -> str:
    score = (
        _RISK_SCORE.get(weather_risk, 0)
        + _RISK_SCORE.get(outbreak_risk, 0)
        + _SEV_SCORE.get(severity.upper(), 0)
    )
    if score >= 4:
        return "HIGH"
    if score >= 2:
        return "MEDIUM"
    return "LOW"


# ── Main aggregator ───────────────────────────────────────────────────────────

def aggregate_diagnosis(
    disease: str,
    image_confidence: float,
    severity: str,
    weather_risk: str,
    weather_supports: bool,
    nearby_case_count: int,
    outbreak_risk: str,
) -> dict:
    """
    Aggregate all signals and produce a routing decision.

    Returns:
        {
            "final_disease":    str,
            "final_confidence": float,      # 0-1, adjusted
            "spread_risk":      str,        # LOW | MEDIUM | HIGH
            "decision":         str,        # AUTO_ADVICE | NEED_MORE_INFO | OFFICER_REVIEW | OUTBREAK_WARNING
            "reasons":          [str, ...],
        }
    """
    reasons: List[str] = []
    conf = float(image_confidence)

    # ── Small evidence-based confidence adjustments ───────────────────────────
    if weather_supports:
        conf = min(1.0, conf + 0.05)
        reasons.append("Current weather conditions (high humidity / rainfall) support this disease prediction.")

    if outbreak_risk == "HIGH":
        conf = min(1.0, conf + 0.05)
        reasons.append(
            f"{nearby_case_count} similar cases found nearby, which strengthens the diagnosis."
        )
    elif outbreak_risk == "MEDIUM":
        conf = min(1.0, conf + 0.02)
        reasons.append(f"{nearby_case_count} similar report(s) found nearby — moderate supporting evidence.")

    conf = round(conf, 4)
    spread = _spread_risk(weather_risk, outbreak_risk, severity)

    # ── Decision routing (priority order, safety-first) ───────────────────────
    sev_upper = severity.upper()

    # 1. Outbreak warning — highest priority
    if outbreak_risk in OUTBREAK_ESCALATE and nearby_case_count >= OUTBREAK_MIN_COUNT:
        decision = "OUTBREAK_WARNING"
        reasons.append(
            "High number of nearby confirmed/predicted cases indicates a potential regional outbreak."
        )

    # 2. HIGH/CRITICAL severity + uncertain confidence → officer
    elif sev_upper in SEVERITY_ESCALATE and conf < CONF_AUTO:
        decision = "OFFICER_REVIEW"
        reasons.append(
            f"Severity is {severity.upper()} but confidence ({conf:.0%}) is below the safe threshold — an officer will review."
        )

    # 3. Standard confidence routing
    elif conf >= CONF_AUTO:
        decision = "AUTO_ADVICE"
        reasons.append(f"Confidence ({conf:.0%}) is high enough for automated treatment advice.")
        if sev_upper in SEVERITY_ESCALATE:
            reasons.append(
                f"Severity is {severity.upper()} — extra monitoring is recommended even after treatment."
            )

    elif CONF_MORE_INFO <= conf < CONF_AUTO:
        decision = "NEED_MORE_INFO"
        reasons.append(
            f"Confidence ({conf:.0%}) is moderate. A clearer photo may help confirm the diagnosis."
        )
        # If outbreak evidence is strong even with medium confidence, escalate
        if outbreak_risk in OUTBREAK_ESCALATE:
            decision = "OUTBREAK_WARNING"
            reasons.append(
                "Despite uncertain image confidence, strong outbreak evidence requires immediate attention."
            )

    else:
        # conf < CONF_MORE_INFO
        decision = "OFFICER_REVIEW"
        reasons.append(
            f"Confidence ({conf:.0%}) is too low for automated advice. An agriculture officer will review the case."
        )

    return {
        "final_disease": disease,
        "final_confidence": conf,
        "spread_risk": spread,
        "decision": decision,
        "reasons": reasons,
    }
