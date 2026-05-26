# Phase B R1 — Academic Hierarchy (School + Faculty + Department + Program) — Memo

**Author:** Phase A → Phase B handoff (post-Gate-A close per D58/D59)
**Date:** 2026-05-26
**Status:** 🔒 **LOCKED per D60** — awaiting owner memo re-review (final ack) before code starts
**Workflow:** memo-then-code-then-test-then-D13 per D11 + Phase A retrospective lesson #1
**Compass Roadmap reference:** §Phase B — Academic Hierarchy + Onboarding (~3 weeks)

## 🔒 Locked answers (D60)

Owner answered 2026-05-26: **«Q1.a Q2.a Q3.a Q4.a شروع کن»** with explicit Q2 override.

| Q | Decision | Rationale |
|---|---|---|
| Q1.a | `docs/MIGRATION_POLICY.md` is a **separate pre-R1 task** (R0.5) | Clean sub-R boundaries; policy doc owner-reviewable independently. |
| **Q2.a** **(OVERRIDE)** | **Full CRUD across all 4 levels** in R1 (NOT read-only first) | Read-only = zero value (admin can't populate without dev DB touch); 2 extra days = real deliverable; D18 flow assertion meaningful only on CRUD; R2 "add CRUD" feels like incomplete-by-design. |
| Q3.a | **Per-tenant hierarchy** (every School/Faculty/Department/Program scoped to `tenantId`) | Phase A precedent; supports Compass multi-tenant evolution. |
| Q4.a | **Dual-column `nameFa` + `nameEn`** | Phase A precedent (University.nameFa + nameEn); owner controls both translations independently. |

**Locked scope: ~3,000 LOC, 5-7 day timeline.** Conscious tradeoff for deliverable-complete R1 vs scope-compressed-but-inert.

---

## Why this is R1

The Academic Hierarchy is the first additive expansion of the data model post-Gate-A. Phase A had 26 Prisma models; Phase B targets Compass full hierarchy of 62 models. R1 establishes the 4-level academic structure that all downstream models (Course, Cohort, Assessment, StudentApplication, …) reference:

**School → Faculty → Department → Program**

Without this hierarchy resolved, downstream models can't be properly normalized. R1 is the foundation block for the entire Phase B sequencing.

**Phase B deferred items revived:**
The Phase A B.1a (University + Semester) migration tables stayed in production DB as dormant additive structures per D44 (revert kept code OFF but DB ON). R1 must decide their fate — see Q1 below.

---

## Scope (R1)

### Data model (Prisma additive, no destructive changes)

```prisma
model School {
  id            String       @id @default(cuid())
  tenantId      String
  slug          String       // "ai", "engineering", "humanities"
  nameFa        String       // «دانشکده‌ی هوش مصنوعی»
  nameEn        String?
  shortCode     String?      // "SOAI"
  description   String?      @db.Text
  iconName      String?
  sortOrder     Int          @default(0)
  status        SchoolStatus @default(ACTIVE)
  charterDate   DateTime?

  // Audit fields (R4 lint enforcement)
  createdAt     DateTime     @default(now())
  createdBy     String?
  updatedAt     DateTime     @updatedAt
  updatedBy     String?
  deletedAt     DateTime?
  deletedBy     String?

  faculties     Faculty[]
  tenant        Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, slug])
  @@unique([tenantId, shortCode])
  @@index([tenantId, status])
}

model Faculty {
  // Existing Phase A Faculty model — augmented
  id            String        @id @default(cuid())
  // … existing fields preserved (additive only) …

  // NEW R1 fields:
  schoolId      String?       // nullable to preserve Phase A backward compat
  rankFa        String?       // «استاد», «دانشیار», «استادیار»
  rankEn        String?       // "Professor", "Associate Professor"

  departments   Department[]
  school        School?       @relation(fields: [schoolId], references: [id])

  @@index([schoolId])
}

model Department {
  id            String           @id @default(cuid())
  facultyId     String
  slug          String           // "ml", "robotics"
  nameFa        String           // «گروه یادگیری ماشین»
  nameEn        String?
  shortCode     String?
  description   String?          @db.Text
  status        DepartmentStatus @default(ACTIVE)
  sortOrder     Int              @default(0)

  // Audit fields
  createdAt     DateTime         @default(now())
  createdBy     String?
  updatedAt     DateTime         @updatedAt
  updatedBy     String?
  deletedAt     DateTime?
  deletedBy     String?

  programs      Program[]
  faculty       Faculty          @relation(fields: [facultyId], references: [id], onDelete: Cascade)

  @@unique([facultyId, slug])
  @@index([facultyId, status])
}

model Program {
  id            String        @id @default(cuid())
  departmentId  String
  slug          String        // "ml-masters", "robotics-phd"
  nameFa        String
  nameEn        String?
  shortCode     String?
  level         ProgramLevel  // ASSOCIATE / BACHELOR / MASTER / DOCTORATE / DIPLOMA
  durationMonths Int?         // typical duration
  creditTotal   Int?          // total credit units required
  description   String?       @db.Text
  status        ProgramStatus @default(ACTIVE)

  // Audit fields
  createdAt     DateTime      @default(now())
  createdBy     String?
  updatedAt     DateTime      @updatedAt
  updatedBy     String?
  deletedAt     DateTime?
  deletedBy     String?

  department    Department    @relation(fields: [departmentId], references: [id], onDelete: Cascade)

  @@unique([departmentId, slug])
  @@index([departmentId, status, level])
}

enum SchoolStatus { ACTIVE INACTIVE ARCHIVED }
enum DepartmentStatus { ACTIVE INACTIVE ARCHIVED }
enum ProgramStatus { ACTIVE INACTIVE ARCHIVED }
enum ProgramLevel { ASSOCIATE BACHELOR MASTER DOCTORATE DIPLOMA CERTIFICATE }
```

**Cascade semantics:**
- Tenant deletion → cascade to School (rare, admin-only)
- School deletion → cascade to Faculty rows that ONLY reference this school (Phase A flat-Faculty rows with `schoolId NULL` unaffected)
- Faculty deletion → cascade Department → cascade Program
- All deletions are SOFT (deletedAt timestamp), hard delete reserved for super_admin escape hatch with audit trail

### API endpoints (NestJS, audit-enforced)

```
School:
  GET    /v1/schools                              — list (tenant-scoped)
  GET    /v1/schools/:slug                        — single + nested faculties
  POST   /v1/schools                              — create  [@AuditAction]
  PATCH  /v1/schools/:id                          — edit    [@AuditAction]
  DELETE /v1/schools/:id                          — soft-delete [@AuditAction]

Faculty (nested resource):
  GET    /v1/schools/:schoolId/faculties          — list under school
  POST   /v1/schools/:schoolId/faculties          — create [@AuditAction]
  PATCH  /v1/faculties/:id                        — edit   [@AuditAction]
  DELETE /v1/faculties/:id                        — soft   [@AuditAction]

Department:
  GET    /v1/faculties/:facultyId/departments     — list under faculty
  POST   /v1/faculties/:facultyId/departments     — create [@AuditAction]
  PATCH  /v1/departments/:id                      — edit   [@AuditAction]
  DELETE /v1/departments/:id                      — soft   [@AuditAction]

Program:
  GET    /v1/departments/:deptId/programs         — list under dept
  POST   /v1/departments/:deptId/programs         — create [@AuditAction]
  PATCH  /v1/programs/:id                         — edit   [@AuditAction]
  DELETE /v1/programs/:id                         — soft   [@AuditAction]
```

All mutations use `@AuditAction` decorator — R4 audit-on-mutation lint enforces presence.

### Admin UI

Per Phase A R3 role differentiation, the admin role gets new sidebar items:

```ts
// apps/web/src/sidenav/SIDEBAR_BY_ROLE.ts (extended)
admin: [
  // existing items …
  { id: "academic", t: "ساختار آکادمیک", ic: "school", items: [
    { id: "schools",      t: "دانشکده‌ها",   route: "admin/schools" },
    { id: "faculties",    t: "هیأت‌ها",      route: "admin/faculties" },
    { id: "departments",  t: "گروه‌ها",       route: "admin/departments" },
    { id: "programs",     t: "برنامه‌ها",     route: "admin/programs" },
  ]},
]
```

**Pages (NEW):**
- `apps/web/src/pages/admin/SchoolsPage.tsx`
- `apps/web/src/pages/admin/FacultiesPage.tsx` (refactor existing or new view)
- `apps/web/src/pages/admin/DepartmentsPage.tsx`
- `apps/web/src/pages/admin/ProgramsPage.tsx`

Each follows the same pattern: list view + create/edit dialog + nested-resource breadcrumb (e.g., "School → Faculty → Department" path crumbs).

### Migration policy

Per Phase A retrospective lesson #7 + Compass cross-cutting policy, R1 establishes `docs/MIGRATION_POLICY.md` as the source of truth (see Q1 — separate pre-R1 task or inline?):

- Migrations are **additive only** (no `DROP COLUMN` / `ALTER COLUMN` on existing column)
- **Dual-write interceptor** required when legacy endpoints serve data the new model will own (`apps/api/src/modules/*/legacy-sync.service.ts`)
- Deprecated endpoints carry `Sunset: Wed, 31 Dec 2026 23:59:59 GMT` + `Deprecation: true` HTTP headers ≥ 4 sprints
- Every dual-write writes a `MigrationSyncLog` row (audit + rollback evidence)
- Drop schedule: Sprint N+0 add → N+1 frontend migrate → N+2 dev banner → N+3 verify zero legacy traffic → N+4 drop
- Shared types live in `packages/types/src/{school,faculty,department,program}.ts` — never duplicated

For R1, no dual-write is needed yet — School/Department/Program are brand-new models. Faculty already exists and gets an additive optional `schoolId` FK (existing rows unaffected). Dual-write pattern kicks in for R2 (CourseOffering migrating from Cohort, per Compass §Phase B).

### Tests (per D11 + D12 + D18)

**D12 visual contract** — `apps/web/tests/visual/phase-b-r1-academic-hierarchy.spec.ts`:
- Schools list page renders with 5+ seeded schools
- Each school card shows name (FA/EN), shortCode, status, faculty count
- Create dialog: opens, validates required fields, submits
- Edit dialog: pre-populates from existing data
- Soft-delete confirmation modal
- 4-level breadcrumb on Program create flow: «دانشکده‌ها / دانشکده هوش مصنوعی / گروه یادگیری ماشین / برنامه‌ها»

**D18 flow assertion** — same spec or separate `phase-b-r1-academic-hierarchy-flow.spec.ts`:
- Journey: admin login → /admin/schools → create School «نمونه» → drill into School → create Faculty «گروه نمونه» → drill into Faculty → create Department → drill into Department → create Program → return to top, verify chain visible → soft-delete School → cascade soft-deletes Faculty + Department + Program → all 4 disappear from default list → with `?includeDeleted=true` all 4 still retrievable

**API tests** — `apps/api/test/academic-hierarchy.e2e-spec.ts`:
- CRUD smoke for all 4 models
- Authorization (only super_admin/admin can mutate)
- AuditLog row written on every mutation
- Cascade soft-delete: School → Faculty → Department → Program
- Tenant isolation: tenant A's schools never visible to tenant B (per Q3 multi-tenancy decision)

### Estimated scope (post-D60 lock)

| File | LOC |
|---|---:|
| `apps/api/prisma/schema.prisma` | +180 (4 models + enums + indexes) |
| `apps/api/prisma/migrations/*_b1a_academic_hierarchy` | +120 (SQL DDL) |
| `apps/api/src/modules/academic-hierarchy/*` (4 controllers + 4 services + DTOs + module) | +650 |
| `apps/api/src/prisma/seed.ts` | +80 (seed 3 schools × 2 faculties × 2 depts × 2 programs = ~24 rows) |
| `apps/web/src/api/endpoints.js` | +90 (4 resource APIs) |
| `apps/web/src/pages/admin/{Schools,Faculties,Departments,Programs}Page.tsx` (**Q2.a FULL CRUD**) | **+1,200** (4 × ~300 each — list view + create dialog + edit dialog + soft-delete confirm + nested breadcrumb) |
| `apps/web/src/pages/admin/_shared/*` (CrudDialog + ConfirmDelete + FormField + ValidationToast — extracted to avoid 4× duplication) | +280 |
| `apps/web/src/sidenav/SIDEBAR_BY_ROLE.ts` (extend admin nav) | +20 |
| `apps/web/src/router.tsx` | +12 (4 route registrations, lazy-loaded) |
| `apps/api/test/academic-hierarchy.e2e-spec.ts` | +320 (Q2.a expands CRUD assertions: create/edit/delete per level + cascade soft-delete + audit row check) |
| `apps/web/tests/visual/phase-b-r1-academic-hierarchy.spec.ts` (D12 + D18 flow) | +240 (Q2.a journey: admin login → create School → create Faculty under it → create Department → create Program → return-to-list cascade soft-delete verifies all 4 hidden) |
| `docs/PHASE_B_R1_REVIEW.md` (post-ship) | +220 |

**Total: ~3,412 LOC.** Per Q1.a, `docs/MIGRATION_POLICY.md` is a **separate R0.5 pre-R1 task** (~160 LOC) — not included in R1 total above.

**Timeline:** 5-7 days for R1 (per D60 locked tradeoff).
**Above Compass §Phase B initial estimate of 800-1200 LOC** — the expansion is owner-acked under D60 (full-CRUD value > scope compression).

### Commit ordering (atomic, per Phase A retrospective lesson #1)

Per Q1.a, `MIGRATION_POLICY.md` ships as **R0.5 BEFORE R1 begins** — not a commit inside R1. R1 atomic commits (post-R0.5 + memo re-ack):

1. **Commit A** — Prisma schema (4 models + enums + indexes) + migration SQL + seed (3×2×2×2 = 24 rows)
2. **Commit B** — NestJS School module (controller + service + DTOs + audit decorators)
3. **Commit C** — NestJS Faculty module (controller + service + DTOs, with `schoolId` FK additive)
4. **Commit D** — NestJS Department + Program modules
5. **Commit E** — API e2e tests (`academic-hierarchy.e2e-spec.ts`) covering all 16 CRUD endpoints + cascade soft-delete + AuditLog assertions
6. **Commit F** — `endpoints.js` + shared `_shared/CrudDialog.tsx` + `ConfirmDelete.tsx` + `FormField.tsx` extracted (avoid 4× duplication)
7. **Commit G** — `SchoolsPage.tsx` full CRUD (list + create + edit + soft-delete + nested breadcrumb crumb #1)
8. **Commit H** — `FacultiesPage.tsx` + `DepartmentsPage.tsx` + `ProgramsPage.tsx` full CRUD (each with the appropriate breadcrumb depth)
9. **Commit I** — sidebar nav extension (`SIDEBAR_BY_ROLE.ts` admin items) + router registration (4 lazy routes) + role-based access guard (super_admin + admin only)
10. **Commit J** — D12 + D18 spec (full journey: login → create School → drill down 4 levels → soft-delete cascade verification)
11. **Commit K** — Review doc + pre-smoke evidence + D29 Chrome Extension verification screenshots

---

## Risks

1. **Schema migration on production with dormant B.1a tables** — see Q1. Mismanaged could leave DB in inconsistent state.
2. **Cascade soft-delete chains** — if School deletion cascades 100 Programs, the audit log gets 100 entries. Acceptable but needs batching for UI feedback.
3. **Faculty.schoolId backfill** — existing Faculty rows have no schoolId. Backfill strategy: leave null until admin manually assigns. Q2-acceptable if admin UI ships full CRUD.
4. **2,800-line scope blow-up** — see Q2. If admin UI scope reduced to read-only first iteration, total drops to ~1,800 (well within Compass §Phase B 800-1200 LOC sub-R budget).
5. **Multi-tenancy default behavior** — see Q3. Without an explicit decision, code defaults to per-tenant scoping which matches Phase A but may not match Compass intent.
6. **Persian-vs-English DB naming** — see Q4. Double-column (`nameFa` + `nameEn`) is the Phase A precedent; single-column with locale resolution is simpler but loses translation independence.

---

## What's OUT of scope for R1

- ❌ Course model (deferred to R2)
- ❌ CourseOffering dual-write from Cohort (R2)
- ❌ StudentApplication state machine (R3)
- ❌ InstructorApplication state machine (R3)
- ❌ Notification service v1 (R-Notif sub-R)
- ❌ Frontend display in student dashboard (Phase A dashboards untouched; admin-only UI in R1)
- ❌ Cross-tenant analytics (super_admin only, post-Phase B)

---

## Decisions log reference

All four Q-questions answered + locked under **D60** in `docs/PHASE_A_DECISIONS.md`. See the «🔒 Locked answers (D60)» block at the top of this memo. No remaining open questions for R1.

The single explicit override (Q2.a) is documented with owner rationale; the other three (Q1.a, Q3.a, Q4.a) match the memo defaults and the Phase A precedents.

---

## Verification plan (post-ack)

### Pre-deploy
- TypeScript clean
- `npm run typecheck` + `npm run test` green
- Prisma migrate dry-run on staging
- D12 spec green (12+ assertions)
- D18 spec green (full journey)
- Existing R-Landing-v2 + R7.x specs all still green (regression sweep)

### Post-deploy
- Chrome Extension D29 pre-smoke on `/admin/schools` + nested paths
- API e2e suite green
- AuditLog populated for every mutation
- No regression on Phase A R-Landing-v2 `/`, `/login`, `/dashboard`, `/classroom`

### D13 owner smoke (post-pre-smoke)
- Owner on real device + incognito + hard reload
- Login as super_admin
- Navigate `/admin/schools`, see 3 seeded schools
- (If Q2.a CRUD) Create a new school «دانشکده‌ی تست»
- Drill: School → Faculty → Department → Program (4-level breadcrumb visible)
- (If Q2.a CRUD) Soft-delete School → cascade → 4 rows gone
- Refresh — still gone (DB-backed)
- Sidebar nav: «ساختار آکادمیک» submenu visible only for admin role

---

## Status

| Item | Status |
|---|---|
| Memo (Q1-Q4 answers locked per D60) | ✅ this file |
| **Owner memo re-ack** (final review of locked scope) | ⏳ **pending** |
| `docs/MIGRATION_POLICY.md` (R0.5 — Q1.a separate pre-R1 task) | ⏳ post-memo-re-ack |
| R0.5 owner ack on migration policy | ⏳ post-R0.5 author |
| R1 code (this memo's atomic commits A-K) | ⏳ post-R0.5 ack |
| R1 D29 pre-smoke + D13 owner smoke | ⏳ post-deploy |
| Review doc `PHASE_B_R1_REVIEW.md` | ⏳ post-ship |

— Phase B kickoff, 2026-05-26. Phase A `phase-a-complete` tag in place. **Q1.a + Q2.a (override) + Q3.a + Q4.a locked under D60.** Awaiting owner memo re-review (final ack) before R0.5 starts.

**Re-ack format:** «memo OK, شروع R0.5» (or «memo OK، شروع» — any explicit affirmative).
If memo needs further changes, list them.
