from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.core.config import get_settings
from app.core.errors import ServiceError
from app.schemas.receipt import ALLOWED_RECEIPT_IMAGE_TYPES, ReceiptExtractionResponse
from app.services.receipt_extraction import extract_receipt_from_image

router = APIRouter(prefix="/receipt", tags=["receipt"])


@router.post("/extract", response_model=ReceiptExtractionResponse)
async def extract_receipt(receipt: UploadFile = File(...)) -> ReceiptExtractionResponse:
    content_type = (receipt.content_type or "").strip().lower()
    if content_type not in ALLOWED_RECEIPT_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Receipt upload must be a JPG, PNG, or WEBP image.",
        )

    file_bytes = await receipt.read()
    if not file_bytes:
        raise HTTPException(
            status_code=400,
            detail="The selected file is empty. Choose a valid receipt image.",
        )

    settings = get_settings()
    if len(file_bytes) > settings.max_receipt_upload_bytes:
        raise HTTPException(
            status_code=400,
            detail="Receipt image is too large. Use an image under 8 MB.",
        )

    try:
        return await extract_receipt_from_image(
            file_bytes=file_bytes,
            file_name=receipt.filename or "receipt-image",
            mime_type=content_type,
        )
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
