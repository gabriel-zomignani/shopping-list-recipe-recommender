"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReceiptReviewModal from "@/components/receipt/ReceiptReviewModal";
import RecipeList from "@/components/recipes/RecipeList";
import AddItemForm from "@/components/shopping/AddItemForm";
import ShoppingList from "@/components/shopping/ShoppingList";
import { useShoppingList } from "@/hooks/useShoppingList";
import {
  getRecipeId,
  readFavoriteRecipes,
  toggleFavoriteRecipe,
} from "@/lib/recipes/favorites";
import {
  getHistorySession,
  saveHistorySession,
} from "@/lib/recipes/history";
import { applyRecipeFiltersAndSort, applyStaples } from "@/lib/recipes/session";
import { getRecipeSuggestions } from "@/lib/recipes/match";
import { isRecipeArray } from "@/lib/storage/schemas";
import { readVersionedStorage, writeVersionedStorage } from "@/lib/storage/versioned";
import type { ReceiptImportItem } from "@/types/receipt";
import type { RecipeHistorySession, RecipeSessionFilters, SortOption } from "@/types/history";
import type { Recipe } from "@/types/recipe";

const LAST_GENERATED_KEY = "last-generated-state";

type LastGeneratedState = {
  recipes: Recipe[];
  generatedAt: string | null;
};

function isLastGeneratedState(value: unknown): value is LastGeneratedState {
  if (!value || typeof value !== "object") return false;
  const parsed = value as LastGeneratedState;
  return isRecipeArray(parsed.recipes) && (parsed.generatedAt === null || typeof parsed.generatedAt === "string");
}

function newSessionId() {
  return `${Date.now()}-${crypto.randomUUID()}`;
}

function checkedCountFromItems(items: { checked: boolean }[]) {
  return items.filter((item) => item.checked).length;
}

export default function Home() {
  const {
    items,
    hydrated,
    addItem,
    addItems,
    addDetailedItems,
    toggleItem,
    removeItem,
    clearChecked,
    clearAll,
  } = useShoppingList();

  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null);
  const [recipesHydrated, setRecipesHydrated] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("best-match");
  const [maxTime, setMaxTime] = useState<RecipeSessionFilters["maxTime"]>("any");
  const [maxMissing, setMaxMissing] = useState<RecipeSessionFilters["maxMissing"]>("any");
  const [assumeStaples, setAssumeStaples] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [loadedSessionId, setLoadedSessionId] = useState<string | null>(null);

  const filters = useMemo(
    () => ({ sortBy, maxTime, maxMissing, assumeStaples }),
    [sortBy, maxTime, maxMissing, assumeStaples]
  );

  const checkedCount = useMemo(
    () => (hydrated ? checkedCountFromItems(items) : 0),
    [items, hydrated]
  );

  const filteredSortedRecipes = useMemo(
    () => applyRecipeFiltersAndSort(generatedRecipes, filters),
    [generatedRecipes, filters]
  );

  useEffect(() => {
    try {
      const stored = readVersionedStorage<LastGeneratedState>(
        LAST_GENERATED_KEY,
        isLastGeneratedState,
        { recipes: [], generatedAt: null }
      );
      setGeneratedRecipes(stored.recipes);
      setLastGeneratedAt(stored.generatedAt);
    } finally {
      setRecipesHydrated(true);
    }
  }, []);

  useEffect(() => {
    const favorites = readFavoriteRecipes();
    setFavoriteIds(new Set(favorites.map(getRecipeId)));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session");
    if (!sessionId) return;
    if (loadedSessionId === sessionId) return;

    const session = getHistorySession(sessionId);
    if (!session) return;

    setSortBy(session.filters.sortBy);
    setMaxTime(session.filters.maxTime);
    setMaxMissing(session.filters.maxMissing);
    setAssumeStaples(session.filters.assumeStaples);
    setGeneratedRecipes(session.recipes);
    setLastGeneratedAt(session.timestamp);
    setLoadedSessionId(sessionId);
    setToast("Loaded history session");
  }, [loadedSessionId]);

  useEffect(() => {
    if (!recipesHydrated) return;
    writeVersionedStorage(LAST_GENERATED_KEY, {
      recipes: generatedRecipes,
      generatedAt: lastGeneratedAt,
    });
  }, [generatedRecipes, lastGeneratedAt, recipesHydrated]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const buildAvailableSnapshot = useCallback(() => {
    const sourceItems = assumeStaples ? applyStaples(items) : items;
    return sourceItems.filter((item) => item.checked).map((item) => item.name);
  }, [assumeStaples, items]);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 500));

    const sourceItems = assumeStaples ? applyStaples(items) : items;
    const nextRecipes = getRecipeSuggestions(sourceItems, 50);
    const generatedAt = new Date().toISOString();
    const sessionRecipes = applyRecipeFiltersAndSort(nextRecipes, filters);
    const session: RecipeHistorySession = {
      id: newSessionId(),
      timestamp: generatedAt,
      availableIngredients: sourceItems
        .filter((item) => item.checked)
        .map((item) => item.name),
      filters,
      recipes: sessionRecipes,
    };

    setGeneratedRecipes(nextRecipes);
    setLastGeneratedAt(generatedAt);
    saveHistorySession(session);
    setIsGenerating(false);
  }, [assumeStaples, filters, items]);

  const handleSaveSession = useCallback(() => {
    if (filteredSortedRecipes.length === 0) {
      setToast("Generate recipes before saving a session");
      return;
    }

    const session: RecipeHistorySession = {
      id: newSessionId(),
      timestamp: new Date().toISOString(),
      availableIngredients: buildAvailableSnapshot(),
      filters,
      recipes: filteredSortedRecipes,
    };

    saveHistorySession(session);
    setToast("Session saved to history");
  }, [buildAvailableSnapshot, filteredSortedRecipes, filters]);

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

  const handleToggleFavorite = useCallback((recipe: Recipe) => {
    const nextFavorites = toggleFavoriteRecipe(recipe);
    const nextIds = new Set(nextFavorites.map(getRecipeId));
    const isNowFavorite = nextIds.has(getRecipeId(recipe));

    setFavoriteIds(nextIds);
    setToast(isNowFavorite ? "Saved to favorites" : "Removed from favorites");
  }, []);

  const handleAddReceiptItems = useCallback(
    (extractedItems: ReceiptImportItem[]) => {
      const addedCount = addDetailedItems(extractedItems);
      if (addedCount > 0) {
        setToast(`Imported ${addedCount} receipt item${addedCount > 1 ? "s" : ""}`);
        return;
      }
      setToast("No new receipt items to import");
    },
    [addDetailedItems]
  );

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
          <Link href="/favorites" className="underline-offset-2 hover:underline">
            Favorites
          </Link>
          <Link href="/history" className="underline-offset-2 hover:underline">
            History
          </Link>
        </div>
      </div>

      <div className="bg-[var(--brand-red)]/95 text-center text-sm font-semibold text-white">
        <p className="mx-auto w-full max-w-5xl px-4 py-2 sm:px-6 lg:px-8">
          Check what you already have, then generate recipes from those ingredients.
        </p>
      </div>

      <div className="mx-auto mt-6 flex w-full max-w-5xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <header className="rounded-2xl bg-[var(--brand-red)] px-6 py-8 text-white shadow-md sm:px-10 sm:py-11">
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

        <section className="rounded-2xl border border-[#d4d9df] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-extrabold text-[var(--brand-red-strong)]">My Shopping List</h2>
            <button
              type="button"
              onClick={() => setIsReceiptOpen(true)}
              className="rounded-lg border border-[var(--border-soft)] px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] transition hover:bg-slate-50"
            >
              Import receipt
            </button>
          </div>

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
              disabled={!hydrated || (!assumeStaples && checkedCount === 0) || isGenerating}
              className="rounded-lg bg-[var(--brand-green)] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--brand-green-strong)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? "Generating..." : "Generate Recipes"}
            </button>

            <button
              onClick={handleSaveSession}
              disabled={filteredSortedRecipes.length === 0}
              className="rounded-lg border border-[var(--border-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--ink-soft)] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save session
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
        </section>

        <section className="rounded-2xl border border-[#d4d9df] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-extrabold text-[var(--brand-red-strong)]">Suggested Recipes</h2>
            {lastGeneratedAt ? (
              <p className="text-xs font-semibold text-[var(--ink-soft)]">
                Last generated: {new Date(lastGeneratedAt).toLocaleString()}
              </p>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 rounded-xl border border-[var(--border-soft)] bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="text-xs font-semibold text-[var(--ink-soft)]">
              Sort
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                className="mt-1 w-full rounded-md border border-[var(--border-soft)] bg-white px-2 py-1.5 text-sm text-[var(--ink)]"
              >
                <option value="best-match">Best match</option>
                <option value="least-missing">Least missing</option>
                <option value="fastest">Fastest</option>
              </select>
            </label>

            <label className="text-xs font-semibold text-[var(--ink-soft)]">
              Max time
              <select
                value={maxTime}
                onChange={(event) => setMaxTime(event.target.value as RecipeSessionFilters["maxTime"])}
                className="mt-1 w-full rounded-md border border-[var(--border-soft)] bg-white px-2 py-1.5 text-sm text-[var(--ink)]"
              >
                <option value="any">Any</option>
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
              </select>
            </label>

            <label className="text-xs font-semibold text-[var(--ink-soft)]">
              Max missing
              <select
                value={maxMissing}
                onChange={(event) =>
                  setMaxMissing(event.target.value as RecipeSessionFilters["maxMissing"])
                }
                className="mt-1 w-full rounded-md border border-[var(--border-soft)] bg-white px-2 py-1.5 text-sm text-[var(--ink)]"
              >
                <option value="any">Any</option>
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </label>

            <label className="flex items-center gap-2 pt-5 text-sm font-semibold text-[var(--ink-soft)] lg:col-span-2">
              <input
                type="checkbox"
                checked={assumeStaples}
                onChange={(event) => setAssumeStaples(event.target.checked)}
                className="h-4 w-4 accent-[var(--brand-green)]"
              />
              Assume pantry staples are available
            </label>
          </div>

          <RecipeList
            recipes={filteredSortedRecipes}
            hasAvailableIngredients={checkedCount > 0 || assumeStaples}
            onAddMissing={handleAddMissing}
            favoriteIds={favoriteIds}
            getRecipeId={getRecipeId}
            onToggleFavorite={handleToggleFavorite}
          />
        </section>
      </div>

      <ReceiptReviewModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        onAdd={handleAddReceiptItems}
      />

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
