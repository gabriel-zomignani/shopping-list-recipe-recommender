from __future__ import annotations

from typing import Any

import httpx

from app.core.config import get_settings
from app.core.errors import ServiceError

OCR_SPACE_URL = "https://api.ocr.space/parse/image"


def _normalize_error(value: Any) -> str:
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, list):
        return " ".join(str(item).strip() for item in value if str(item).strip())
    return ""


async def extract_text_with_ocr_space(
    *, file_bytes: bytes, file_name: str, mime_type: str
) -> str:
    settings = get_settings()
    if not settings.ocr_space_api_key:
        raise ServiceError("Receipt OCR service is not configured on this server.", 500)

    files = {"file": (file_name, file_bytes, mime_type)}
    data = {
        "isOverlayRequired": "false",
        "OCREngine": "2",
        "language": "eng",
        "scale": "true",
    }
    headers = {"apikey": settings.ocr_space_api_key}

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                OCR_SPACE_URL,
                data=data,
                files=files,
                headers=headers,
            )
    except httpx.RequestError as exc:
        raise ServiceError("Receipt OCR service is unavailable right now. Please try again.") from exc

    payload: Any
    try:
        payload = response.json()
    except ValueError:
        payload = {}

    if response.status_code >= 400:
        raise ServiceError(
            f"Receipt OCR request failed with status {response.status_code}."
        )

    is_errored = bool(payload.get("IsErroredOnProcessing")) if isinstance(payload, dict) else True
    exit_code = payload.get("OCRExitCode") if isinstance(payload, dict) else None
    if is_errored or exit_code != 1:
        error_message = _normalize_error(payload.get("ErrorMessage") if isinstance(payload, dict) else "")
        details = (
            str(payload.get("ErrorDetails", "")).strip() if isinstance(payload, dict) else ""
        )
        message = " ".join(part for part in [error_message, details] if part).strip()
        raise ServiceError(
            message or "Could not read this receipt image. Try a clearer, front-facing photo."
        )

    parsed_results = payload.get("ParsedResults") if isinstance(payload, dict) else None
    parsed_lines: list[str] = []
    if isinstance(parsed_results, list):
        for result in parsed_results:
            if isinstance(result, dict):
                text = result.get("ParsedText")
                if isinstance(text, str) and text.strip():
                    parsed_lines.append(text.strip())

    parsed_text = "\n".join(parsed_lines).strip()
    if not parsed_text:
        raise ServiceError("No readable text was found on this receipt image.", 422)

    return parsed_text
