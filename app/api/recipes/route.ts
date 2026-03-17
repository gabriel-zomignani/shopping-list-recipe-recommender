import { NextResponse } from "next/server";
import { generateRecipesWithOllama } from "@/lib/recipes/ollama";
import { isRecipeGenerationRequest } from "@/lib/recipes/schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Recipe generation request body must be valid JSON." },
      { status: 400 }
    );
  }

  if (!isRecipeGenerationRequest(body)) {
    return NextResponse.json(
      { error: "Recipe generation request is missing valid ingredients or preferences." },
      { status: 400 }
    );
  }

  if (body.availableIngredients.length === 0) {
    return NextResponse.json(
      { error: "Select at least one available ingredient before generating recipes." },
      { status: 400 }
    );
  }

  try {
    const result = await generateRecipesWithOllama(body);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Recipe generation failed unexpectedly.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
