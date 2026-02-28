"use client";

import { useEffect, useState } from "react";
import AddItemForm from "@/components/shopping/AddItemForm";
import ShoppingList from "@/components/shopping/ShoppingList";
import RecipeList from "@/components/recipes/RecipeList";
import { useShoppingList } from "@/hooks/useShoppingList";
import { getRecipeSuggestions } from "@/lib/recipes/match";
import type { Recipe } from "@/types/recipe";

const RECIPE_STORAGE_KEY = "last-generated-recipes";
const RECIPE_AT_STORAGE_KEY = "last-generated-at";
const AVAILABLE_STORAGE_KEY = "last-used-available-ingredients";

export default function Home() {
  const {
    items,
    hydrated,
    addItem,
    addItems,
    toggleItem,
    removeItem,
    clearChecked,
    clearAll,
  } = useShoppingList();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null);
  const [recipesHydrated, setRecipesHydrated] = useState(false);

  const checkedCount = hydrated ? items.filter((i) => i.checked).length : 0;

  useEffect(() => {
    try {
      const storedRecipes = localStorage.getItem(RECIPE_STORAGE_KEY);
      const storedGeneratedAt = localStorage.getItem(RECIPE_AT_STORAGE_KEY);

      if (storedRecipes) {
        setRecipes(JSON.parse(storedRecipes));
      }
      if (storedGeneratedAt) {
        setLastGeneratedAt(storedGeneratedAt);
      }
    } catch {
      // ignore bad/corrupted storage
    } finally {
      setRecipesHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!recipesHydrated) return;
    localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify(recipes));
    if (lastGeneratedAt) {
      localStorage.setItem(RECIPE_AT_STORAGE_KEY, lastGeneratedAt);
    }
  }, [recipes, lastGeneratedAt, recipesHydrated]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function handleGenerate() {
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 500));

    const availableIngredients = items
      .filter((item) => item.checked)
      .map((item) => item.name);
    const generatedRecipes = getRecipeSuggestions(items, 5);
    const generatedAt = new Date().toISOString();

    setRecipes(generatedRecipes);
    setLastGeneratedAt(generatedAt);
    localStorage.setItem(
      AVAILABLE_STORAGE_KEY,
      JSON.stringify(availableIngredients)
    );

    setIsGenerating(false);
  }

  function handleAddMissing(missing: string[]) {
    const addedCount = addItems(missing);
    if (addedCount > 0) {
      setToast(`Added ${addedCount} item${addedCount > 1 ? "s" : ""} to your list`);
      return;
    }

    setToast("No new items to add");
  }

  return (
    <main className="min-h-screen pb-12">
      <div className="bg-[var(--brand-red)] text-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-3xl font-black tracking-tight">ZomigValu</p>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
            Shopping Planner
          </p>
        </div>
      </div>

      <div className="bg-[#23262d] text-white">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-sm font-semibold sm:px-6 lg:px-8">
          <span>Shopping List</span>
          <span>Available Items</span>
          <span>Recipe Suggestions</span>
        </div>
      </div>

      <div className="bg-[var(--brand-red)]/95 text-center text-sm font-semibold text-white">
        <p className="mx-auto w-full max-w-5xl px-4 py-2 sm:px-6 lg:px-8">
          Check what you already have, then generate recipes from those ingredients.
        </p>
      </div>

      <div className="mx-auto mt-6 flex w-full max-w-5xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <header className="rounded-2xl bg-[var(--brand-red)] px-6 py-8 text-white shadow-[0_14px_34px_rgba(141,12,37,0.3)] sm:px-10 sm:py-11">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/85">
            ZomigValu Kitchen
          </p>
          <h1 className="mt-3 text-4xl font-black leading-[1.04] sm:text-6xl">
            Shopping List to Recipes
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/90">
            Build your list, mark available items, and add missing ingredients from recipes in one click.
          </p>
          <p className="mt-6 inline-flex rounded-full bg-white/18 px-4 py-2 text-sm font-semibold">
            Available ingredients checked: {checkedCount}
          </p>
        </header>

        <section className="rounded-2xl border border-[#d4d9df] bg-white p-5 shadow-[0_8px_22px_rgba(16,24,40,0.08)] sm:p-7">
          <h2 className="text-2xl font-extrabold text-[var(--brand-red-strong)]">My Shopping List</h2>

          <AddItemForm onAdd={addItem} />
          {!hydrated ? (
            <p className="mt-4 text-[var(--ink-soft)]">Loading your list...</p>
          ) : (
            <ShoppingList
              items={items}
              onToggle={toggleItem}
              onRemove={removeItem}
              onQuickAdd={addItem}
            />
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleGenerate}
              disabled={!hydrated || checkedCount === 0 || isGenerating}
              className="rounded-lg bg-[var(--brand-green)] px-5 py-2.5 text-sm font-bold text-white shadow-[0_6px_16px_rgba(23,128,58,0.35)] transition hover:bg-[var(--brand-green-strong)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? "Generating..." : "Generate Recipes"}
            </button>

            <button
              onClick={clearChecked}
              disabled={checkedCount === 0}
              className="rounded-lg border border-[var(--brand-red)] px-4 py-2.5 text-sm font-semibold text-[var(--brand-red)] transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear checked
            </button>

            <button
              onClick={clearAll}
              disabled={items.length === 0}
              className="rounded-lg border border-[var(--border-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--ink-soft)] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear all
            </button>
          </div>

          {toast ? (
            <p
              className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"
              role="status"
              aria-live="polite"
            >
              {toast}
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-[#d4d9df] bg-white p-5 shadow-[0_8px_22px_rgba(16,24,40,0.08)] sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-extrabold text-[var(--brand-red-strong)]">Suggested Recipes</h2>
            {lastGeneratedAt ? (
              <p className="text-xs font-semibold text-[var(--ink-soft)]">
                Last generated: {new Date(lastGeneratedAt).toLocaleString()}
              </p>
            ) : null}
          </div>

          <RecipeList
            recipes={recipes}
            hasAvailableIngredients={checkedCount > 0}
            onAddMissing={handleAddMissing}
          />
        </section>
      </div>
    </main>
  );
}
