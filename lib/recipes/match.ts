import type { ShoppingItem } from "@/types/shopping";
import type { Recipe } from "@/types/recipe";
import { RECIPES } from "./dataset";

const norm = (s: string) => s.trim().toLowerCase();

export function getRecipeSuggestions(items: ShoppingItem[], limit = 5): Recipe[] {
  const available = new Set(
    items.filter((i) => i.checked).map((i) => norm(i.name))
  );

  const scored = RECIPES.map((r) => {
    const ingredients = r.ingredients.map(norm);
    const missing = ingredients.filter((ing) => !available.has(ing));
    const haveCount = ingredients.length - missing.length;
    const overlap = ingredients.length ? haveCount / ingredients.length : 0;

    const recipe: Recipe = { ...r, missingIngredients: missing };
    return { recipe, overlap, missingCount: missing.length };
  });

  scored.sort((a, b) => {
    if (b.overlap !== a.overlap) return b.overlap - a.overlap;
    if (a.missingCount !== b.missingCount) return a.missingCount - b.missingCount;
    return a.recipe.cookingTime - b.recipe.cookingTime;
  });

  return scored.slice(0, limit).map((x) => x.recipe);
}