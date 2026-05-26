# Phase B R1 — Academic Hierarchy (School + Faculty + Department + Program) — Memo

**Author:** Phase A → Phase B handoff (post-Gate-A close per D58/D59)
**Date:** 2026-05-26
**Status:** ⏳ DRAFT — awaiting owner ack + Q1-Q4 answers before code
**Workflow:** memo-then-code-then-test-then-D13 per D11 + Phase A retrospective lesson #1
**Compass Roadmap reference:** §Phase B — Academic Hierarchy + Onboarding (~3 weeks)

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

### Estimated scope

| File | LOC |
|---|---:|
| `apps/api/prisma/schema.prisma` | +180 (4 models + enums + indexes) |
| `apps/api/prisma/migrations/*_b1a_academic_hierarchy` | +120 (SQL DDL) |
| `apps/api/src/modules/academic-hierarchy/*` (4 controllers + 4 services + DTOs + module) | +650 |
| `apps/api/src/prisma/seed.ts` | +80 (seed 3 schools × 2 faculties × 2 depts × 2 programs = ~24 rows) |
| `apps/web/src/api/endpoints.js` | +90 (4 resource APIs) |
| `apps/web/src/pages/admin/{Schools,Faculties,Departments,Programs}Page.tsx` | +900 (4 × ~225 each) |
| `apps/web/src/sidenav/SIDEBAR_BY_ROLE.ts` (extend admin nav) | +20 |
| `apps/web/src/router.tsx` | +12 (4 route registrations, lazy-loaded) |
| `apps/api/test/academic-hierarchy.e2e-spec.ts` | +260 |
| `apps/web/tests/visual/phase-b-r1-academic-hierarchy.spec.ts` | +180 |
| `docs/MIGRATION_POLICY.md` (if Q1.inline) | +160 |
| `docs/PHASE_B_R1_REVIEW.md` (post-ship) | +220 |

**Total: ~2,872 lines** if `MIGRATION_POLICY.md` inline (Q1.b), or ~2,712 if separate pre-R1 task (Q1.a). Above Compass §Phase B initial estimate of 800-1200 LOC — see Q2 (admin UI scope) for the lever to compress.

### Commit ordering (atomic, per Phase A retrospective lesson #1)

1. Commit A — `docs/MIGRATION_POLICY.md` (if Q1.b inline) **OR** skip if Q1.a separate task
2. Commit B — Prisma schema (4 models + enums) + migration SQL + seed
3. Commit C — NestJS School module (controller + service + DTOs)
4. Commit D — NestJS Faculty + Department + Program modules
5. Commit E — API e2e tests
6. Commit F — `endpoints.js` + 4 admin pages + router registration
7. Commit G — sidebar nav extension + role-based access guard
8. Commit H — D12 + D18 specs
9. Commit I — review doc + pre-smoke evidence

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

## 4 open questions for owner ack

### Q1 — Migration policy doc: separate pre-R1 task or inline?

The `docs/MIGRATION_POLICY.md` needs to exist before the first dual-write (R2). Two options:

- **Q1.a — Separate pre-R1 task.** Author the doc in its own short sub-R (R0.5 maybe, ~160 lines + owner ack ~1 day). R1 starts assuming the policy is in place.
- **Q1.b — Inline in R1.** Author the doc as Commit A inside R1. Adds 160 lines to R1 scope but bundles the foundation work.

**Default proposed:** Q1.a — separate. Cleaner sub-R boundaries + the policy doc can be owner-reviewed independently.

### Q2 — Admin UI scope: full CRUD or read-only first iteration?

- **Q2.a — Full CRUD on all 4 levels.** ~900 LOC across 4 page files. Owner can create/edit/delete School/Faculty/Department/Program from R1 ship.
- **Q2.b — Read-only first iteration.** ~300 LOC across 4 read-only views. CRUD added in R1.x follow-up. Tighter scope, faster D13.

**Default proposed:** Q2.b — read-only first iteration. Aligns with Compass §Phase B incremental shape. CRUD becomes R1.b within 1-2 days post-R1.

### Q3 — Multi-tenancy: per-tenant or global hierarchy?

Compass Roadmap mentions multi-tenant as a placeholder; Phase A built the demo as single-tenant.

- **Q3.a — Per-tenant.** Each tenant has its own School hierarchy. `tenantId` on School (current proposed schema). Matches Phase A pattern.
- **Q3.b — Global hierarchy.** Single shared School/Faculty/Department/Program list across all tenants. Simpler queries, no `tenantId` FK on these tables.
- **Q3.c — Hybrid.** School can be either tenant-scoped OR global (via `tenantId NULL = global`). Most flexible, slightly more complex queries.

**Default proposed:** Q3.a — per-tenant. Phase A precedent + supports Compass multi-tenant evolution. Q3.c if owner foresees shared faculty across tenants soon.

### Q4 — Persian-vs-English DB naming convention?

- **Q4.a — Dual column** (`nameFa` + `nameEn`). Phase A precedent (e.g., University.nameFa + nameEn in the deferred B.1a). Each language stored independently.
- **Q4.b — Single column** with locale resolution (`name` field + i18n at the API layer or Accept-Language header). Simpler schema, harder to enforce both translations.

**Default proposed:** Q4.a — dual column. Phase A consistency + makes the «دانشکده‌ی…» / "School of…" round-trip explicit + easier admin UI for both names.

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
| Memo | ✅ this file |
| Owner ack | ⏳ pending — needs Q1-Q4 answers |
| `docs/MIGRATION_POLICY.md` | ⏳ Q1-gated (Commit A inline OR R0.5 separate) |
| Code | ⏳ NOT STARTED |
| Specs | ⏳ NOT STARTED |
| D29 pre-smoke | ⏳ NOT STARTED |
| Review doc | ⏳ post-ship |
| D13 owner smoke | ⏳ post-deploy |

— Phase B kickoff, 2026-05-26. Phase A `phase-a-complete` tag in place. Awaiting Q1-Q4 owner answers to begin.

**One-line ack format:** «Q1.a Q2.b Q3.a Q4.a شروع کن» (or letter combos).
