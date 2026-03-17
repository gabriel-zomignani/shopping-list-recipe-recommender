# ZomigValu

ZomigValu is a local-first shopping planner built with Next.js. It helps turn a grocery receipt into a practical shopping list, then uses local Ollama models to generate structured recipe suggestions from the ingredients you already have.

The app runs entirely on the user’s machine except for the local Ollama runtime. There is no active cloud database, no auth dependency, and no external AI API requirement in the current branch.

## Current Feature Set

- Local shopping list with case-insensitive dedupe and local persistence
- Receipt image import with local Ollama vision extraction
- Review and edit step before importing receipt items
- Local recipe generation with Ollama from checked available ingredients
- Favorites saved locally
- Recipe history saved locally
- Existing recipe filters and sort controls preserved in the UI

## Architecture

The project is intentionally local-first:

- UI: Next.js App Router frontend with local storage for shopping list, favorites, and history
- Receipt extraction: `POST /api/receipt` -> local Ollama vision model -> validated JSON -> review modal -> local shopping list
- Recipe generation: `POST /api/recipes` -> local Ollama text generation -> validated JSON -> existing recipe cards, favorites, and history flows
- Persistence: browser local storage only for active product behavior

There is no active Supabase/auth runtime on this branch.

## Receipt Extraction Flow

1. Upload a receipt image from the home page
2. The app sends the image to the local Ollama vision model
3. The server validates the returned JSON shape
4. The review modal lets you edit names, quantities, units, and deselect items
5. Selected items are added to the local shopping list with `source: "receipt"`

Expected receipt result shape:

```json
{
  "store": "string | null",
  "date": "string | null",
  "items": [
    {
      "name": "string",
      "quantity": "number | null",
      "unit": "string | null"
    }
  ]
}
```

## Recipe Generation Flow

1. Check the shopping-list items you already have available
2. Optionally enable pantry staples in the existing toggle
3. Click `Generate Recipes`
4. The app sends the available ingredient list to the local Ollama recipe route
5. The server validates the returned JSON and normalizes the recipes
6. Recipes render through the existing recipe UI, with missing ingredients, favorites, and history support intact

Expected recipe result shape:

```json
{
  "recipes": [
    {
      "title": "string",
      "cookingTime": "number",
      "ingredients": ["string"],
      "steps": ["string"],
      "missingIngredients": ["string"]
    }
  ]
}
```

## Setup

### 1. Install Ollama

Install Ollama from the official site for your OS, then start the local runtime:

```bash
ollama serve
```

### 2. Pull the local models

This branch defaults both receipt extraction and recipe generation to the same local model to keep setup simple:

```bash
ollama pull qwen2.5vl:7b
```

If you want a different local text model later, set `OLLAMA_RECIPE_MODEL` explicitly in `.env.local`.

### 3. Environment Variables

Create `.env.local` from `.env.example` if needed:

```bash
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_VISION_MODEL=qwen2.5vl:7b
OLLAMA_RECIPE_MODEL=qwen2.5vl:7b
```

## Run The App

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Create a clean production build:

```bash
npm run build
```

Run the production server locally:

```bash
npm start
```

Open `http://localhost:3000`.

## Local-First Notes

- The app works offline/local apart from the local Ollama runtime
- Favorites and history are stored in browser local storage
- Shopping list state is stored in browser local storage
- There is no active auth, Supabase session, or cloud sync dependency in this branch

## Roadmap

- Phase 2 Supabase/auth work is intentionally parked on `phase-2-supabase-wip`
- Improve receipt extraction robustness for noisier store layouts
- Add richer recipe preferences such as cuisine, servings, and dietary filters
- Improve recipe card presentation with optional quantities or serving estimates
- Add import/export for local history and favorites

## TODO
<img width="1831" height="1290" alt="image" src="https://github.com/user-attachments/assets/452fa248-dadb-4062-b9a0-7a40350bcfc6" />
<img width="1794" height="1204" alt="image" src="https://github.com/user-attachments/assets/257fda86-fd12-4981-8764-5b7a1fd2b8f1" />
<img width="1052" height="1328" alt="image" src="https://github.com/user-attachments/assets/c2ad4668-3553-44ac-b389-c65527eb20bd" />

- Add demo GIF

## Branch Notes

- Stable local-first baseline: `master`
- Current Ollama AI feature branch: `phase-3-receipt-ai-mvp`
- Parked Supabase/auth exploration: `phase-2-supabase-wip`
