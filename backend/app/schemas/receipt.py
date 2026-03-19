from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

ALLOWED_RECEIPT_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


class ReceiptItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    quantity: float | None = None
    unit: str | None = None


class ReceiptExtractionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    store: str | None = None
    date: str | None = None
    items: list[ReceiptItem] = Field(default_factory=list)
