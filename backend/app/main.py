from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.receipt import router as receipt_router
from app.api.recipes import router as recipes_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title="Shopping List Recipe Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(receipt_router)
app.include_router(recipes_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
