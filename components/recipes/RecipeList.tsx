import type { Recipe } from "@/types/recipe";
import RecipeCard from "./RecipeCard";

type Props = {
  recipes: Recipe[];
  hasAvailableIngredients: boolean;
  onAddMissing: (missing: string[]) => void;
};

export default function RecipeList({
  recipes,
  hasAvailableIngredients,
  onAddMissing,
}: Props) {
  if (recipes.length === 0) {
    if (!hasAvailableIngredients) {
      return (
        <p className="mt-4 rounded-xl border border-[var(--border-soft)] bg-slate-50 px-4 py-3 text-sm text-[var(--ink-soft)]">
          Mark items as available in your shopping list first, then click Generate Recipes.
        </p>
      );
    }

    return (
      <p className="mt-4 rounded-xl border border-[var(--border-soft)] bg-slate-50 px-4 py-3 text-sm text-[var(--ink-soft)]">
        No recipes yet. Try checking a few more pantry basics.
      </p>
    );
  }

  const hasAnyOverlap = recipes.some(
    (recipe) => recipe.missingIngredients.length < recipe.ingredients.length
  );

  return (
    <div className="mt-5 grid gap-4">
      {!hasAnyOverlap ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">
          No close matches yet. Add more basics like oil, onion, garlic, rice, or pasta.
        </p>
      ) : null}

      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.title}
          recipe={recipe}
          onAddMissing={onAddMissing}
        />
      ))}
    </div>
  );
}
