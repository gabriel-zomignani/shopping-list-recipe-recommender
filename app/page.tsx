"use client";

import { useMemo, useState } from "react";
import AddItemForm from "@/components/shopping/AddItemForm";
import ShoppingList from "@/components/shopping/ShoppingList";
import RecipeList from "@/components/recipes/RecipeList";
import { useShoppingList } from "@/hooks/useShoppingList";
import { getRecipeSuggestions } from "@/lib/recipes/match";
import type { Recipe } from "@/types/recipe";

export default function Home() {
  const { items, addItem, toggleItem, removeItem } = useShoppingList();
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  const canGenerate = items.length > 0;

  function handleGenerate() {
    const suggestions = getRecipeSuggestions(items, 5);
    setRecipes(suggestions);
  }

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold">Shopping List → Recipe Recommender</h1>
      <p className="mt-2 text-gray-600">
        Build a shopping list and generate recipe ideas from what you have.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">My Shopping List</h2>
        <AddItemForm onAdd={addItem} />
        <ShoppingList items={items} onToggle={toggleItem} onRemove={removeItem} />

        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="mt-6 rounded-md bg-black text-white px-4 py-2 disabled:opacity-50"
        >
          Generate Recipes
        </button>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold">Suggested Recipes</h2>
        <RecipeList recipes={recipes} />
      </section>
    </main>
  );
}