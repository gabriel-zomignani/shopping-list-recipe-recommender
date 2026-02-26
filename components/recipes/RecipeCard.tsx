import type { Recipe } from "@/types/recipe";

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <div className="rounded-md border p-4">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-lg font-semibold">{recipe.title}</h3>
        <span className="text-sm text-gray-600">{recipe.cookingTime} min</span>
      </div>

      <p className="mt-3 text-sm font-medium">Ingredients</p>
      <ul className="mt-1 list-disc pl-5 text-sm text-gray-700">
        {recipe.ingredients.map((ing) => (
          <li key={ing}>{ing}</li>
        ))}
      </ul>

      <p className="mt-3 text-sm font-medium">Missing</p>
      {recipe.missingIngredients.length === 0 ? (
        <p className="mt-1 text-sm text-green-700">You have everything 🎉</p>
      ) : (
        <ul className="mt-1 list-disc pl-5 text-sm text-red-700">
          {recipe.missingIngredients.map((ing) => (
            <li key={ing}>{ing}</li>
          ))}
        </ul>
      )}
    </div>
  );
}