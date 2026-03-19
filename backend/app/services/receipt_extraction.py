from __future__ import annotations

import re
from typing import Any

from app.core.config import get_settings
from app.core.errors import ServiceError
from app.schemas.receipt import ReceiptExtractionResponse, ReceiptItem
from app.services.ocr_space import extract_text_with_ocr_space
from app.services.openrouter import request_openrouter_json

MAX_OCR_TEXT_CHARS = 12000
RECEIPT_JUNK_PATTERNS = [
    re.compile(r"\bsubtotal\b", re.IGNORECASE),
    re.compile(r"\btotal\b", re.IGNORECASE),
    re.compile(r"\btax\b", re.IGNORECASE),
    re.compile(r"\bvat\b", re.IGNORECASE),
    re.compile(r"\bchange\b", re.IGNORECASE),
    re.compile(r"\bcash\b", re.IGNORECASE),
    re.compile(r"\bpayment\b", re.IGNORECASE),
    re.compile(r"\bdebit\b", re.IGNORECASE),
    re.compile(r"\bcredit\b", re.IGNORECASE),
    re.compile(r"\bcard\b", re.IGNORECASE),
    re.compile(r"\bloyalty\b", re.IGNORECASE),
    re.compile(r"\breward\b", re.IGNORECASE),
    re.compile(r"\bpoints?\b", re.IGNORECASE),
    re.compile(r"\bcashier\b", re.IGNORECASE),
    re.compile(r"\bthank you\b", re.IGNORECASE),
    re.compile(r"\btransaction\b", re.IGNORECASE),
    re.compile(r"\bauth(entication|orization)?\b", re.IGNORECASE),
    re.compile(r"\bphone\b", re.IGNORECASE),
    re.compile(r"\baddress\b", re.IGNORECASE),
    re.compile(r"\breceipt\b", re.IGNORECASE),
]


def _collapse_whitespace(value: str) -> str:
    return " ".join(value.split()).strip()


def _normalize_nullable_string(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    normalized = _collapse_whitespace(value)
    return normalized or None


def _normalize_quantity(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, str):
        try:
            value = float(value)
        except ValueError:
            return None
    if not isinstance(value, (int, float)):
        return None
    if value <= 0:
        return None
    return round(float(value), 2)


def _normalize_item_name(value: Any) -> str:
    if not isinstance(value, str):
        return ""
    normalized = _collapse_whitespace(value)
    normalized = re.sub(r"^[\s\-*.,:;]+", "", normalized).strip()
    normalized = re.sub(r"\s+[$€£]?\d+[.,]\d{2}$", "", normalized).strip()
    return normalized


def _is_receipt_junk_line(name: str) -> bool:
    if not name:
        return True
    if re.match(r"^\d{6,}$", name):
        return True
    return any(pattern.search(name) for pattern in RECEIPT_JUNK_PATTERNS)


def _normalize_items(raw_items: Any) -> list[ReceiptItem]:
    if not isinstance(raw_items, list):
        return []

    merged: dict[str, ReceiptItem] = {}
    for raw_item in raw_items:
        if not isinstance(raw_item, dict):
            continue

        name = _normalize_item_name(raw_item.get("name"))
        if not name or _is_receipt_junk_line(name):
            continue

        quantity = _normalize_quantity(raw_item.get("quantity"))
        unit = _normalize_nullable_string(raw_item.get("unit"))
        merge_key = f"{name.lower()}::{(unit or '').lower()}"

        if merge_key not in merged:
            merged[merge_key] = ReceiptItem(name=name, quantity=quantity, unit=unit)
            continue

        existing = merged[merge_key]
        if existing.quantity is not None and quantity is not None:
            existing.quantity = round(existing.quantity + quantity, 2)
        elif existing.quantity is None and quantity is not None:
            existing.quantity = quantity

    return list(merged.values())


def _build_prompt(ocr_text: str) -> str:
    schema_text = """
{
  "store": "string | null",
  "date": "string | null",
  "items": [
    {
      "name": "string",
      "quantity": "number | null",
      "unit": "string | null"
    }
  ]
}
""".strip()
    return (
        "Convert this OCR text from a grocery receipt into strict JSON.\n\n"
        "Return only grocery-like purchased items.\n"
        "Ignore totals, taxes, payment/card details, cashier/footer/header metadata, loyalty lines, "
        "transaction IDs, addresses, and phone numbers.\n"
        "Normalize names into short user-friendly grocery items.\n"
        "Set quantity/unit only when clearly visible. Otherwise use null.\n"
        "Return JSON only and do not include markdown.\n\n"
        f"Required JSON shape:\n{schema_text}\n\n"
        f"OCR text:\n{ocr_text}"
    )


def _normalize_receipt_payload(payload: dict[str, Any]) -> ReceiptExtractionResponse:
    store = _normalize_nullable_string(payload.get("store"))
    date = _normalize_nullable_string(payload.get("date"))
    items = _normalize_items(payload.get("items"))

    return ReceiptExtractionResponse(store=store, date=date, items=items)


async def extract_receipt_from_image(
    *, file_bytes: bytes, file_name: str, mime_type: str
) -> ReceiptExtractionResponse:
    ocr_text = await extract_text_with_ocr_space(
        file_bytes=file_bytes,
        file_name=file_name,
        mime_type=mime_type,
    )
    prompt_text = ocr_text[:MAX_OCR_TEXT_CHARS]
    settings = get_settings()

    payload = await request_openrouter_json(
        model=settings.openrouter_model_extraction,
        system_prompt="You extract groceries from OCR text and must return strict JSON only.",
        user_prompt=_build_prompt(prompt_text),
        temperature=0,
    )

    try:
        return _normalize_receipt_payload(payload)
    except Exception as exc:  # defensive wrapper for malformed model output
        raise ServiceError("Receipt extraction returned JSON in an unexpected format.") from exc
