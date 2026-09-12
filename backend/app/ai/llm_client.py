"""
llm_client.py – Dev 2

Thin async wrapper around an LLM provider.
Provider is selected via the LLM_PROVIDER env var ("gemini" | "openai").
Swap providers without changing any calling code.

Reads:
    LLM_PROVIDER   – "gemini" (default) or "openai"
    LLM_API_KEY    – API key for chosen provider
    LLM_MODEL      – model name (defaults to gemini-1.5-flash / gpt-4o-mini)
"""

from __future__ import annotations

import logging
import os

import httpx

logger = logging.getLogger(__name__)

def _get_api_key() -> str:
    return os.getenv("LLM_API_KEY") or os.getenv("GEMINI_API_KEY") or ""

def _get_provider() -> str:
    return os.getenv("LLM_PROVIDER", "gemini").lower()

def _get_model() -> str:
    provider = _get_provider()
    default_model = "gemini-2.5-flash" if provider == "gemini" else "gpt-4o-mini"
    return os.getenv("LLM_MODEL") or default_model

async def call_llm(system_prompt: str, user_prompt: str) -> str:
    api_key = _get_api_key()
    provider = _get_provider()

    if not api_key:
        raise RuntimeError(
            "Neither LLM_API_KEY nor GEMINI_API_KEY environment variable is set. "
            "Add it to your .env file before using AI features."
        )

    if provider == "gemini":
        return await _gemini(system_prompt, user_prompt)
    if provider == "openai":
        return await _openai(system_prompt, user_prompt)

    raise ValueError(f"Unknown LLM_PROVIDER: '{provider}'. Use 'gemini' or 'openai'.")


# ── Gemini ────────────────────────────────────────────────────────────────────

async def _gemini(system_prompt: str, user_prompt: str) -> str:
    api_key = _get_api_key()
    model = _get_model()
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent?key={api_key}"
    )
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": f"{system_prompt}\n\n---\n\n{user_prompt}"}],
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 4096,
            "responseMimeType": "application/json",
        },
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as exc:
        logger.error("Unexpected Gemini response structure: %s", data)
        raise RuntimeError("Failed to parse Gemini response.") from exc


# ── OpenAI ────────────────────────────────────────────────────────────────────

async def _openai(system_prompt: str, user_prompt: str) -> str:
    url = "https://api.openai.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {LLM_API_KEY}"}
    payload = {
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.3,
        "max_tokens": 1024,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError) as exc:
        logger.error("Unexpected OpenAI response structure: %s", data)
        raise RuntimeError("Failed to parse OpenAI response.") from exc
