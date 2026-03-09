"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import RecipeCard from "@/components/recipes/RecipeCard";
import { useShoppingList } from "@/hooks/useShoppingList";
import {
  getRecipeId,
  readFavoriteRecipes,
  toggleFavoriteRecipe,
} from "@/lib/recipes/favorites";
import type { Recipe } from "@/types/recipe";

export default function FavoritesClient() {
  const { addItems } = useShoppingList();
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const favoriteIds = useMemo(
    () => new Set(favorites.map(getRecipeId)),
    [favorites]
  );

  useEffect(() => {
    setFavorites(readFavoriteRecipes());
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleToggleFavorite = useCallback((recipe: Recipe) => {
    const next = toggleFavoriteRecipe(recipe);
    setFavorites(next);
    const stillFavorite = next.some((item) => getRecipeId(item) === getRecipeId(recipe));
    setToast(stillFavorite ? "Saved to favorites" : "Removed from favorites");
  }, []);

  const handleAddMissing = useCallback(
    (missing: string[]) => {
      const addedCount = addItems(missing);
      if (addedCount > 0) {
        setToast(`Added ${addedCount} item${addedCount > 1 ? "s" : ""} to your list`);
        return;
      }
      setToast("No new items to add");
    },
    [addItems]
  );

  return (
    <main className="min-h-screen pb-12">
      <div className="bg-[var(--brand-red)] text-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-3xl font-black tracking-tight">ZomigValu</p>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-semibold underline-offset-2 hover:underline">
              Back to planner
            </Link>
            <Link href="/logout" className="text-sm font-semibold underline-offset-2 hover:underline">
              Log out
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 flex w-full max-w-5xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-[#d4d9df] bg-white p-5 shadow-sm sm:p-7">
          <h1 className="text-2xl font-extrabold text-[var(--brand-red-strong)]">
            Favorite Recipes
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Saved recipes: {favorites.length}
          </p>

          {favorites.length === 0 ? (
            <p className="mt-4 rounded-xl border border-[var(--border-soft)] bg-slate-50 px-4 py-3 text-sm text-[var(--ink-soft)]">
              No favorites yet. Add favorites from the recipe suggestions page.
            </p>
          ) : (
            <div className="mt-5 grid gap-4">
              {favorites.map((recipe) => (
                <RecipeCard
                  key={getRecipeId(recipe)}
                  recipe={recipe}
                  onAddMissing={handleAddMissing}
                  isFavorite={favoriteIds.has(getRecipeId(recipe))}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {toast ? (
        <p
          className="fixed right-4 top-4 z-40 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 shadow-sm"
          role="status"
          aria-live="polite"
        >
          {toast}
        </p>
      ) : null}
    </main>
  );
}
