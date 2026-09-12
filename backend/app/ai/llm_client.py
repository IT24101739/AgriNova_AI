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

LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini").lower()
LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
LLM_MODEL: str = os.getenv(
    "LLM_MODEL",
    "gemini-1.5-flash" if LLM_PROVIDER == "gemini" else "gpt-4o-mini",
)


async def call_llm(system_prompt: str, user_prompt: str) -> str:
    """
    Send a prompt to the configured LLM and return its text response.

    Args:
        system_prompt: Instruction / constraint block for the model.
        user_prompt:   The user-facing question or context block.

    Returns:
        Model's text response as a plain string.

    Raises:
        RuntimeError: If LLM_API_KEY is not set.
        httpx.HTTPStatusError: On HTTP 4xx/5xx from the provider.
    """
    if not LLM_API_KEY:
        raise RuntimeError(
            "LLM_API_KEY environment variable is not set. "
            "Add it to your .env file before using AI features."
        )

    if LLM_PROVIDER == "gemini":
        return await _gemini(system_prompt, user_prompt)
    if LLM_PROVIDER == "openai":
        return await _openai(system_prompt, user_prompt)

    raise ValueError(f"Unknown LLM_PROVIDER: '{LLM_PROVIDER}'. Use 'gemini' or 'openai'.")


# ── Gemini ────────────────────────────────────────────────────────────────────

async def _gemini(system_prompt: str, user_prompt: str) -> str:
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{LLM_MODEL}:generateContent?key={LLM_API_KEY}"
    )
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": f"{system_prompt}\n\n---\n\n{user_prompt}"}],
            }
        ],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 1024,
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
