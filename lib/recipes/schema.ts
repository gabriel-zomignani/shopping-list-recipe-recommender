import type { Recipe, RecipeGenerationRequest, RecipeGenerationResponse } from "@/types/recipe";

export const RECIPE_GENERATION_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["recipes"],
  properties: {
    recipes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "cookingTime", "ingredients", "steps", "missingIngredients"],
        properties: {
          title: {
            type: "string",
          },
          cookingTime: {
            type: "number",
          },
          ingredients: {
            type: "array",
            items: {
              type: "string",
            },
          },
          steps: {
            type: "array",
            items: {
              type: "string",
            },
          },
          missingIngredients: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
      },
    },
  },
} as const;

type RawRecipe = {
  title: string;
  cookingTime: number;
  ingredients: string[];
  steps: string[];
  missingIngredients: string[];
};

type RawRecipeResponse = {
  recipes: RawRecipe[];
};

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeIngredientName(value: string) {
  return collapseWhitespace(value).toLowerCase();
}

function isLeakedFieldLabel(value: string) {
  const normalized = value.toLowerCase();
  const missingLabel = `missing${"ingredients"}:`;
  return (
    normalized.startsWith("title:") ||
    normalized.startsWith("ingredients:") ||
    normalized.startsWith("steps:") ||
    normalized.startsWith(missingLabel)
  );
}

function normalizeStringList(items: string[], rejectPattern?: RegExp) {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const item of items) {
    const value = collapseWhitespace(item).replace(/^[-*]\s*/, "");
    if (!value) continue;
    if (isLeakedFieldLabel(value)) continue;
    if (rejectPattern && rejectPattern.test(value)) continue;

    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(value);
  }

  return normalized;
}

function computeMissingIngredients(ingredients: string[], availableIngredients: string[]) {
  const available = new Set(availableIngredients.map(normalizeIngredientName));
  return ingredients.filter((ingredient) => !available.has(normalizeIngredientName(ingredient)));
}

function normalizeRecipe(recipe: RawRecipe, availableIngredients: string[]): Recipe | null {
  const title = collapseWhitespace(recipe.title);
  const ingredients = normalizeStringList(recipe.ingredients, /[\[\]{}]/);
  const steps = normalizeStringList(
    recipe.steps,
    new RegExp(`^missing${"ingredients"}\\s*:`, "i")
  );
  const cookingTime = Number.isFinite(recipe.cookingTime)
    ? Math.max(1, Math.round(recipe.cookingTime))
    : 0;

  if (!title || ingredients.length === 0 || steps.length === 0 || cookingTime <= 0) {
    return null;
  }

  return {
    title,
    cookingTime,
    ingredients,
    steps,
    missingIngredients: computeMissingIngredients(ingredients, availableIngredients),
  };
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isRawRecipe(value: unknown): value is RawRecipe {
  if (!value || typeof value !== "object") return false;
  const recipe = value as RawRecipe;

  return (
    typeof recipe.title === "string" &&
    typeof recipe.cookingTime === "number" &&
    isStringArray(recipe.ingredients) &&
    isStringArray(recipe.steps) &&
    isStringArray(recipe.missingIngredients)
  );
}

function isRawRecipeResponse(value: unknown): value is RawRecipeResponse {
  if (!value || typeof value !== "object") return false;
  const payload = value as RawRecipeResponse;
  return Array.isArray(payload.recipes) && payload.recipes.every(isRawRecipe);
}

function isNullableInteger(value: unknown) {
  return value === null || (typeof value === "number" && Number.isInteger(value) && value > 0);
}

export function isRecipeGenerationRequest(value: unknown): value is RecipeGenerationRequest {
  if (!value || typeof value !== "object") return false;
  const request = value as RecipeGenerationRequest;

  return (
    isStringArray(request.availableIngredients) &&
    request.availableIngredients.every((item) => collapseWhitespace(item).length > 0) &&
    isNullableInteger(request.maxCookingTime) &&
    isNullableInteger(request.maxMissingIngredients) &&
    isNullableInteger(request.desiredCount)
  );
}

export function parseRecipeGenerationResponse(
  value: unknown,
  availableIngredients: string[]
): RecipeGenerationResponse {
  if (!isRawRecipeResponse(value)) {
    throw new Error("Recipe generation returned JSON in an unexpected format.");
  }

  const recipes = value.recipes
    .map((recipe) => normalizeRecipe(recipe, availableIngredients))
    .filter((recipe): recipe is Recipe => recipe !== null)
    .slice(0, 5);

  if (recipes.length < 3) {
    throw new Error("Recipe generation did not return enough usable recipes. Please try again.");
  }

  return { recipes };
}
