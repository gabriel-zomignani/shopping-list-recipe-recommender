"use client";

import { useState } from "react";
import type { Recipe } from "@/types/recipe";

type Props = {
  recipe: Recipe;
  onAddMissing: (missing: string[]) => void;
};

export default function RecipeCard({ recipe, onAddMissing }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const overlapRatio =
    recipe.ingredients.length === 0
      ? 0
      : (recipe.ingredients.length - recipe.missingIngredients.length) /
        recipe.ingredients.length;
  const overlapPercent = Math.round(overlapRatio * 100);
  const ingredientPreview = isExpanded
    ? recipe.ingredients
    : recipe.ingredients.slice(0, 4);

  return (
    <article className="rounded-2xl border border-[var(--border-soft)] bg-white p-5 shadow-[0_8px_18px_rgba(16,24,40,0.07)]">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-extrabold text-[var(--ink)]">{recipe.title}</h3>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {recipe.cookingTime} min
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
          {overlapPercent}% match
        </span>
        <span className="rounded-full bg-red-50 px-3 py-1 text-[var(--brand-red)]">
          {recipe.missingIngredients.length} missing
        </span>
      </div>

      <p className="mt-4 text-sm font-bold text-[var(--ink)]">Ingredients</p>
      <ul className="mt-1 list-disc pl-5 text-sm text-[var(--ink-soft)]">
        {ingredientPreview.map((ing) => (
          <li key={ing}>{ing}</li>
        ))}
      </ul>
      {!isExpanded && recipe.ingredients.length > ingredientPreview.length ? (
        <p className="mt-1 text-xs font-medium text-slate-500">
          +{recipe.ingredients.length - ingredientPreview.length} more
        </p>
      ) : null}

      <p className="mt-4 text-sm font-bold text-[var(--ink)]">Missing ingredients</p>
      {recipe.missingIngredients.length === 0 ? (
        <p className="mt-1 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          You have everything.
        </p>
      ) : (
        <ul className="mt-1 list-disc rounded-lg bg-red-50 px-7 py-2 text-sm text-[var(--brand-red)]">
          {recipe.missingIngredients.map((ing) => (
            <li key={ing}>{ing}</li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => onAddMissing(recipe.missingIngredients)}
          disabled={recipe.missingIngredients.length === 0}
          className="rounded-xl bg-[var(--brand-green)] px-3.5 py-2 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(23,128,58,0.3)] transition hover:bg-[var(--brand-green-strong)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add missing to my list
        </button>
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          className="rounded-xl border border-[var(--border-soft)] px-3.5 py-2 text-sm font-semibold text-[var(--ink-soft)] transition hover:bg-slate-50"
        >
          {isExpanded ? "Collapse details" : "Expand details"}
        </button>
      </div>

      {isExpanded ? (
        <>
          <p className="mt-4 text-sm font-bold text-[var(--ink)]">Steps</p>
          <ol className="mt-1 list-decimal pl-5 text-sm text-[var(--ink-soft)]">
            {recipe.steps.map((step, index) => (
              <li key={`${recipe.title}-step-${index + 1}`}>{step}</li>
            ))}
          </ol>
        </>
      ) : null}
    </article>
  );
}
