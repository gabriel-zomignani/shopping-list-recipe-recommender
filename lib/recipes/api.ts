import { isRecipeArray } from "@/lib/storage/schemas";
import type { Recipe, RecipeGenerationRequest, RecipeGenerationResponse } from "@/types/recipe";

type ApiErrorPayload = {
  error?: string;
};

function isApiErrorPayload(
  value: RecipeGenerationResponse | ApiErrorPayload
): value is ApiErrorPayload {
  return "error" in value;
}

function isRecipeGenerationResponse(
  value: RecipeGenerationResponse | ApiErrorPayload
): value is RecipeGenerationResponse {
  return "recipes" in value && isRecipeArray(value.recipes);
}

export async function requestRecipeSuggestions(
  input: RecipeGenerationRequest
): Promise<Recipe[]> {
  const response = await fetch("/api/recipes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const payload = (await response.json()) as RecipeGenerationResponse | ApiErrorPayload;

  if (!response.ok) {
    const message = isApiErrorPayload(payload)
      ? payload.error || "Recipe generation failed."
      : "Recipe generation failed.";
    throw new Error(message);
  }

  if (!isRecipeGenerationResponse(payload)) {
    throw new Error("Recipe generation returned an unexpected response.");
  }

  return payload.recipes;
}
