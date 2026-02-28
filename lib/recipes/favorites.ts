import type { Recipe } from "@/types/recipe";
import { isRecipeArray } from "@/lib/storage/schemas";
import { readVersionedStorage, writeVersionedStorage } from "@/lib/storage/versioned";

export const FAVORITES_STORAGE_KEY = "favorite-recipes";

function normalizeTitle(title: string) {
  return title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function getRecipeId(recipe: Recipe) {
  return `${normalizeTitle(recipe.title)}-${recipe.cookingTime}`;
}

export function readFavoriteRecipes(): Recipe[] {
  return readVersionedStorage(FAVORITES_STORAGE_KEY, isRecipeArray, []);
}

export function writeFavoriteRecipes(recipes: Recipe[]) {
  writeVersionedStorage(FAVORITES_STORAGE_KEY, recipes);
}

export function toggleFavoriteRecipe(recipe: Recipe): Recipe[] {
  const current = readFavoriteRecipes();
  const id = getRecipeId(recipe);
  const exists = current.some((item) => getRecipeId(item) === id);
  const next = exists
    ? current.filter((item) => getRecipeId(item) !== id)
    : [recipe, ...current];
  writeFavoriteRecipes(next);
  return next;
}
