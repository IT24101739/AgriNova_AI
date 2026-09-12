"""
Priority scoring module – deterministic, no LLM dependency.

Scoring table
─────────────
+3  severity   == "HIGH"
+3  outbreak_risk == "HIGH"
+2  confidence < 0.50
+2  nearby_report_count >= 3
+1  weather_supports_spread == True
─────────────
0-2 → LOW
3-5 → MEDIUM
6+  → HIGH
"""
from dataclasses import dataclass, field
from typing import Literal


PriorityLevel = Literal["LOW", "MEDIUM", "HIGH"]


@dataclass
class PriorityInput:
    severity: str = "LOW"               # "LOW" | "MEDIUM" | "HIGH"
    outbreak_risk: str = "LOW"          # "LOW" | "MEDIUM" | "HIGH"
    confidence: float = 1.0            # 0.0 – 1.0
    nearby_report_count: int = 0
    weather_supports_spread: bool = False


@dataclass
class PriorityResult:
    level: PriorityLevel
    score: int
    reasons: list[str] = field(default_factory=list)


def compute_priority(inp: PriorityInput) -> PriorityResult:
    score = 0
    reasons: list[str] = []

    if inp.severity == "HIGH":
        score += 3
        reasons.append("Disease severity is HIGH")
    elif inp.severity == "MEDIUM":
        score += 1
        reasons.append("Disease severity is MEDIUM")

    if inp.outbreak_risk == "HIGH":
        score += 3
        reasons.append("Outbreak risk flagged as HIGH")
    elif inp.outbreak_risk == "MEDIUM":
        score += 1
        reasons.append("Outbreak risk is MEDIUM")

    if inp.confidence < 0.50:
        score += 2
        reasons.append(f"AI confidence is low ({inp.confidence:.0%})")

    if inp.nearby_report_count >= 3:
        score += 2
        reasons.append(
            f"{inp.nearby_report_count} nearby farms reported similar symptoms recently"
        )

    if inp.weather_supports_spread:
        score += 1
        reasons.append("Current weather conditions support disease spread")

    if score >= 6:
        level: PriorityLevel = "HIGH"
    elif score >= 3:
        level = "MEDIUM"
    else:
        level = "LOW"

    return PriorityResult(level=level, score=score, reasons=reasons)
