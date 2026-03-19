import { NextResponse } from "next/server";
import { generateRecipesWithOpenRouter } from "@/lib/recipes/openrouter";
import { isRecipeGenerationRequest } from "@/lib/recipes/schema";

export const runtime = "nodejs";

function toPublicRecipeError(message: string) {
  if (message.includes("OPENROUTER_API_KEY")) {
    return "Recipe AI service is not configured on this server.";
  }

  return message;
}

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
    const result = await generateRecipesWithOpenRouter(body);
    return NextResponse.json(result);
  } catch (error) {
    const rawMessage =
      error instanceof Error ? error.message : "Recipe generation failed unexpectedly.";
    const message = toPublicRecipeError(rawMessage);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
