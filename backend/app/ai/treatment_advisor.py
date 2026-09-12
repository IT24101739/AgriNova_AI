"""
treatment_advisor.py – Dev 2

Generates localized, farmer-friendly treatment advice using an LLM.

Key constraint: The LLM is ONLY allowed to rephrase / simplify steps
that exist in treatment_guidance.json. It cannot add new treatments,
recommend specific pesticides, or invent escalation criteria.

This module:
  1. Loads the approved guidance for the detected disease.
  2. Passes ONLY those approved steps + context to the LLM.
  3. Instructs the LLM to respond in JSON with fixed keys.
  4. Falls back to a safe static response if the LLM fails.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict

from .llm_client import call_llm

logger = logging.getLogger(__name__)

GUIDANCE_PATH = Path(__file__).parent.parent / "data" / "treatment_guidance.json"

LANGUAGE_NAMES: Dict[str, str] = {
    "en": "English",
    "si": "Sinhala (සිංහල)",
    "ta": "Tamil (தமிழ்)",
}

# ── System prompt ─────────────────────────────────────────────────────────────

_SYSTEM = """\
You are a friendly agricultural advisor helping farmers in Sri Lanka understand a crop disease diagnosis.

YOUR TASK
Rewrite the treatment steps below in simple, warm language that a farmer with no technical background can understand.

HARD RULES – You MUST follow these exactly:
1. Use ONLY the treatment steps listed under "Approved steps". Do NOT add new treatments, pesticides, or chemicals.
2. Do NOT include any scientific or medical jargon.
3. Write in {language_name}. Keep each step under 30 words.
4. Respond with VALID JSON only — no markdown fences, no preamble, no trailing text.
5. The JSON must contain exactly these three keys:
   - "diagnosis_text":  2–3 sentences explaining what the disease is and why it matters to the farmer.
   - "treatment_steps": array of strings — each approved step rewritten in plain farmer language.
   - "warning":         one sentence warning IF severity is HIGH or outbreak risk is HIGH; otherwise null.

APPROVED STEPS FOR THIS DISEASE:
{approved_steps}

ESCALATE WARNINGS (mention only if directly relevant):
{escalate_if}
"""


# ── Guidance loader ───────────────────────────────────────────────────────────

def _load_guidance() -> Dict[str, Any]:
    try:
        return json.loads(GUIDANCE_PATH.read_text(encoding="utf-8"))
    except FileNotFoundError:
        logger.error("treatment_guidance.json not found at %s", GUIDANCE_PATH)
        return {}


def _find_guidance(disease: str, guidance: Dict[str, Any]) -> Dict[str, Any] | None:
    """Case-insensitive lookup of disease in the guidance dict."""
    if disease in guidance:
        return guidance[disease]
    dl = disease.lower()
    for key, val in guidance.items():
        if key.lower() == dl:
            return val
    return None


# ── Fallback ──────────────────────────────────────────────────────────────────

def _fallback(disease: str, language: str) -> Dict[str, Any]:
    return {
        "language": language,
        "diagnosis_text": (
            f"Your crop may be affected by {disease}. "
            "Please follow the steps below and contact your local agriculture officer if the problem continues."
        ),
        "treatment_steps": [
            "Remove heavily affected leaves and dispose of them away from the field.",
            "Avoid wetting the leaves when watering.",
            "Contact your local agriculture officer for further guidance.",
        ],
        "warning": (
            "Automated treatment advice is temporarily unavailable. "
            "Please consult your local agriculture officer as soon as possible."
        ),
    }


# ── Main function ─────────────────────────────────────────────────────────────

async def generate_treatment_advice(
    disease: str,
    severity: str,
    spread_risk: str,
    outbreak_risk: str,
    weather_summary: str,
    language: str = "en",
) -> Dict[str, Any]:
    """
    Generate localized, farmer-friendly treatment advice.

    Args:
        disease:         Canonical English disease name (e.g. "Tomato Early Blight").
        severity:        LOW | MODERATE | HIGH | CRITICAL
        spread_risk:     LOW | MEDIUM | HIGH
        outbreak_risk:   LOW | MEDIUM | HIGH
        weather_summary: Short human-readable weather context string.
        language:        "en" | "si" | "ta"

    Returns:
        {
            "language":        str,
            "diagnosis_text":  str,
            "treatment_steps": [str, ...],
            "warning":         str | None,
        }
    """
    # If leaf is diagnosed as healthy
    if "healthy" in disease.lower():
        if language == "si":
            return {
                "language": "si",
                "diagnosis_text": "සුබ ආරංචියක්! ඔබගේ ශාක පත්‍ර නිරෝගීව පවතින අතර, කිසිදු දිලීර හෝ බැක්ටීරියා රෝග ලක්ෂණයක් හඳුනාගෙන නොමැත.",
                "treatment_steps": [
                    "ශාකයට අවශ්‍ය ප්‍රමාණයට නිසි ලෙස ජලය සපයන්න, මුල් කුණුවීම වැළැක්වීමට අධික ජලය බැසයාම තහවුරු කරන්න.",
                    "වර්ධන අවධියට ගැළපෙන කාබනික හෝ සමබර NPK පොහොර යොදන්න.",
                    "රෝග හෝ පළිබෝධකයන් කල්තියා හඳුනාගැනීම සඳහා සතිපතා පත්‍ර පරීක්ෂාව දිගටම කරගෙන යන්න.",
                ],
                "warning": None,
            }
        elif language == "ta":
            return {
                "language": "ta",
                "diagnosis_text": "நல்ல செய்தி! உங்கள் பயிர் இலை ஆரோக்கியமாக உள்ளது, பூஞ்சை அல்லது பாக்டீரியா நோய் அறிகுறிகள் எதுவும் தென்படவில்லை.",
                "treatment_steps": [
                    "வழக்கமான நீர்ப்பாசனத்தைப் பராமரிக்கவும்; வேர் அழுகலைத் தவிர்க்க அதிகப்படியான நீர் தேங்குவதைத் தடுக்கவும்.",
                    "வளர்ச்சி நிலைக்கு ஏற்ப சமச்சீர் கரிம அல்லது NPK உரங்களைப் பயன்படுத்தவும்.",
                    "பூச்சிகள் மற்றும் ஆரம்பகால நோய்களைக் கண்டறிய வாராந்திர இலை சோதனையைத் தொடரவும்.",
                ],
                "warning": None,
            }
        else:
            return {
                "language": "en",
                "diagnosis_text": "Great news! Your plant foliage is completely healthy with no detectable signs of fungal or bacterial disease.",
                "treatment_steps": [
                    "Maintain standard drip irrigation and ensure good soil drainage to protect root health.",
                    "Continue recommended organic compost or balanced NPK fertilizing according to the crop growth stage.",
                    "Conduct routine weekly crop scouting to catch any early signs of pest pressure or environmental stress.",
                ],
                "warning": None,
            }

    guidance = _load_guidance()
    disease_info = _find_guidance(disease, guidance)

    if not disease_info:
        logger.warning("No treatment guidance for disease '%s' – using fallback.", disease)
        return _fallback(disease, language)

    approved_steps = "\n".join(f"- {s}" for s in disease_info.get("steps", []))
    escalate_if = "\n".join(f"- {e}" for e in disease_info.get("escalate_if", []))
    language_name = LANGUAGE_NAMES.get(language, "English")

    system_prompt = _SYSTEM.format(
        language_name=language_name,
        approved_steps=approved_steps,
        escalate_if=escalate_if,
    )

    user_prompt = (
        f"Disease:       {disease}\n"
        f"Severity:      {severity}\n"
        f"Spread Risk:   {spread_risk}\n"
        f"Outbreak Risk: {outbreak_risk}\n"
        f"Weather:       {weather_summary}\n\n"
        f"Please write the advice in {language_name}."
    )

    try:
        raw = await call_llm(system_prompt, user_prompt)
        # Strip accidental markdown fences
        raw = (
            raw.strip()
            .removeprefix("```json")
            .removeprefix("```")
            .removesuffix("```")
            .strip()
        )
        parsed = json.loads(raw)
        parsed["language"] = language
        # Validate required keys
        if not all(k in parsed for k in ("diagnosis_text", "treatment_steps")):
            raise ValueError("LLM response missing required keys.")
        return parsed
    except Exception as exc:
        logger.error("LLM treatment generation failed: %s", exc)
        return _fallback(disease, language)
