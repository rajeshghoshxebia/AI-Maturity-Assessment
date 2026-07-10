# Preview Environment

A dedicated preview stack, isolated from production, driven by the **`preview`** git branch.

```
preview branch ─┬─▶ Vercel  (preview frontend URL)
                └─▶ Render  (ai-maturity-backend-preview → preview API URL)

main branch ────┬─▶ Vercel  (production frontend)
                └─▶ Render  (ai-maturity-backend → production API URL)
```

Workflow: land changes on `preview`, verify on the preview URLs, then merge `preview → main` to release to production.

---

## Frontend (Vercel) — separate preview URL

Vercel already builds a deployment for every branch, so `preview` gets its own URL automatically:

- **Per-commit:** `ai-maturity-<hash>-<team>.vercel.app`
- **Stable branch alias:** `ai-maturity-git-preview-<team>.vercel.app` ← use this as "the preview URL"

One-time setup in the Vercel dashboard:
1. **Settings → Git**: ensure the Production Branch is `main` (so `preview` stays a Preview deployment, not production).
2. **Settings → Environment Variables**, scope = **Preview**:
   - `NEXT_PUBLIC_API_URL` = the preview backend URL (see below), e.g. `https://ai-maturity-backend-preview.onrender.com`
   - `NEXT_PUBLIC_AZURE_CLIENT_ID` / `NEXT_PUBLIC_AZURE_TENANT_ID` — leave unset to keep credential/dev login, or set preview AAD values.

> `frontend/lib/api-client.ts` reads `NEXT_PUBLIC_API_URL` (falls back to `localhost:8000`), so the Preview-scoped value points the preview frontend at the preview backend.

---

## Backend (Render) — separate preview service

`backend/render.yaml` now declares two services:

| Service | Branch | Purpose |
|---|---|---|
| `ai-maturity-backend` | `main` | production API |
| `ai-maturity-backend-preview` | `preview` | preview API (separate URL + DB) |

One-time setup in the Render dashboard:
1. **Blueprints → sync** the repo (or *New → Blueprint Instance*) so `ai-maturity-backend-preview` is created from `render.yaml`.
2. Set its environment variables (all `sync:false`):
   - `DATABASE_URL` → a **separate** database (e.g. a distinct Neon branch/DB) so preview data never touches production.
   - `SECRET_KEY` → any stable random value (own it per environment).
   - `OPENAI_API_KEY` → a key for preview (can be the same or a spend-capped one).
   - `AZURE_TENANT_ID` → blank to allow dev-bypass login on preview, or a preview AAD tenant.
   - `ALLOWED_ORIGINS` → include the Vercel preview origin(s), e.g. `https://ai-maturity-git-preview-<team>.vercel.app`.
3. The Docker start command runs `alembic upgrade head && python -m seeds.runner` before uvicorn, so the preview DB is migrated + seeded on first deploy.

---

## CORS note

The backend allows origins from `ALLOWED_ORIGINS`. The preview backend must list the preview frontend origin, and production must list the production origin — keep them separate so a preview build can't call prod.
