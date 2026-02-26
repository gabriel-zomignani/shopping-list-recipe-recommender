export type Recipe = {
  title: string;
  cookingTime: number; // in minutes
  ingredients: string[];
  steps: string[];
  missingIngredients: string[];
};