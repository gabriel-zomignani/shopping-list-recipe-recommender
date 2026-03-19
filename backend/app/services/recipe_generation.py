from __future__ import annotations

import re
from typing import Any

from app.core.config import get_settings
from app.core.errors import ServiceError
from app.schemas.recipe import Recipe, RecipeGenerationRequest, RecipeGenerationResponse
from app.services.openrouter import request_openrouter_json


def _collapse_whitespace(value: str) -> str:
    return " ".join(value.split()).strip()


def _normalize_ingredient_name(value: str) -> str:
    return _collapse_whitespace(value).lower()


def _normalize_string_list(items: Any, reject_pattern: re.Pattern[str] | None = None) -> list[str]:
    if not isinstance(items, list):
        return []

    seen: set[str] = set()
    normalized: list[str] = []

    for item in items:
        if not isinstance(item, str):
            continue
        value = _collapse_whitespace(re.sub(r"^[-*]\s*", "", item))
        if not value:
            continue
        lowered = value.lower()
        if lowered.startswith(("title:", "ingredients:", "steps:", "missingingredients:")):
            continue
        if reject_pattern and reject_pattern.search(value):
            continue
        if lowered in seen:
            continue
        seen.add(lowered)
        normalized.append(value)

    return normalized


def _compute_missing_ingredients(ingredients: list[str], available: list[str]) -> list[str]:
    available_set = {_normalize_ingredient_name(item) for item in available}
    return [
        ingredient
        for ingredient in ingredients
        if _normalize_ingredient_name(ingredient) not in available_set
    ]


def _clamp_recipe_count(value: int | None) -> int:
    if value is None:
        return 4
    return max(3, min(5, value))


def _build_prompt(request: RecipeGenerationRequest) -> str:
    desired_count = _clamp_recipe_count(request.desiredCount)
    instructions = [
        f"Generate {desired_count} practical home-cooking recipes.",
        "Use available ingredients as the main base.",
        "Only allow pantry staples if they are explicitly in the available ingredient list.",
        "Prefer realistic weeknight recipes, not restaurant-style dishes.",
        "Keep missing ingredients low and realistic.",
        "Return JSON only with no markdown or extra keys.",
    ]

    if request.maxCookingTime is not None:
        instructions.append(
            f"Target cooking time at or under {request.maxCookingTime} minutes."
        )

    if request.maxMissingIngredients is not None:
        instructions.append(
            f"Prefer recipes with at most {request.maxMissingIngredients} missing ingredients."
        )

    ingredients = "\n".join(f"- {item}" for item in request.availableIngredients)
    schema = """
{
  "recipes": [
    {
      "title": "string",
      "cookingTime": "number",
      "ingredients": ["string"],
      "steps": ["string"],
      "missingIngredients": ["string"]
    }
  ]
}
""".strip()

    return (
        " ".join(instructions)
        + "\n\nAvailable ingredients:\n"
        + ingredients
        + "\n\nRequired JSON shape:\n"
        + schema
    )


def _normalize_recipe(
    raw_recipe: Any, available_ingredients: list[str]
) -> Recipe | None:
    if not isinstance(raw_recipe, dict):
        return None

    title = _collapse_whitespace(str(raw_recipe.get("title", "")))
    ingredients = _normalize_string_list(raw_recipe.get("ingredients"), re.compile(r"[\[\]{}]"))
    steps = _normalize_string_list(
        raw_recipe.get("steps"),
        re.compile(r"^missingingredients\s*:", re.IGNORECASE),
    )

    cooking_time_raw = raw_recipe.get("cookingTime")
    if isinstance(cooking_time_raw, str):
        try:
            cooking_time_raw = float(cooking_time_raw)
        except ValueError:
            cooking_time_raw = 0

    cooking_time = (
        max(1, round(float(cooking_time_raw)))
        if isinstance(cooking_time_raw, (int, float))
        else 0
    )

    if not title or not ingredients or not steps or cooking_time <= 0:
        return None

    return Recipe(
        title=title,
        cookingTime=cooking_time,
        ingredients=ingredients,
        steps=steps,
        missingIngredients=_compute_missing_ingredients(ingredients, available_ingredients),
    )


def _normalize_recipes_payload(
    payload: dict[str, Any], available_ingredients: list[str]
) -> RecipeGenerationResponse:
    raw_recipes = payload.get("recipes")
    if not isinstance(raw_recipes, list):
        raise ServiceError("Recipe generation returned JSON in an unexpected format.")

    normalized: list[Recipe] = []
    seen_titles: set[str] = set()
    for raw_recipe in raw_recipes:
        recipe = _normalize_recipe(raw_recipe, available_ingredients)
        if recipe is None:
            continue
        key = recipe.title.lower()
        if key in seen_titles:
            continue
        seen_titles.add(key)
        normalized.append(recipe)

    normalized = normalized[:5]
    if len(normalized) < 3:
        raise ServiceError("Recipe generation did not return enough usable recipes. Please try again.")

    return RecipeGenerationResponse(recipes=normalized)


async def generate_recipes(
    request: RecipeGenerationRequest,
) -> RecipeGenerationResponse:
    settings = get_settings()
    payload = await request_openrouter_json(
        model=settings.openrouter_model_recipes,
        system_prompt="You generate realistic home recipes and must return strict JSON only.",
        user_prompt=_build_prompt(request),
        temperature=0.2,
    )

    return _normalize_recipes_payload(payload, request.availableIngredients)
