import { getRecipeSuggestions } from "@/lib/recipes/match";
import type { RecipeSessionFilters } from "@/types/history";
import type { Recipe } from "@/types/recipe";
import type { ShoppingItem } from "@/types/shopping";

const STAPLES = ["salt", "pepper", "oil", "butter", "flour", "sugar", "garlic", "onion"];

function normalize(text: string) {
  return text.trim().toLowerCase();
}

export function applyStaples(items: ShoppingItem[]) {
  const stapleSet = new Set(STAPLES.map(normalize));
  const normalized = new Set(items.map((item) => normalize(item.name)));

  const forcedChecked = items.map((item) =>
    stapleSet.has(normalize(item.name)) ? { ...item, checked: true } : item
  );

  const missingStaples = STAPLES.filter((name) => !normalized.has(name)).map((name) => ({
    id: `staple-${name}`,
    name,
    checked: true,
    source: "recipe" as const,
    normalizedName: name,
  }));

  return [...forcedChecked, ...missingStaples];
}

function getMatchRatio(recipe: Recipe) {
  if (recipe.ingredients.length === 0) return 0;
  return (recipe.ingredients.length - recipe.missingIngredients.length) / recipe.ingredients.length;
}

export function applyRecipeFiltersAndSort(recipes: Recipe[], filters: RecipeSessionFilters) {
  const filtered = recipes.filter((recipe) => {
    const passesTime = filters.maxTime === "any" || recipe.cookingTime <= Number(filters.maxTime);
    const passesMissing =
      filters.maxMissing === "any" ||
      recipe.missingIngredients.length <= Number(filters.maxMissing);
    return passesTime && passesMissing;
  });

  filtered.sort((a, b) => {
    if (filters.sortBy === "least-missing") {
      if (a.missingIngredients.length !== b.missingIngredients.length) {
        return a.missingIngredients.length - b.missingIngredients.length;
      }
      return a.cookingTime - b.cookingTime;
    }

    if (filters.sortBy === "fastest") {
      if (a.cookingTime !== b.cookingTime) return a.cookingTime - b.cookingTime;
      return a.missingIngredients.length - b.missingIngredients.length;
    }

    const matchDiff = getMatchRatio(b) - getMatchRatio(a);
    if (matchDiff !== 0) return matchDiff;
    if (a.missingIngredients.length !== b.missingIngredients.length) {
      return a.missingIngredients.length - b.missingIngredients.length;
    }
    return a.cookingTime - b.cookingTime;
  });

  return filtered;
}

export function generateRecipesForSession(items: ShoppingItem[], filters: RecipeSessionFilters) {
  const sourceItems = filters.assumeStaples ? applyStaples(items) : items;
  const baseRecipes = getRecipeSuggestions(sourceItems, 50);
  const recipes = applyRecipeFiltersAndSort(baseRecipes, filters);
  const availableIngredients = sourceItems
    .filter((item) => item.checked)
    .map((item) => item.name);

  return { recipes, availableIngredients };
}
