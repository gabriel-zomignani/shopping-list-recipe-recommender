import type { Recipe } from "@/types/recipe";

export type SortOption = "best-match" | "least-missing" | "fastest";

export type RecipeSessionFilters = {
  sortBy: SortOption;
  maxTime: "any" | "15" | "30" | "45";
  maxMissing: "any" | "0" | "1" | "2" | "3" | "4" | "5";
  assumeStaples: boolean;
};

export type RecipeHistorySession = {
  id: string;
  timestamp: string;
  availableIngredients: string[];
  filters: RecipeSessionFilters;
  recipes: Recipe[];
};
