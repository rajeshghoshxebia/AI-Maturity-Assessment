# AI Maturity Assessment — Claude Code Instructions

## Git Workflow

### Branch naming
Always create a feature branch before starting work. Never commit directly to `main`.

Branch name format: `feature/YYYY-MM-DD`
- Use today's date in the format above.
- If multiple branches are needed on the same day, append a short slug: `feature/2026-06-29-cors-fix`

### Creating a branch
```bash
git checkout -b feature/YYYY-MM-DD
git push -u origin feature/YYYY-MM-DD
```

### Pull requests
- Open a PR from the feature branch into `main`.
- Title: imperative sentence summarising the change (e.g. "Fix CORS for Vercel preview URLs").
- After the PR is merged, delete the remote branch immediately.

### After merge — delete the branch
```bash
git push origin --delete feature/YYYY-MM-DD
git checkout main
git pull origin main
git branch -d feature/YYYY-MM-DD
```

GitHub is configured to auto-delete head branches on merge (Settings → General → "Automatically delete head branches").

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

- Push to `main` triggers Vercel redeploy (frontend).
- Push to `main` triggers Render redeploy (backend); start command runs `alembic upgrade head && python -m seeds.runner` before starting uvicorn.
