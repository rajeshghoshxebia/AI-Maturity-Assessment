# Phase 1 — RBAC, Users & Credentials: Design & Task Breakdown

**Status:** Draft for review · **Date:** 2026-07-07
**Depends on:** [business-scenario-roadmap.md](business-scenario-roadmap.md) (decisions locked 2026-07-07)
**Goal:** Establish the role model, Admin-managed user accounts (username/password), Assessment Consultant → Organization assignments, and role-based data visibility — plus the small maturity-label switch. This unblocks every later phase.

---

## 1. Scope

**In scope**
1. Reconcile the role taxonomy to the spec's 7 roles.
2. Admin-managed **Person/User** accounts: create user, auto-generate username, default password `username@123`, reset password (hashed storage).
3. **Login with app credentials** (username + password) alongside the existing Azure AD path and dev bypass.
4. **Assessment Consultant assignments** (consultant → organization) + service.
5. **Role-based data visibility** enforced server-side (repositories / dependency guards).
6. **Maturity-label switch** to the spec set (small, self-contained — ships first).
7. Admin **User Management** UI (list/create/edit/reset/deactivate) + Consultant Assignment UI.

**Out of scope (later phases)**
- Horizontal menu / left-tree navigation shell (Phase 2 — this phase only exposes the role so Phase 2 can branch on it).
- Assessment Periods, Framework admin, execution, evidence, etc.

---

## 2. Current state (verified in code)

- `users` already has: `email`, `name`, `azure_oid`, **`role`** (enum `UserRole`: `PLATFORM_ADMIN, ORG_ADMIN, CONSULTANT, STAKEHOLDER, VIEWER`), `magic_link_token`, `tenant_id`.
- `app/core/auth.py`: dev short-circuit returns a fixed `CONSULTANT` dev user when `APP_ENV=development` and `AZURE_TENANT_ID` blank; production decodes Azure AD JWT but sets `user_id=uuid.uuid4()` (**placeholder — no DB user lookup yet**).
- Scoring labels live in `app/core/scoring.py::maturity_label()` (Planning…Optimizing) and are echoed in the frontend report page + PPT color map.

**Implication:** we are *extending* an existing role column, not adding one from scratch, and we must add a real **DB user lookup** on login (both Azure AD and credential paths).

---

## 3. Role taxonomy reconciliation

Spec roles → app enum. Proposal: **rename/extend `UserRole`** to the spec set (keeps one enum, avoids a parallel model).

| Spec role | New `UserRole` value | Notes |
|---|---|---|
| Administrator | `ADMINISTRATOR` | Platform-wide (replaces `PLATFORM_ADMIN`). |
| Primary Contact Organization | `PC_ORGANIZATION` | Org-scoped admin (≈ old `ORG_ADMIN`). |
| Primary Contact Business Unit | `PC_BUSINESS_UNIT` | BU-scoped. |
| Primary Contact Team | `PC_TEAM` | Team-scoped. |
| Assessment Consultant | `ASSESSMENT_CONSULTANT` | Was `CONSULTANT`; access via assignments. |
| Member | `MEMBER` | Executes assessments (was ≈ `STAKEHOLDER`). |
| Viewer | `VIEWER` | Read-only. |

Migration `007` maps existing rows: `PLATFORM_ADMIN→ADMINISTRATOR`, `ORG_ADMIN→PC_ORGANIZATION`, `CONSULTANT→ASSESSMENT_CONSULTANT`, `STAKEHOLDER→MEMBER`, `VIEWER→VIEWER`. Dev user default → `ADMINISTRATOR` (so dev can do everything).

> ⚠️ **Decision to confirm:** rename the enum (cleaner, one taxonomy) vs. keep old values and add new. Recommendation: **rename** — low data volume, single migration.

---

## 4. Permission matrix (server-enforced)

| Capability | Admin | PC-Org | PC-BU | PC-Team | Consultant | Member | Viewer |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Manage users (create/reset) | ✅ | ✅ (own org) | — | — | — | — | — |
| Manage org hierarchy | ✅ | ✅ (own org) | BU only | Team only | ❌ (read) | — | — |
| Assign consultants | ✅ | ✅ (own org) | — | — | — | — | — |
| Create/edit assessments | ✅ | ✅ (own org) | — | — | ✅ (assigned orgs) | — | — |
| Execute assessment | — | — | — | — | — | ✅ | — |
| View reports | ✅ all | ✅ own org | ✅ BU | ✅ Team | ✅ assigned | published only | published only |

Visibility scope resolves to a **set of organization ids** the user may see:
- Admin → all.
- PC-Org → their organization.
- PC-BU / PC-Team → their organization (scoped further to BU/Team where relevant).
- Consultant → orgs from `consultant_assignments` where `active`.
- Member / Viewer → their organization (published data only).

---

## 5. Data model changes (migration `007`)

**`users`** (extend)
- `username` `String(64)` unique, nullable (null for Azure-only users).
- `password_hash` `String(255)` nullable (bcrypt/argon2; null for Azure-only users).
- `is_active` `Boolean default true`.
- `primary_org_unit_id` `UUID FK org_units(id) ondelete SET NULL` nullable (for PC-BU/PC-Team/Member scoping).
- Convert `role` enum values (see §3).

**`consultant_assignments`** (new)
- `id` UUID PK; `tenant_id` FK; `person_id` FK `users(id)` (must be `ASSESSMENT_CONSULTANT`); `organization_id` FK `organizations(id)`; `active` bool default true; `assigned_by` FK users; timestamps.
- Unique `(person_id, organization_id)` — no duplicate assignments.

**`organizations`** (optional, low priority)
- `org_code` `String(30)`, `geography` enum (APAC/EMEA/NA/GLOBAL). Additive, nullable.

All changes additive; no drops. Reuse existing `tenant_id` + RLS.

---

## 6. Authentication changes

Add a **credential login** without breaking Azure AD or dev bypass. Resolution order in `get_current_user` / a new `/auth/login`:

1. **Dev bypass** (unchanged): `APP_ENV=development` + blank `AZURE_TENANT_ID` → dev user, now role `ADMINISTRATOR`.
2. **Credential login** (new): `POST /auth/login {username, password}` → verify against `users.password_hash` → issue an app **JWT** (signed with `SECRET_KEY` — this is finally where `SECRET_KEY` is used) → subsequent requests send `Authorization: Bearer <appJWT>`.
3. **Azure AD** (existing): decode Azure JWT, then **look up the DB user by `azure_oid`/email** to get the real `user_id` + `role` (fixes today's placeholder `uuid4()`).

`get_current_user` distinguishes token types (app JWT vs Azure) by issuer/claim. `CurrentUser` gains `org_scope: set[UUID] | None` (None = all) resolved once per request from role + assignments.

**Password rules (spec):** default `username@123`; store only the hash. **Username auto-generation:** `firstname + lastname[0]`; on collision use next lastname letter; then append `x`, `@`, `#`. Deterministic, always unique.

**Libraries:** `passlib[bcrypt]` (hashing), `python-jose` (already present) for app JWTs.

---

## 7. Maturity-label switch (quick win — ship first)

`app/core/scoring.py::maturity_label(score)` → spec bands:

| Band | Label |
|---|---|
| 0.0–1.0 | Initial |
| 1.1–2.5 | Developing |
| 2.6–3.5 | Managed |
| 3.6–4.5 | Advanced |
| 4.6–5.0 | Optimized |

Update frontend consumers: `MATURITY_COLORS`, `maturityBadgeClass`, `_MATURITY_GUIDANCE` (reports.py), `_DIM_NARRATIVE` unaffected. Grep for the old labels across `frontend/` + `backend/` and replace. Self-contained; no data migration (labels are derived, not stored).

---

## 8. API surface (new/changed)

- `POST /auth/login` — credential login → app JWT.
- `POST /auth/logout` — client-side token discard (no server session); optional.
- `GET /users` — list (scoped); `POST /users` — create (auto username + default password); `PATCH /users/{id}` — edit role/active/org unit; `POST /users/{id}/reset-password` — reset to default; (no hard delete — deactivate).
- `GET /consultant-assignments` · `POST` · `PATCH/{id}` (deactivate) · `DELETE/{id}`.
- Existing endpoints: inject org-scope filter from `CurrentUser.org_scope`.

Schemas: `UserCreate/Out/Update`, `LoginRequest/TokenResponse`, `ConsultantAssignmentCreate/Out`.

---

## 9. Frontend

- **Login page:** add username/password form (keep Azure AD button if present). Store app JWT; attach to `api-client` Authorization header.
- **Admin › Users:** table (username, name, email, role, org, active) + Create dialog (name/email/role/org/unit → shows generated username + default password) + Reset password + Deactivate.
- **Admin › Consultant Assignments:** grid + Assign dialog (consultant dropdown filtered to `ASSESSMENT_CONSULTANT`, org dropdown excluding Xebia) + deactivate/remove; block duplicates.
- **Role plumbing:** expose current role from a `/me` call so Phase 2 nav can branch. Hide admin routes for non-admins client-side (server still enforces).

---

## 10. Task list

| # | Task | Area | Priority |
|---|---|---|---|
| P1-01 | Switch `maturity_label()` to spec bands + update FE label/colour maps | scoring | High (ship first) |
| P1-02 | Migration `007`: rename `UserRole` values + map existing rows | db | High |
| P1-03 | Extend `users`: `username`, `password_hash`, `is_active`, `primary_org_unit_id` | db/model | High |
| P1-04 | `consultant_assignments` model + migration + repo | db/model | High |
| P1-05 | Password hashing util (`passlib`) + username auto-generation service | backend | High |
| P1-06 | `POST /auth/login` + app JWT issue/verify (`SECRET_KEY`) | auth | High |
| P1-07 | `get_current_user`: DB user lookup for Azure path; resolve `org_scope` | auth | High |
| P1-08 | Permission dependency/guards + org-scope filter helper | auth | High |
| P1-09 | Apply org-scope filter to existing org/assessment/report queries | backend | High |
| P1-10 | User CRUD endpoints + schemas (create/list/edit/reset/deactivate) | api | High |
| P1-11 | Consultant assignment endpoints + duplicate guard | api | High |
| P1-12 | `GET /me` (role, name, org_scope summary) | api | Medium |
| P1-13 | FE: credential login form + token wiring | frontend | High |
| P1-14 | FE: Admin Users screen (list/create/reset/deactivate) | frontend | High |
| P1-15 | FE: Consultant Assignments screen | frontend | High |
| P1-16 | Seed: one Administrator + demo consultant + assignment | seeds | Medium |
| P1-17 | Tests: auth (login/lookup), permission matrix, username gen, visibility | tests | Medium |

---

## 11. Definition of Done

- ✅ Reports show spec maturity labels everywhere (backend + FE + PPT).
- ✅ Admin can create a user; username auto-generated & unique; default password set; password stored hashed.
- ✅ User can log in with username/password and receives a working session; Azure AD login now resolves a real DB user; dev bypass still works as `ADMINISTRATOR`.
- ✅ Admin/PC-Org can assign a consultant to an organization; duplicates blocked; deactivation revokes access.
- ✅ A consultant sees only assigned organizations' data; other roles are scoped per §4; enforced server-side (verified by test).
- ✅ Migration `007` runs clean on Render (`alembic upgrade head`); existing rows mapped.
- ✅ No hard user deletes (deactivate only).

---

## 12. Risks & confirmations

1. **Enum rename** (§3) — confirm rename vs additive. *(Recommendation: rename.)*
2. **Two token types** — app JWT + Azure JWT coexisting adds auth-branch complexity; mitigated by issuer check and thorough tests.
3. **Org-scope retrofit** (P1-09) — existing queries assume tenant-only scoping; adding org-scope touches several endpoints. Do it behind one reusable helper to limit blast radius.
4. **`SECRET_KEY`** finally becomes load-bearing (signs app JWTs) — must be set & stable on Render (rotating it invalidates active sessions).
