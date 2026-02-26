import type { Recipe } from "@/types/recipe";

export const RECIPES: Omit<Recipe, "missingIngredients">[] = [
  {
    title: "Scrambled Eggs Toast",
    cookingTime: 10,
    ingredients: ["eggs", "bread", "butter", "salt", "pepper"],
    steps: [
      "Crack eggs into a bowl and whisk with salt and pepper.",
      "Melt butter in a pan and scramble eggs until set.",
      "Toast bread and serve eggs on top.",
    ],
  },
  {
    title: "Pasta with Tomato Sauce",
    cookingTime: 20,
    ingredients: ["pasta", "tomato sauce", "olive oil", "garlic", "salt"],
    steps: [
      "Boil pasta in salted water until al dente.",
      "Heat olive oil, cook garlic briefly, add tomato sauce.",
      "Toss pasta with sauce and serve.",
    ],
  },
  {
    title: "Chicken Rice Bowl",
    cookingTime: 25,
    ingredients: ["chicken", "rice", "soy sauce", "garlic", "oil"],
    steps: [
      "Cook rice according to package instructions.",
      "Cook chicken in oil until done; add garlic.",
      "Add soy sauce, then serve over rice.",
    ],
  },
  {
    title: "Tuna Salad Sandwich",
    cookingTime: 10,
    ingredients: ["tuna", "mayonnaise", "bread", "lemon", "salt", "pepper"],
    steps: [
      "Mix tuna with mayonnaise, lemon, salt, and pepper.",
      "Toast bread if desired.",
      "Assemble sandwich and serve.",
    ],
  },
  {
    title: "Oatmeal with Banana",
    cookingTime: 8,
    ingredients: ["oats", "milk", "banana", "honey", "cinnamon"],
    steps: [
      "Cook oats with milk on the stove or microwave.",
      "Slice banana and add on top.",
      "Drizzle honey and sprinkle cinnamon.",
    ],
  },
  {
    title: "Greek Yogurt Bowl",
    cookingTime: 5,
    ingredients: ["yogurt", "honey", "granola", "berries"],
    steps: ["Add yogurt to a bowl.", "Top with granola and berries.", "Drizzle honey."],
  },
  {
    title: "Avocado Toast",
    cookingTime: 10,
    ingredients: ["bread", "avocado", "lemon", "salt", "pepper"],
    steps: [
      "Toast bread.",
      "Mash avocado with lemon, salt, and pepper.",
      "Spread on toast and serve.",
    ],
  },
  {
    title: "Veggie Omelet",
    cookingTime: 15,
    ingredients: ["eggs", "onion", "tomato", "cheese", "salt", "pepper"],
    steps: [
      "Chop onion and tomato.",
      "Whisk eggs with salt and pepper.",
      "Cook veggies, add eggs, add cheese, fold and serve.",
    ],
  },
  {
    title: "Simple Pancakes",
    cookingTime: 20,
    ingredients: ["flour", "milk", "eggs", "baking powder", "sugar", "butter"],
    steps: [
      "Mix dry ingredients, then add milk and eggs.",
      "Cook batter on a buttered pan until bubbles form; flip.",
      "Serve warm.",
    ],
  },
  {
    title: "Bean & Cheese Quesadilla",
    cookingTime: 12,
    ingredients: ["tortilla", "beans", "cheese", "oil"],
    steps: [
      "Place beans and cheese on a tortilla and fold.",
      "Cook in a pan with a little oil until golden.",
      "Slice and serve.",
    ],
  },
];