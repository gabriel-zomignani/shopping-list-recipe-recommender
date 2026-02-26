import type { Recipe } from "@/types/recipe";
import RecipeCard from "./RecipeCard";

export default function RecipeList({ recipes }: { recipes: Recipe[] }) {
  if (recipes.length === 0) {
    return <p className="mt-4 text-gray-600">No recipes yet.</p>;
  }

  return (
    <div className="mt-4 grid gap-3">
      {recipes.map((r) => (
        <RecipeCard key={r.title} recipe={r} />
      ))}
    </div>
  );
}