export type UserPreferences = {
  maxCookingTime?: number;
  dietaryRestrictions?: string[];
  difficulty?: "easy" | "medium" | "hard";
  equipment?: string[];
};