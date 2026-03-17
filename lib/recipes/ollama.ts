import "server-only";

import { getOllamaRecipeModel, runOllamaChat } from "@/lib/ollama/client";
import {
  parseRecipeGenerationResponse,
  RECIPE_GENERATION_JSON_SCHEMA,
} from "@/lib/recipes/schema";
import type { RecipeGenerationRequest, RecipeGenerationResponse } from "@/types/recipe";

function joinIngredients(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

function buildRecipePrompt({
  availableIngredients,
  maxCookingTime,
  maxMissingIngredients,
  desiredCount,
}: RecipeGenerationRequest) {
  const count = desiredCount ?? 5;
  const instructions = [
    `Generate ${count} practical home-cooking recipe ideas from the provided available ingredients.`,
    "Use the provided ingredients as the main base.",
    "Common pantry staples are allowed only if they are already included in the available ingredient list.",
    "Keep recipes realistic, concise, and suitable for weeknight cooking.",
    "Return ingredient names as concise shopping-style ingredient names, not sentences and not markdown bullets.",
    "Keep missing ingredients limited and realistic.",
    "Return JSON only and no commentary.",
  ];

  if (maxCookingTime !== null) {
    instructions.push(`Try to keep each recipe at or under ${maxCookingTime} minutes.`);
  }

  if (maxMissingIngredients !== null) {
    instructions.push(`Prefer recipes with at most ${maxMissingIngredients} missing ingredients.`);
  }

  return [
    instructions.join(" "),
    "Available ingredients:",
    joinIngredients(availableIngredients),
    `Return data matching this JSON schema exactly: ${JSON.stringify(RECIPE_GENERATION_JSON_SCHEMA)}`,
  ].join("\n\n");
}

function parseRecipeContent(content: string, availableIngredients: string[]) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Ollama returned invalid JSON for recipe generation.");
  }

  return parseRecipeGenerationResponse(parsed, availableIngredients);
}

export async function generateRecipesWithOllama(
  input: RecipeGenerationRequest
): Promise<RecipeGenerationResponse> {
  const model = getOllamaRecipeModel();
  const content = await runOllamaChat({
    model,
    format: RECIPE_GENERATION_JSON_SCHEMA,
    temperature: 0.2,
    messages: [
      {
        role: "user",
        content: buildRecipePrompt(input),
      },
    ],
  });

  return parseRecipeContent(content, input.availableIngredients);
}
