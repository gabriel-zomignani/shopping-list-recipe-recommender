import { buildApiUrl } from "@/lib/api/backend";
import { isRecipeArray } from "@/lib/storage/schemas";
import type { Recipe, RecipeGenerationRequest, RecipeGenerationResponse } from "@/types/recipe";

type ApiErrorPayload = {
  error?: string;
  detail?: string | Array<{ msg?: string }>;
};

function isApiErrorPayload(
  value: RecipeGenerationResponse | ApiErrorPayload
): value is ApiErrorPayload {
  return "error" in value || "detail" in value;
}

function isRecipeGenerationResponse(
  value: RecipeGenerationResponse | ApiErrorPayload
): value is RecipeGenerationResponse {
  return "recipes" in value && isRecipeArray(value.recipes);
}

export async function requestRecipeSuggestions(
  input: RecipeGenerationRequest
): Promise<Recipe[]> {
  let response: Response;
  try {
    response = await fetch(buildApiUrl("/recipes/generate"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error("Could not reach the backend recipe service. Check if FastAPI is running.");
  }

  const payload = (await response.json()) as RecipeGenerationResponse | ApiErrorPayload;

  if (!response.ok) {
    const message = isApiErrorPayload(payload)
      ? typeof payload.error === "string" && payload.error.trim()
        ? payload.error
        : typeof payload.detail === "string" && payload.detail.trim()
          ? payload.detail
          : Array.isArray(payload.detail) &&
              payload.detail[0] &&
              typeof payload.detail[0].msg === "string"
            ? payload.detail[0].msg || "Recipe generation failed."
            : "Recipe generation failed."
      : "Recipe generation failed.";
    throw new Error(message);
  }

  if (!isRecipeGenerationResponse(payload)) {
    throw new Error("Recipe generation returned an unexpected response.");
  }

  return payload.recipes;
}
