import type { Recipe } from "@/types/recipe";
import { RECIPES } from "./dataset";

function normalize(s: string) {
  return s.trim().toLowerCase();
}

export function getRecipeSuggestions(
  shoppingItems: { name: string; checked: boolean }[],
  limit = 5
): Recipe[] {
  const available = new Set(
    shoppingItems
      .filter((i) => !i.checked) // optional: treat "checked" as already have vs still need
      .map((i) => normalize(i.name))
  );

  const scored = RECIPES.map((r) => {
    const ingredients = r.ingredients.map(normalize);
    const missing = ingredients.filter((ing) => !available.has(ing));
    const haveCount = ingredients.length - missing.length;

    const score = ingredients.length === 0 ? 0 : haveCount / ingredients.length;

    return {
      recipe: {
        ...r,
        missingIngredients: missing,
      } satisfies Recipe,
      score,
      missingCount: missing.length,
    };
  });

  scored.sort((a, b) => {
    // higher overlap first
    if (b.score !== a.score) return b.score - a.score;
    // fewer missing next
    if (a.missingCount !== b.missingCount) return a.missingCount - b.missingCount;
    // faster cooking next
    return a.recipe.cookingTime - b.recipe.cookingTime;
  });

  return scored.slice(0, limit).map((s) => s.recipe);
}