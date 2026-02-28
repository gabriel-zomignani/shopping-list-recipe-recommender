import type { RecipeHistorySession, RecipeSessionFilters, SortOption } from "@/types/history";
import type { Recipe } from "@/types/recipe";
import type { ShoppingItem, ShoppingItemSource } from "@/types/shopping";

const SORT_VALUES: SortOption[] = ["best-match", "least-missing", "fastest"];
const MAX_TIME_VALUES: RecipeSessionFilters["maxTime"][] = ["any", "15", "30", "45"];
const MAX_MISSING_VALUES: RecipeSessionFilters["maxMissing"][] = [
  "any",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
];
const SOURCE_VALUES: ShoppingItemSource[] = ["manual", "recipe", "receipt"];

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function isRecipe(value: unknown): value is Recipe {
  if (!value || typeof value !== "object") return false;
  const item = value as Recipe;
  return (
    typeof item.title === "string" &&
    typeof item.cookingTime === "number" &&
    isStringArray(item.ingredients) &&
    isStringArray(item.steps) &&
    isStringArray(item.missingIngredients)
  );
}

export function isRecipeArray(value: unknown): value is Recipe[] {
  return Array.isArray(value) && value.every(isRecipe);
}

export function isShoppingItem(value: unknown): value is ShoppingItem {
  if (!value || typeof value !== "object") return false;
  const item = value as ShoppingItem;

  const hasValidSource =
    item.source === undefined || SOURCE_VALUES.includes(item.source);
  const hasValidQuantity =
    item.quantity === undefined || typeof item.quantity === "number";
  const hasValidUnit = item.unit === undefined || typeof item.unit === "string";
  const hasValidNormalized =
    item.normalizedName === undefined || typeof item.normalizedName === "string";

  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.checked === "boolean" &&
    hasValidQuantity &&
    hasValidUnit &&
    hasValidSource &&
    hasValidNormalized
  );
}

export function isShoppingItemArray(value: unknown): value is ShoppingItem[] {
  return Array.isArray(value) && value.every(isShoppingItem);
}

export function isRecipeSessionFilters(value: unknown): value is RecipeSessionFilters {
  if (!value || typeof value !== "object") return false;
  const item = value as RecipeSessionFilters;
  return (
    SORT_VALUES.includes(item.sortBy) &&
    MAX_TIME_VALUES.includes(item.maxTime) &&
    MAX_MISSING_VALUES.includes(item.maxMissing) &&
    typeof item.assumeStaples === "boolean"
  );
}

export function isRecipeHistorySession(value: unknown): value is RecipeHistorySession {
  if (!value || typeof value !== "object") return false;
  const item = value as RecipeHistorySession;
  return (
    typeof item.id === "string" &&
    typeof item.timestamp === "string" &&
    isStringArray(item.availableIngredients) &&
    isRecipeSessionFilters(item.filters) &&
    isRecipeArray(item.recipes)
  );
}

export function isRecipeHistorySessionArray(
  value: unknown
): value is RecipeHistorySession[] {
  return Array.isArray(value) && value.every(isRecipeHistorySession);
}
