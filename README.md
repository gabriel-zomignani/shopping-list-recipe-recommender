# ZomigValu

ZomigValu is a local-first shopping planner built with Next.js. You can import a grocery receipt image, review extracted ingredients, add selected items to your list, and generate practical recipes from what is currently available in your shopping list.

The active runtime is deployment-friendly for Vercel Hobby:
- Frontend and API routes run in Next.js App Router.
- Receipt OCR runs through OCR.space.
- Ingredient extraction and recipe generation run through OpenRouter.
- Shopping list, favorites, and history remain browser-local.

There is no active Supabase/auth runtime on this branch.

## Current Features

- Local shopping list with case-insensitive dedupe
- Receipt upload (`jpg`, `png`, `webp`) with OCR + AI extraction
- Review/edit/deselect receipt items before import
- Recipe generation from checked available ingredients
- Pantry staples toggle for recipe generation
- Favorites stored locally
- Recipe history sessions stored locally

## Active Architecture

- `app/api/receipt/route.ts`
  - Validates image upload
  - Calls `lib/ocr/ocrSpace.ts` for receipt text
  - Calls `lib/ai/openrouter.ts` + `lib/receipt/extraction.ts` for structured grocery items
  - Validates and normalizes output with `lib/receipt/schema.ts`
- `app/api/recipes/route.ts`
  - Validates generation request
  - Calls `lib/ai/openrouter.ts` + `lib/recipes/openrouter.ts`
  - Validates and normalizes output with `lib/recipes/schema.ts`
- Local persistence only
  - Shopping list, favorites, history: browser local storage

## Data Shapes

Receipt extraction response:

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

Recipe generation response:

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

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill keys:

```bash
OCR_SPACE_API_KEY=
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL_EXTRACTION=openrouter/free
OPENROUTER_MODEL_RECIPES=openrouter/free
```

Notes:
- `OPENROUTER_BASE_URL` defaults to `https://openrouter.ai/api/v1` if omitted.
- Model defaults are configurable through env vars.
- API keys are server-only and never sent to the browser.

## Run

```bash
npm run dev
```

```bash
npm run build
```

```bash
npm start
```

Open `http://localhost:3000`.

## Deployment Notes

- Designed for Vercel Hobby deployment.
- No dependency on local Ollama runtime.
- No cloud database requirement in current phase.
- No auth/session requirement in active runtime.

## Branch and Roadmap Notes

- Previous Supabase/auth exploration is intentionally parked on `phase-2-supabase-wip` and is not part of active runtime.
- Neon is intentionally deferred and optional for a future persistence phase.
- Future work can add optional cloud sync without changing the local-first default behavior.
