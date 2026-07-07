# AIMA — Business Scenario Reconciliation & Roadmap

**Status:** Draft for review · **Date:** 2026-07-07
**Author:** Consultant + Claude Code
**Source specs:** 24 markdown documents under `aima/` (entity framework, navigation, framework master, assessment periods, administration, design/scheduling, execution, evidence, consultant review, reporting/benchmarking, monitoring/reminders, consultant role/assignment).

---

## 1. Purpose

The 24 source documents describe the *full product vision* for the AI Maturity Assessment (AIMA) platform. They were written against a **standalone HTML + browser LocalStorage prototype** ("no backend will be used"), with every integration (Jira, Excel, PDF, email, Teams) simulated.

Our live product is different in implementation: **Next.js 14 (App Router) + FastAPI + PostgreSQL (Neon) + Azure AD**, deployed on Vercel/Render.

This document reconciles the two. It is the agreed plan of record for turning the spec's *business scenarios* into features on the real stack.

### Locked decisions (2026-07-07)

1. **Treat the docs as feature/business requirements for the real app.** Ignore the "LocalStorage / no-backend / simulated" implementation details — persistence is Postgres via FastAPI, and integrations become real (or explicitly stubbed) server-side.
2. **This document first, code second.** No implementation until the roadmap is agreed.
3. **Keep the current data model and maturity labels.** No Competency layer migration, no relabelling of maturity bands right now. Map terminology only (§4). Revisit per-feature if a feature genuinely requires it.
4. **RBAC is Phase 1.** The role model + Assessment Consultant assignments come before the other feature areas, because most spec features gate on roles.

---

## 2. How to read this

Each feature area (§5) is graded:

| Verdict | Meaning |
|---|---|
| ✅ **Have** | Already exists in the app, possibly under a different name. |
| 🔧 **Adapt** | Partially exists; extend/rename to meet the spec. |
| 🏗️ **Build** | New capability. |
| ⚠️ **Conflict** | Spec contradicts current architecture/model; resolution noted. |
| ⏸️ **Defer** | Out of near-term scope; parked with rationale. |

---

## 3. Current-state summary (what `main` has today)

- **Entities:** `Organization`, `OrgUnit` (unit_type = BUSINESS_UNIT / DEPARTMENT / TEAM, self-referencing hierarchy, `active_dimension_codes`), `Assessment` (mode CONSULTANT/SURVEY, per_team, org_context, notes, active_subcategories), `Response` (score 1–5, observations, org_unit_id), `Dimension` → `Question` (+ `TechSubcategory`, + `CompetencyLevel` per question with level 1–5 descriptions), `SurveyInvitation`, `SurveyAssignment`.
- **Auth:** Azure AD token decode; dev-mode fixed tenant/user UUIDs. **No role model.**
- **Scoring:** weighted dimension scores → overall; maturity labels Planning / Experimenting / Standardizing / Scaling / Optimizing. Per-team hierarchy rollup = average of children (team→dept→BU→org).
- **Reporting:** report page with radar/bar charts, hierarchy tree, team comparison, runtime level filter; **AI "Summary (AI generated)"** via OpenAI `gpt-4o` (consultant custom prompt + question-level data + comments); PDF/PPT export.
- **CRUD:** organizations + units (hierarchy builder with per-unit dimension dropdown), assessments (create/edit/delete/status), invitations.

---

## 4. Terminology map (spec → app)

| Spec term | App equivalent | Notes |
|---|---|---|
| Organization | `Organization` | Same. Spec adds fields: OrgCode, Address, Country, Geography, Industry. App has name + industry → **Adapt** (add code/geography). |
| Business Unit / Team | `OrgUnit` (unit_type) | App also has DEPARTMENT tier; spec uses BU→Team. Keep app's richer hierarchy. |
| Person | `User` + **role** | Role is the Phase-1 add. |
| Assessment Period | *(new)* `AssessmentPeriod` | Time-boxed cycle per org. No direct equivalent — **Build**. |
| Assessment Definition | *(new)* selected dimensions/competencies for a period | Partially covered by `active_subcategories` + per-unit `active_dimension_codes`. |
| Assessment Design | *(new)* selected **questions** | App currently includes all seeded questions. |
| Assessment (execution) | `Assessment` + `Response` | Closest existing concept. |
| Dimension | `Dimension` | Same. |
| Competency | *(no table)* | **Decision: not adding.** App is Dimension→Question. `TechSubcategory` is a partial analog. Spec competencies map to dimension-level for now. |
| Question | `Question` | Same. |
| Rating statement (0–5 + description) | `CompetencyLevel` | App already stores per-question level descriptions. |
| Maturity: Initial/Developing/Managed/Advanced/Optimized (0–5) | Planning/Experimenting/Standardizing/Scaling/Optimizing (1–5) | **Keep current labels.** Map in report copy only if needed. ⚠️ scale differs (0–5 vs 1–5). |
| Member (self-executes) | survey respondent / `SurveyInvitation` | Extend to full self-serve execution. |
| Consultant Review | consultant scoring (+ AI summary) | Extend with independent ratings/insights + evidence/backlog sections. |
| Evidence | *(new)* | **Build.** |
| Benchmarking | *(new)* | **Build (later).** |

---

## 5. Gap analysis by feature area

### A. Entity framework, roles & RBAC — 🏗️ Build (Phase 1)
- **Spec:** 7 roles (Administrator, Primary Contact Organization/BU/Team, Assessment Consultant, Member, Viewer); Person entity with role; consultant→org assignments; data visibility filtered by role; per-role navigation trees; username/password generation rules.
- **Current:** Azure AD + tenant, dev UUIDs, no roles.
- **Gap:** entire role model + permission service + row-level visibility + Assessment Consultant assignment table.
- **Notes:** Username/password generation (spec §entity) is **not applicable** — we use Azure AD identities, not app-managed passwords. Model roles as a `role` column on user + a `consultant_assignments` table. Enforce visibility in repositories/RLS.

### B. Navigation & workspace layout — 🔧 Adapt (Phase 2)
- **Spec:** header + horizontal functional menu + left hierarchical tree + workspace; role-specific menus; dashboard counts by visibility; responsive (hamburger + collapsible tree).
- **Current:** dashboard sidebar nav, no horizontal menu, no org tree in-shell.
- **Gap:** horizontal menu, left org tree, role-driven menu items, dashboard count cards.

### C. Assessment Framework master (admin) — 🔧 Adapt (Phase 3)
- **Spec:** CRUD Dimensions / Competencies / Questions; Active/Inactive (never delete); usage-impact panel; framework tree; only Active items flow into design/execution.
- **Current:** framework is seeded, read-only via API; `CompetencyLevel` exists per question.
- **Gap:** admin CRUD screens + active/inactive flags + "active-only" filtering. **Competency tier omitted** per decision — manage Dimensions + Questions (+ level descriptions) only.

### D. Assessment Periods — 🏗️ Build (Phase 4)
- **Spec:** `AssessmentPeriod` (org, name, description, start/end, status Planned/In Progress/In Review/Done/Cancelled); list/search/filter; role-scoped create/edit.
- **Current:** none (assessments are standalone).
- **Gap:** new entity + screens; later becomes the parent of definitions/designs/assessments.

### E. Assessment Administration (Definition) — 🔧 Adapt (Phase 4)
- **Spec:** pick a period → select applicable Dimensions → select Competencies → save an `AssessmentDefinition` (+ details); status Draft/Ready/Published/Closed.
- **Current:** dimension selection exists per-unit (`active_dimension_codes`) and via `active_subcategories`.
- **Gap:** period-scoped definition entity; competency selection maps to dimension-level (no competency tier).

### F. Assessment Design & Scheduling — 🏗️ Build (Phase 5)
- **Spec:** 3-panel designer (Dimensions/Competencies/Questions) with include-all + dynamic refresh; save `AssessmentDesign`; schedule to Members by scope (Org/BU/Team); participant selection grid.
- **Current:** questions all-in; scheduling ≈ survey invitations.
- **Gap:** question-selection design; participant scheduling on top of invitations.

### G. Assessment Execution (Member self-serve) — 🔧 Adapt (Phase 5)
- **Spec:** Member logs in → My Assessments → intro page (AI-generated) → dimension tree + competency ribbon + question radios (rating + description) → autosave → progress bar → "Need more info" → submit-when-complete.
- **Current:** consultant-driven scoring UI; survey invitations exist but not a full member execution flow.
- **Gap:** member-facing execution workspace, autosave, progress, submission lifecycle (Assigned→In Progress→Submitted).

### H. Evidence management — 🏗️ Build (Phase 6)
- **Spec:** consultant defines required evidences per dimension (AI-suggested checklist + custom + mandatory); client Primary Contacts provide evidence (PDF, simulated); status workflow; consultant reviews.
- **Current:** none.
- **Gap:** evidence-requirement + submission entities + screens. Real file storage decision needed (see §7).

### I. Consultant Assessment Review — 🔧 Adapt (Phase 7)
- **Spec:** consultant independent ratings vs member ratings; insights; evidence review; backlog review; leadership-alignment review; share → feedback → publish; PDF export with privacy controls.
- **Current:** consultant scoring + AI summary + notes; no member-vs-consultant comparison, no evidence/backlog sections, no share/feedback workflow.
- **Gap:** review workspace + review lifecycle + privacy-controlled export.

### J. Reporting, benchmarking & publication — 🔧 Adapt (Phase 8)
- **Spec:** scoring engine (question→competency→dimension→overall), executive summary, radar, heatmap, consultant recommendations, industry/overall benchmarking (anonymised), BU/team comparison, historical trends, publication workflow (Draft→…→Published), export dialog with content toggles, responsible-interpretation disclaimer.
- **Current:** radar/bar, hierarchy tree, team comparison, AI summary, PDF/PPT export, level filter.
- **Gap:** heatmap, benchmarking, historical trends, publication lifecycle, content-toggle export, disclaimer. ⚠️ Scoring uses dimension→overall (no competency mid-layer) — consistent with our kept model.

### K. Assessment Tracking & Reminders (Monitoring) — 🏗️ Build (Phase 9)
- **Spec:** monitoring dashboard (Planned/In Progress/Completed/Overdue), participant status grid, individual + bulk reminders (email now, Teams placeholder).
- **Current:** invitations list with status; no monitoring dashboard or reminders.
- **Gap:** monitoring screens + reminder sending (real email vs simulated — see §7).

### L. Backlog sources / Organization Setup (evidence input) — ⏸️ Defer
- **Spec:** Jira/Excel backlog sources (simulated), uploads, analysis-preparation placeholders; future AI correlation.
- **Verdict:** Defer to a later release; high effort, mostly simulated, and dependent on evidence + review phases landing first.

---

## 6. Data-model impact (given "keep current")

Additive only — no destructive migration:

- **Phase 1:** `users.role` (enum), `consultant_assignments` (person_id, organization_id, active). Org fields: add `org_code`, `geography` (optional).
- **Phase 4:** `assessment_periods`; link `assessments.assessment_period_id` (nullable, backfilled later).
- **Phase 4–5:** `assessment_definitions` + details (dimension/question selection per period); reuse `active_dimension_codes`.
- **Phase 6:** `evidence_requirements`, `evidence_submissions`.
- **Phase 7:** `consultant_reviews` (+ per-question consultant ratings/insights, evidence/backlog review fields).
- **Phase 8:** `published_reports`, benchmarking aggregates, historical snapshots.

The **Competency tier is intentionally not added.** Spec "competency selection" collapses to dimension-level; spec "rating statements" already map to the existing `CompetencyLevel` rows on each question.

---

## 7. Open questions / decisions still needed

1. **Evidence & report files:** the spec simulates uploads/PDF. For the real app, do we (a) store files in object storage (e.g. S3/Azure Blob) now, (b) store metadata only for now, or (c) defer evidence entirely? *(Affects Phase 6/7/8.)*
2. **Reminders/email:** send real email (needs an email provider + templates) or keep simulated (store reminder records) for the first cut? *(Phase 9.)*
3. **Maturity scale:** spec is 0–5 with different labels; we keep 1–5 + current labels. Confirm reports may show our labels even where a doc example shows theirs.
4. **Assessment Period vs existing Assessment:** should the current `Assessment` become "an assessment within a period", or should Period be a lightweight grouping layer added above today's assessments? *(Phase 4 shape.)*
5. **Benchmarking data:** industry benchmarks — real cross-tenant aggregation (privacy/anonymisation rules) or seeded demo benchmarks first? *(Phase 8.)*
6. **RBAC vs Azure AD:** roles are app-managed on top of Azure AD identity (no app passwords). Confirm we drop the spec's username/password-generation rules.

---

## 8. Proposed phase sequence

| Phase | Scope | Depends on |
|---|---|---|
| **0** | This roadmap (done) | — |
| **1** | RBAC: roles, consultant assignments, visibility filtering, permission service | — |
| **2** | Navigation/workspace: horizontal menu, left org tree, role-based menus, dashboard counts | 1 |
| **3** | Framework master admin (Dimensions + Questions CRUD, active/inactive) | 1 |
| **4** | Assessment Periods + Definition | 1, 3 |
| **5** | Design (question selection) + Scheduling + Member execution | 3, 4 |
| **6** | Evidence management | 4 (Q7) |
| **7** | Consultant Review workflow | 5, 6 |
| **8** | Reporting, benchmarking, publication | 5, 7 |
| **9** | Monitoring & reminders | 5 (Q7 email) |
| **L** | Backlog sources / analysis | Deferred |

Next action after sign-off: begin **Phase 1 (RBAC)** — detailed task breakdown to follow in its own doc.
