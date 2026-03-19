# ZomigValu

ZomigValu is a local-first shopping planner. The frontend is a Next.js app, and OCR/AI backend logic now runs in a separate FastAPI service.

## Architecture

- Frontend: Next.js App Router (`app/`, `components/`, `hooks/`, `lib/`)
- Backend: FastAPI (`backend/app`)
- OCR provider: OCR.space (backend only)
- AI provider: OpenRouter (backend only)
- Persistence: browser-local only (shopping list, favorites, history)

There is no active Supabase/auth runtime and no Neon runtime in this phase.

## Current Features

- Shopping list management with local persistence
- Receipt upload (`jpg`, `png`, `webp`)
- Receipt review/edit/deselect before import
- Recipe generation from available ingredients
- Pantry staples toggle
- Local favorites and local generation history

## Runtime Flow

1. Next.js uploads receipt image to FastAPI `POST /receipt/extract`.
2. FastAPI validates file and sends it to OCR.space.
3. FastAPI sends OCR text to OpenRouter for grocery extraction and normalization.
4. Next.js shows reviewed items and imports selected items to local shopping list.
5. Next.js sends available ingredients to FastAPI `POST /recipes/generate`.
6. FastAPI calls OpenRouter for recipe generation and returns validated JSON.
7. Next.js renders recipes while favorites/history remain local-only.

## Data Shapes

Receipt extraction:

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

Recipe generation:

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

### Frontend (Next.js)

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

### Backend (FastAPI)

1. Create and activate a virtual environment (recommended).
2. Install backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

3. Create `backend/.env` from `backend/.env.example`:

```bash
OCR_SPACE_API_KEY=
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL_EXTRACTION=openrouter/free
OPENROUTER_MODEL_RECIPES=openrouter/free
CORS_ALLOWED_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
```

## Run

Run backend:

```bash
cd backend
uvicorn app.main:app --reload
```

Run frontend (separate terminal):

```bash
npm run dev
```

Production frontend checks:

```bash
npm run build
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

- Frontend no longer uses local Next.js API routes for OCR/AI runtime.
- Backend owns OCR + AI provider integration and output normalization.
- Previous Supabase/auth exploration remains parked on `phase-2-supabase-wip`.
- Neon remains deferred as optional future work.
