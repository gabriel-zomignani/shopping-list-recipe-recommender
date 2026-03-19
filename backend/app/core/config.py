from __future__ import annotations

import os
from functools import lru_cache

from dotenv import load_dotenv
from pydantic import BaseModel, Field

DEFAULT_CORS_ORIGINS = "http://127.0.0.1:3000,http://localhost:3000"


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


class Settings(BaseModel):
    ocr_space_api_key: str | None = None
    openrouter_api_key: str | None = None
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_model_extraction: str = "openrouter/free"
    openrouter_model_recipes: str = "openrouter/free"
    cors_allowed_origins: list[str] = Field(
        default_factory=lambda: _split_csv(DEFAULT_CORS_ORIGINS)
    )
    max_receipt_upload_bytes: int = 8 * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    load_dotenv()
    return Settings(
        ocr_space_api_key=os.getenv("OCR_SPACE_API_KEY"),
        openrouter_api_key=os.getenv("OPENROUTER_API_KEY"),
        openrouter_base_url=os.getenv(
            "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"
        ),
        openrouter_model_extraction=os.getenv(
            "OPENROUTER_MODEL_EXTRACTION", "openrouter/free"
        ),
        openrouter_model_recipes=os.getenv("OPENROUTER_MODEL_RECIPES", "openrouter/free"),
        cors_allowed_origins=_split_csv(
            os.getenv("CORS_ALLOWED_ORIGINS", DEFAULT_CORS_ORIGINS)
        ),
    )
