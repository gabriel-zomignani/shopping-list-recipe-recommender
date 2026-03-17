export type Recipe = {
  title: string;
  cookingTime: number; // in minutes
  ingredients: string[];
  steps: string[];
  missingIngredients: string[];
};

export type RecipeGenerationRequest = {
  availableIngredients: string[];
  maxCookingTime: number | null;
  maxMissingIngredients: number | null;
  desiredCount: number | null;
};

export type RecipeGenerationResponse = {
  recipes: Recipe[];
};
