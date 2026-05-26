# Phase B R1 — Academic Hierarchy (School + Faculty) — Memo

**Author:** Phase A → Phase B handoff (post-Gate-A close per D59)
**Date:** 2026-05-26
**Status:** ⏳ DRAFT — awaiting owner ack before code
**Workflow:** memo-then-code-then-test-then-D13 per D11 + Phase A retrospective lesson #1
**Compass Roadmap reference:** §Phase B — Academic Hierarchy + Onboarding (~3 weeks)

---

## Why this is R1

Per Compass Roadmap §Phase B, the Academic Hierarchy is the first additive expansion of the data model. Phase A had 26 Prisma models; Phase B targets the Compass full hierarchy of 62 models. R1 starts with the two top-level structures that everything else hangs off:

- **School** (دانشکده) — top-level academic unit (e.g., "School of AI", "School of Engineering")
- **Faculty** (هیأت علمی) — research/teaching faculty within a school (currently Phase A has `Faculty` but as a flat lookup, not hierarchically nested under School)

Without School + Faculty hierarchy resolved, downstream models (Program, Course, Cohort, Department) can't be properly normalized.

**Phase B deferred items revived:**
- B.1a (University + Semester models) was deferred during R-Landing emergency per D44; the migration tables stayed in production DB as dormant additive structures. R1 makes a fresh decision: reinstate the dormant tables via a one-shot re-add migration (no-op vs the live DB) OR drop them and start clean. Owner decision needed at the start.

---

## Scope (R1)

### Data model (Prisma additive, no destructive changes)

```prisma
model School {
  id            String    @id @default(cuid())
  tenantId      String
  slug          String    // url-safe identifier, e.g., "ai", "engineering"
  nameFa        String    // «دانشکده‌ی هوش مصنوعی»
  nameEn        String?
  shortCode     String?   // "SOAI"
  description   String?   @db.Text
  iconName      String?   // reference to design system icon set
  sortOrder     Int       @default(0)
  status        SchoolStatus @default(ACTIVE)
  charterDate   DateTime?
  audit fields ... soft-delete

  faculties     Faculty[]
  programs      Program[]  // forward declaration for B.2

  tenant        Tenant     @relation(fields: [tenantId], references: [id])

  @@unique([tenantId, slug])
  @@unique([tenantId, shortCode])
  @@index([tenantId, status])
}

enum SchoolStatus { ACTIVE INACTIVE ARCHIVED }
```

```prisma
// Faculty model already exists in Phase A as flat lookup. R1 adds the
// nested-under-School foreign key. Backward compat: optional FK so existing
// rows are kept.
model Faculty {
  // existing Phase A fields stay
  id            String    @id @default(cuid())
  // ... existing fields ...

  // NEW R1 fields:
  schoolId      String?   // nullable to preserve backward compat
  rankFa        String?   // «استاد», «دانشیار», «استادیار»
  rankEn        String?   // "Professor", "Associate Professor"

  school        School?   @relation(fields: [schoolId], references: [id])

  @@index([schoolId])
}
```

### API endpoints (NestJS)

```
GET    /v1/schools                       — list schools (current tenant)
GET    /v1/schools/:slug                 — single school + nested faculties
POST   /v1/schools                       — create (admin only, audited)
PATCH  /v1/schools/:id                   — edit (admin only, audited)
DELETE /v1/schools/:id                   — soft-delete (admin only, audited)
GET    /v1/schools/:id/faculties         — list faculties under school
POST   /v1/schools/:id/faculties         — attach existing faculty to school (audited)
```

All mutation endpoints use `@AuditAction` decorator (R4 audit-on-mutation lint enforcement).

### Admin UI

`apps/web/src/pages/admin/SchoolsPage.tsx` (NEW) — list view + create/edit dialog + per-school faculty assignment widget.

Route: `/admin/schools` (PUBLIC + auth-gated as super_admin/admin role).

### Migration policy (per Phase A retrospective lesson #7 + Compass cross-cutting policy)

This R1 establishes `docs/MIGRATION_POLICY.md` as the source of truth for additive + dual-write migrations:

- Migrations are **additive only** (no `DROP COLUMN` / `ALTER COLUMN` on existing column).
- If a legacy Phase A endpoint serves data this new model will own, ship a **dual-write interceptor** (`apps/api/src/modules/*/legacy-sync.service.ts`).
- Deprecated endpoints carry `Sunset: Wed, 31 Dec 2026 23:59:59 GMT` + `Deprecation: true` HTTP headers for 4 sprints minimum.
- Every dual-write writes a `MigrationSyncLog` row for audit + rollback evidence.
- Old + new endpoint tests both green during deprecation window.

For R1, no dual-write is needed yet — School is a brand-new model. The dual-write pattern kicks in for R2 (CourseOffering migrating from Cohort).

### Tests (per D11 + D12 + D18)

**D12 visual contract** — `apps/web/tests/visual/phase-b-r1-schools.spec.ts`:
- Schools list page renders all schools with name, icon, status
- Create dialog opens, validates required fields, submits
- Edit dialog pre-populates from existing data
- Delete dialog confirms before soft-delete

**D18 flow assertion** — `apps/web/tests/visual/phase-b-r1-schools-flow.spec.ts`:
- Journey: admin logs in → /admin/schools → creates a School → assigns a Faculty → edits School → soft-deletes School → School disappears from list but is retrievable via `?includeDeleted=true`

**API tests** — `apps/api/test/schools.e2e-spec.ts`:
- CRUD smoke
- Authorization (only super_admin/admin can mutate)
- AuditLog row written on every mutation
- Soft-delete leaves the row in DB but `findAll` excludes by default

### Estimated lines

| File | LOC |
|---|---:|
| `apps/api/prisma/schema.prisma` | +50 (School model + Faculty nesting) |
| `apps/api/prisma/migrations/*_b1a_schools` | +35 (SQL DDL) |
| `apps/api/src/modules/schools/*` (controller + service + DTOs + module) | +250 |
| `apps/api/src/prisma/seed.ts` | +30 (seed 5-6 demo schools) |
| `apps/web/src/api/endpoints.js` | +35 (schoolsApi) |
| `apps/web/src/pages/admin/SchoolsPage.tsx` | +280 |
| `apps/web/src/router.tsx` | +5 (route registration) |
| `apps/api/test/schools.e2e-spec.ts` | +140 |
| `apps/web/tests/visual/phase-b-r1-schools.spec.ts` | +90 |
| `apps/web/tests/visual/phase-b-r1-schools-flow.spec.ts` | +80 |
| `docs/MIGRATION_POLICY.md` | +160 |
| `docs/PHASE_B_R1_REVIEW.md` | +180 (post-ship) |

**Total: ~1,335 lines.** Within Compass §Phase B budget (B.1 estimate 800-1200 LOC; this slightly above due to MIGRATION_POLICY doc + flow spec — owner can split if needed).

### Commit ordering (atomic, per Phase A retrospective lesson #1)

1. Commit A — `docs/MIGRATION_POLICY.md` (the prerequisite doc)
2. Commit B — Prisma School model + migration SQL + Faculty schoolId fk
3. Commit C — NestJS Schools module (controller + service + DTOs)
4. Commit D — seed + e2e API test
5. Commit E — admin/SchoolsPage.tsx + endpoints.js + router registration
6. Commit F — D12 + D18 specs
7. Commit G — review doc + pre-smoke evidence

---

## Pre-conditions (owner decisions needed)

Per Phase A retrospective lesson #10 (scope creep red flags), the following ambiguities need explicit owner ack before code:

### Q1 — Phase A B.1a dormant tables resolution

Per D44, the deferred Phase A B.1a migration created `University` + `Semester` tables in production DB; the code was reverted but the migration is still applied. Two options:

- **Q1.a — Reinstate the migration file** (Prisma `migrate deploy` is a no-op since DB already has it). University + Semester models become R1 prerequisites (and R1 scope expands slightly to wire them).
- **Q1.b — Drop the dormant tables manually** before R1 starts, then R1 introduces them fresh. Cleaner audit trail.

**Default proposed:** Q1.a — reinstate. Less data loss risk; the tables are already there + empty.

### Q2 — School ↔ Department relationship

Compass Roadmap mentions both School and Department. Some universities use them as different levels (School > Department), others use them interchangeably. Q for owner:

- **Q2.a — School only** (Department subsumed into School). Simpler hierarchy.
- **Q2.b — School + Department both** (full 4-level hierarchy: School > Department > Program > Course). Closer to Compass full spec but adds complexity in R1.

**Default proposed:** Q2.a — School only for R1. Department can be added as R1.x if needed once data shape matures.

### Q3 — Faculty rank vocabulary

Faculty.rankFa values: «استاد», «دانشیار», «استادیار», «مربی», «هیأت علمی». Owner preferred order + which are bundled at MVP?

**Default proposed:** all 5 plus null (unranked). Render in dropdown ordered by seniority.

---

## Risks

1. **Schema drift if Q1.b chosen** — dropping tables requires DBA action on production. Risky if any data accidentally landed there. Default Q1.a avoids this.
2. **B.1a model name collision** — University and Semester from D44 era have specific schemas. If Q1.a chosen, R1 might need to namespace differently or accept the legacy shape. Audit at first commit.
3. **Faculty schoolId backfill** — existing Faculty rows have no schoolId. Backfill strategy: leave null (allowed by schema) until owner sees the data and assigns manually. R1 doesn't auto-assign.
4. **Migration policy doc scope creep** — `docs/MIGRATION_POLICY.md` could grow into a 500-line spec. Cap at 160 lines + reference Compass cross-cutting policy.

---

## What's OUT of scope for R1

- ❌ Program model (deferred to R2)
- ❌ Course model (deferred to R2 + dual-write from Cohort)
- ❌ Department model (deferred if Q2.b chosen)
- ❌ StudentApplication state machine (deferred to R3)
- ❌ Notification service (deferred to R-Notif)
- ❌ Frontend display of school in student dashboard (Phase A dashboards stay untouched; admin-only UI in R1)

---

## Verification plan

### Pre-deploy
- TypeScript clean
- `npm run typecheck` + `npm run test` green
- Prisma migrate dry-run on staging
- D12 spec green (10 assertions)
- D18 spec green (full journey)

### Post-deploy
- Chrome Extension D29 pre-smoke on `/admin/schools`
- API e2e suite green
- AuditLog populated for every create/edit/delete
- No regression on R-Landing-v2 `/`, /login, /dashboard, /classroom

### D13 owner smoke (post-pre-smoke)
- Owner on real device + incognito + hard reload
- Login as super_admin
- Navigate `/admin/schools`, see 5-6 seeded schools
- Create a new school «دانشکده‌ی تست»
- Edit it, change name
- Soft-delete it
- Re-list — gone from default view
- Refresh — still gone (DB-backed, not in-memory)

---

## Open questions for owner (3 max, default-acceptable)

| Q | Default |
|---|---|
| Q1 — B.1a dormant tables resolution | Q1.a (reinstate) |
| Q2 — School + Department or School only | Q2.a (School only for R1) |
| Q3 — Faculty rank vocabulary | 5 ranks + null, ordered by seniority |

**One-line ack format:** «Q1.a Q2.a Q3.default شروع کن» (or letter triples).

---

## Status

| Item | Status |
|---|---|
| Memo | ✅ this file |
| Owner ack | ⏳ pending |
| `docs/MIGRATION_POLICY.md` | ⏳ Commit A pending ack |
| Code | ⏳ NOT STARTED |
| Spec | ⏳ NOT STARTED |
| D29 pre-smoke | ⏳ NOT STARTED |
| Review doc | ⏳ post-ship |

— Phase B kickoff, 2026-05-26. Phase A `phase-a-complete` tag in place. Awaiting Q1/Q2/Q3 ack to begin Commit A (`docs/MIGRATION_POLICY.md`).
