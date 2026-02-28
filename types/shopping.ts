export type ShoppingItemSource = "manual" | "recipe" | "receipt";

export type ShoppingItem = {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  source?: ShoppingItemSource;
  normalizedName?: string;
  checked: boolean;
};
