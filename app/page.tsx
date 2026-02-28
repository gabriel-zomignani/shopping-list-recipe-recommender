"use client";

import { useState } from "react";
import AddItemForm from "@/components/shopping/AddItemForm";
import ShoppingList from "@/components/shopping/ShoppingList";
import RecipeList from "@/components/recipes/RecipeList";
import { useShoppingList } from "@/hooks/useShoppingList";
import { getRecipeSuggestions } from "@/lib/recipes/match";
import type { Recipe } from "@/types/recipe";

export default function Home() {
  const { items, hydrated, addItem, toggleItem, removeItem, clearChecked, clearAll } =
    useShoppingList();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const checkedCount = hydrated ? items.filter((i) => i.checked).length : 0;

  async function handleGenerate() {
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 500));
    setRecipes(getRecipeSuggestions(items, 5));
    setIsGenerating(false);
  }

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold">Shopping List -&gt; Recipe Recommender</h1>
      <p className="mt-2 text-sm text-gray-600">
        Tick items you already have at home. We&apos;ll generate recipes from checked
        items.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">My Shopping List</h2>

        <AddItemForm onAdd={addItem} />
        {!hydrated ? (
          <p className="mt-4 text-gray-600">Loading your list...</p>
        ) : (
          <ShoppingList items={items} onToggle={toggleItem} onRemove={removeItem} />
        )}

        <button
          onClick={handleGenerate}
          disabled={!hydrated || checkedCount === 0 || isGenerating}
          className="mt-6 rounded-md bg-black text-white px-4 py-2 disabled:opacity-50"
        >
          {isGenerating ? "Generating..." : "Generate Recipes"}
        </button>

        <div className="mt-3 flex gap-2">
          <button
            onClick={clearChecked}
            disabled={checkedCount === 0}
            className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
          >
            Clear checked
          </button>

          <button
            onClick={clearAll}
            disabled={items.length === 0}
            className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
          >
            Clear all
          </button>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold">Suggested Recipes</h2>

        {checkedCount === 0 ? (
          <p className="mt-4 text-gray-600">
            Tick at least one item you already have to generate recipes.
          </p>
        ) : (
          <RecipeList recipes={recipes} />
        )}
      </section>
    </main>
  );
}
