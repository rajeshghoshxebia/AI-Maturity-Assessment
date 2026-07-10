# AI Maturity Assessment — Claude Code Instructions

## Git Workflow

### Branch model
Two long-lived branches:
- **`preview`** — integration branch. All day-to-day changes land here and deploy to the **preview environment** (separate Vercel + Render URLs and database). This is the default working branch.
- **`main`** — production. Only updated by promoting `preview`. Push to `main` deploys to production.

Do all work on `preview` (commit directly, or via short-lived feature branches merged into `preview`). Do **not** develop directly on `main`.

### Working on preview
```bash
git checkout preview
git pull origin preview
# ...make changes...
git commit -m "…"
git push origin preview      # → deploys to the preview URLs
```

Optional feature branches still use `feature/YYYY-MM-DD` (append a slug for multiples, e.g. `feature/2026-06-29-cors-fix`) and merge into `preview`.

### Releasing to production
Promote `preview` → `main` once verified on the preview URLs:
```bash
git checkout main
git pull origin main
git merge --ff-only preview   # or open a PR: preview → main
git push origin main          # → deploys to production
git checkout preview          # resume work on preview
```

Prefer a PR (`preview → main`) with an imperative title when you want review before release.

## Stack

- **Frontend**: Next.js 14 App Router · TypeScript · Tailwind CSS
- **Backend**: FastAPI · Python 3.11 · SQLAlchemy (async) · Alembic
- **Database**: PostgreSQL (Neon in production, local postgres in dev)
- **Hosting**: Vercel (frontend) · Render (backend, Docker)

## Dev mode

- Blank `AZURE_TENANT_ID` → skip token decode; use fixed dev UUIDs
- Dev tenant: `00000000-0000-0000-0000-000000000001`
- Dev user:   `00000000-0000-0000-0000-000000000002`

## Running locally

```bash
# Backend
cd backend
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm run dev
```

## Deployment

Two environments, each driven by its branch (see `docs/preview-environment.md`):

| Env | Branch | Frontend (Vercel) | Backend (Render) |
|-----|--------|-------------------|------------------|
| Preview | `preview` | preview URL (`…-git-preview-…`) | `ai-maturity-backend-preview` |
| Production | `main` | production URL | `ai-maturity-backend` |

- Push to `preview` → deploys the preview environment.
- Push to `main` → deploys production.
- On both, the backend start command runs `alembic upgrade head && python -m seeds.runner` before uvicorn.
- Preview uses a **separate database** and its own env vars; never point preview at the production DB.
