import "server-only";

import { parseJsonObjectFromText } from "@/lib/ai/json";
import { getOpenRouterRecipesModel, runOpenRouterChat } from "@/lib/ai/openrouter";
import {
  parseRecipeGenerationResponse,
  RECIPE_GENERATION_JSON_SCHEMA,
} from "@/lib/recipes/schema";
import type { RecipeGenerationRequest, RecipeGenerationResponse } from "@/types/recipe";

function joinIngredients(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

function clampRecipeCount(value: number | null) {
  if (!value || !Number.isFinite(value)) return 4;
  return Math.min(5, Math.max(3, Math.round(value)));
}

function buildRecipePrompt({
  availableIngredients,
  maxCookingTime,
  maxMissingIngredients,
  desiredCount,
}: RecipeGenerationRequest) {
  const count = clampRecipeCount(desiredCount);
  const instructions = [
    `Generate ${count} practical home-cooking recipes.`,
    "Use available ingredients as the main base.",
    "Only assume pantry staples if they are explicitly in the available ingredient list.",
    "Prefer realistic weeknight recipes, not restaurant-style dishes.",
    "Keep missing ingredients low and concise.",
    "Return JSON only with no markdown.",
  ];

  if (maxCookingTime !== null) {
    instructions.push(`Target cooking time at or under ${maxCookingTime} minutes.`);
  }

  if (maxMissingIngredients !== null) {
    instructions.push(`Prefer recipes with at most ${maxMissingIngredients} missing ingredients.`);
  }

  return [
    instructions.join(" "),
    "Available ingredients:",
    joinIngredients(availableIngredients),
    `Return data that matches this schema exactly: ${JSON.stringify(RECIPE_GENERATION_JSON_SCHEMA)}`,
  ].join("\n\n");
}

function parseRecipeContent(content: string, availableIngredients: string[]) {
  const parsed = parseJsonObjectFromText(content, "OpenRouter");
  return parseRecipeGenerationResponse(parsed, availableIngredients);
}

export async function generateRecipesWithOpenRouter(
  input: RecipeGenerationRequest
): Promise<RecipeGenerationResponse> {
  const content = await runOpenRouterChat({
    model: getOpenRouterRecipesModel(),
    temperature: 0.2,
    responseFormat: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You generate realistic home recipes and must return strict JSON only.",
      },
      {
        role: "user",
        content: buildRecipePrompt(input),
      },
    ],
  });

  return parseRecipeContent(content, input.availableIngredients);
}
