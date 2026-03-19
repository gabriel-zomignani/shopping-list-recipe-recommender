from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _collapse_whitespace(value: str) -> str:
    return " ".join(value.split()).strip()


class RecipeGenerationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    availableIngredients: list[str]
    maxCookingTime: int | None = None
    maxMissingIngredients: int | None = None
    desiredCount: int | None = None

    @field_validator("availableIngredients")
    @classmethod
    def validate_available_ingredients(cls, value: list[str]) -> list[str]:
        normalized = [_collapse_whitespace(item) for item in value if _collapse_whitespace(item)]
        if not normalized:
            raise ValueError(
                "Select at least one available ingredient before generating recipes."
            )
        return normalized

    @field_validator("maxCookingTime", "maxMissingIngredients", "desiredCount")
    @classmethod
    def validate_positive_nullable_int(cls, value: int | None) -> int | None:
        if value is None:
            return None
        if value <= 0:
            raise ValueError("Numeric recipe options must be greater than zero.")
        return value


class Recipe(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str
    cookingTime: int
    ingredients: list[str]
    steps: list[str]
    missingIngredients: list[str]


class RecipeGenerationResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    recipes: list[Recipe] = Field(default_factory=list)
