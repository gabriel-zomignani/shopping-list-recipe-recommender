from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.core.errors import ServiceError
from app.schemas.recipe import RecipeGenerationRequest, RecipeGenerationResponse
from app.services.recipe_generation import generate_recipes

router = APIRouter(prefix="/recipes", tags=["recipes"])


@router.post("/generate", response_model=RecipeGenerationResponse)
async def generate_recipe_suggestions(
    request: RecipeGenerationRequest,
) -> RecipeGenerationResponse:
    if not request.availableIngredients:
        raise HTTPException(
            status_code=400,
            detail="Select at least one available ingredient before generating recipes.",
        )

    try:
        return await generate_recipes(request)
    except ServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
