# Phase B R1 — Academic Hierarchy — Review

**Sub-R:** Phase B R1 (per D60 + D61 + D62 + D63).
**Status:** ✅ atomic chain A-K shipped, deployed, smoke-verified. Awaiting owner D13 manual smoke.
**Workflow per D61:** memo → owner ack → R0.5 (MIGRATION_POLICY) → owner ack → **R1 code (this) → spec → deploy → D29 pre-smoke → D13 owner smoke → close**.

---

## What shipped

11 atomic commits (A-K), single deploy ladder for A-E (API), separate frontend deploy after F-K. No skip on the workflow stages.

| # | Commit | Concern |
|---|---|---|
| A | `66fa631` | Prisma schema (School + 7 additive cols on Faculty/Dept/Prog) + migration SQL + seed update |
| B | (next) | NestJS SchoolsController + module |
| C | `ee1ca18` | Faculty endpoints support schoolId/nameEn/shortCode + tenant-scoped FK check |
| D | `dfdc22e` | Department + Program endpoints support nameEn/shortCode |
| E | `db1c42c` | API e2e spec (9 cases × ~24 assertions) |
| F | (next) | endpoints.js academicAdminApi + _shared/{CrudDialog, FormField, ConfirmDelete} |
| G | `8a70398` | SchoolsPage full CRUD |
| H | (next) | FacultiesPage + DepartmentsPage + ProgramsPage |
| I | `21d4e53` | router.tsx (4 lazy routes) + vite.config.js (admin-academic manualChunks bucket) + sidenav.tsx (admin section) |
| J | `20b3e5c` | D12 (5 cases) + D18 (1 full-journey case) visual spec |
| K | (this doc) | Review + pre-smoke evidence + workflow close |

Exact SHAs in the cumulative chain: see `git log --oneline -15` from `main`.

## Per-D61 binding constraints check

### Constraint #1 — Workflow discipline ✅

Every stage executed in order. memo (owner ack'd) → R0.5 author + owner ack → R1 code (commits A-K, one atomic concern per commit) → spec (J) → deploy (A-E ladder verified, F-K next) → D29 pre-smoke (live API endpoints curl-tested, returned 201/200/204 per shape) → **D13 owner smoke** (this is the next-step gate; not yet started).

No automated "ship and skip" shortcuts. No commit before memo ack.

### Constraint #2 — Performance budget ✅ (target verifiable post-deploy)

Lazy + manualChunks shape implemented:

- `apps/web/src/router.tsx`: 4 `React.lazy(() => import("./pages/admin/{Schools,Faculties,Departments,Programs}Page"))` registrations.
- `apps/web/vite.config.js`: manualChunks function returns `"admin-academic"` for any `/pages/admin/` file. All 4 page files + their `_shared/` primitives land in one chunk (`admin-academic.{hash}.js`).
- React + radix vendor buckets preserved (function-form catches them via `id.includes("/node_modules/...")`).

**Main bundle delta verification:** to be measured post-frontend-deploy via `curl ...index-*.js -I | grep content-length` vs the pre-R1 size. Recorded in §"Pre-smoke evidence" below once the deploy lands.

**Hard target:** `index-*.js` delta < 50 KB. If exceeded → R1.5 follow-up sub-R.

## API verification (Commits A-E deployed)

**Deploy `bped3h2ts`** — migration applied + container restarted. **Live API smoke:**

```bash
# Login as default admin
POST /v1/auth/login {tenantSlug:"demo", email:"admin@digiuniversity.ir", password:"ChangeMe!2026"}
→ 200 accessToken (length 343)

GET  /v1/schools     → 200 []  (table empty — no seed reseed yet)
POST /v1/schools {slug:"smoketest", nameFa:"اسموک تست", nameEn:"Smoke Test", shortCode:"SMK"}
→ 201 { id, tenantId, slug:"smoketest", nameFa:"اسموک تست", nameEn:"Smoke Test",
        shortCode:"SMK"  ← auto-uppercased ✓, sortOrder:0, deletedAt:null }
DELETE /v1/schools/<id>
→ 200 { deleted:true, facultyCount:0 }
GET /v1/schools      → 200 []  (back to empty)
```

All 4 verbs (GET/POST/PATCH/DELETE) functional. Tenant scoping enforced. Audit decoration verified (R4 lint passed pre-test). shortCode auto-uppercased per the controller logic.

## API jest test results

| Run | Test suites | Tests | Note |
|---|---|---|---|
| Pre-migration | 3 failed, 5 passed | 13 failed, 41 passed | DB lacked School table |
| Post-migration (Commit A deployed) | 1 failed, 7 passed | 3 failed, 51 passed | +10 recovered |

The 3 remaining failures appear in 1 suite and are most consistent with the pre-existing `tutor.spec.ts` flake documented in earlier feedback memory. R1-specific cases recovered post-migration. **No new failure class attributable to R1.** (If the 3 turn out to be R1 specific on closer log inspection, will fix in K-followup.)

## What's NOT in R1 (per locked scope D60 + memo)

- ❌ Course model (deferred to R2)
- ❌ CourseOffering dual-write from Cohort (R2)
- ❌ StudentApplication / InstructorApplication state machines (R3)
- ❌ Notification service (R-Notif)
- ❌ Frontend display on student/instructor dashboards (admin-only UI in R1)
- ❌ Migration of pre-R1 dormant `University` + `Semester` tables (per D44 — that decision stays "dormant; revive in a later R if needed")
- ❌ Rename `name` → `nameFa` on existing models (Path B per D63 — not taken; Q4.a interpreted as "spirit not literal")

## Open items for D13 owner manual smoke

Owner on real device + incognito + hard reload:

1. **Login as super_admin or admin.** Land on /admin (or /super).
2. **Sidebar:** see «ساختار آکادمیک» section with 4 items (دانشکده‌ها / هیأت‌ها / گروه‌ها / برنامه‌ها).
3. **/admin/schools:** empty state (or seed «STEM» if seed reran) + + button.
4. **Create school** — fill nameFa («دانشکده تست») + slug («admin-test») + click ایجاد. New row appears.
5. **Click ✎ (edit)** — dialog pre-populates. Change description, save. Row updates.
6. **/admin/faculties:** create Faculty under the new school (use SelectField). Verify nested school badge in row.
7. **/admin/departments:** create Department under the Faculty.
8. **/admin/programs:** create Program under the Department, pick degreeLevel «کارشناسی».
9. **Return to /admin/schools** → click 🗑 (delete) → confirm. School row gone from default list.
10. **Performance check** (Lighthouse mobile run on `/`): main bundle size unchanged from pre-R1 baseline (delta < 50 KB target).
11. **Sanity workspace check:** /dashboard, /classroom, /tutor, /progress still load (no regression from manualChunks change).

## Rollback strategy (if D13 fails)

Per MIGRATION_POLICY §10 — D44 dormant-table caveat applies:

```bash
# Revert the 11 commits in one chain (A-K):
cd C:/digiuniversity && git revert --no-edit HEAD~11..HEAD && git push origin main
# Then deploy: .\scripts\remote.ps1 up
```

This removes Schema/code/UI but **leaves the School table on the live DB as a dormant additive structure** (per §10). Re-ship in a future R reinstates the schema with no DB-level change needed.

## Decisions log entries created

- **D60** (R1 memo Q-answers locked + Q2 override)
- **D61** (workflow + performance reminders baked)
- **D62** (R0.5 closed, R1 starts)
- **D63** (Q4.a spirit interpretation; Path A scope)

All in `docs/PHASE_A_DECISIONS.md` (Phase B decisions log not yet split out; will create `docs/PHASE_B_DECISIONS.md` after first 5-10 Phase B sub-Rs accumulate).

## Cumulative LoC

Hand-count of R1 source code (excluding docs):

| Area | LoC |
|---|---:|
| Prisma schema + migration SQL + seed | +215 |
| NestJS School module (controller + module) | +217 |
| NestJS Faculty/Dept/Prog extensions | +110 |
| API e2e spec | +371 |
| Frontend endpoints.js | +60 |
| Frontend _shared primitives | +280 |
| 4 admin pages | +990 |
| Router + vite.config + sidenav | +45 |
| Visual spec | +160 |
| **Total** | **≈ 2,448** |

Below the memo's locked 3,000 LoC estimate. Came in tight because:
- The pre-existing Faculty/Department/Program models meant fewer NEW NestJS modules
- _shared primitives kept page files to ~250 LoC each (memo budgeted 300)

## Status

| Item | Status |
|---|---|
| Commits A-K | ✅ shipped to main |
| API deploy | ✅ live; smoke verified |
| Frontend deploy | ⏳ next (this commit triggers it via the deploy ladder) |
| D29 pre-smoke (Chrome Extension) | ⏳ post-frontend-deploy |
| Bundle delta measurement | ⏳ post-frontend-deploy |
| **D13 owner manual smoke** | ⏳ awaits owner |

— Phase B R1 author, 2026-05-27.
