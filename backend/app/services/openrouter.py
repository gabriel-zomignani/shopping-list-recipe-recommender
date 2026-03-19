from __future__ import annotations

from typing import Any

import httpx

from app.core.config import get_settings
from app.core.errors import ServiceError
from app.core.json_utils import parse_json_object_from_text


def _read_content_text(content: Any) -> str | None:
    if isinstance(content, str):
        trimmed = content.strip()
        return trimmed or None

    if not isinstance(content, list):
        return None

    parts: list[str] = []
    for part in content:
        if isinstance(part, dict):
            text = part.get("text")
            if isinstance(text, str) and text.strip():
                parts.append(text.strip())

    if not parts:
        return None

    return "\n".join(parts)


def _read_error_message(payload: Any, default: str) -> str:
    if isinstance(payload, dict):
        error = payload.get("error")
        if isinstance(error, str) and error.strip():
            return error.strip()
        if isinstance(error, dict):
            message = error.get("message")
            if isinstance(message, str) and message.strip():
                return message.strip()
    return default


async def request_openrouter_json(
    *,
    model: str,
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0,
) -> dict:
    settings = get_settings()
    if not settings.openrouter_api_key:
        raise ServiceError("Recipe and extraction AI service is not configured on this server.", 500)

    url = f"{settings.openrouter_base_url.rstrip('/')}/chat/completions"
    payload = {
        "model": model,
        "temperature": temperature,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=70.0) as client:
            response = await client.post(url, json=payload, headers=headers)
    except httpx.RequestError as exc:
        raise ServiceError(
            "AI generation service is unavailable right now. Please try again."
        ) from exc

    response_payload: Any
    try:
        response_payload = response.json()
    except ValueError:
        response_payload = {}

    if response.status_code >= 400:
        message = _read_error_message(
            response_payload,
            f"AI generation request failed with status {response.status_code}.",
        )
        raise ServiceError(message)

    choices = response_payload.get("choices") if isinstance(response_payload, dict) else None
    first_choice = choices[0] if isinstance(choices, list) and choices else None
    message = first_choice.get("message") if isinstance(first_choice, dict) else None
    content = message.get("content") if isinstance(message, dict) else None
    content_text = _read_content_text(content)

    if not content_text:
        raise ServiceError("AI generation service returned an empty response.")

    try:
        return parse_json_object_from_text(content_text, "OpenRouter")
    except ValueError as exc:
        raise ServiceError(str(exc)) from exc
