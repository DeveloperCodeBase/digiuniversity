# Phase B R2 — Cohort → CourseOffering Migration — Memo

**Author:** Phase B post-R1-D13 (D64)
**Date:** 2026-05-26
**Status:** ⏳ DRAFT — awaiting owner ack + Q1-Q4 answers before code
**Workflow:** memo → owner ack → code → spec → deploy → D29 pre-smoke → D13 owner smoke → close (D61 Constraint #1)
**Compass Roadmap reference:** §Phase B — Academic Hierarchy + Onboarding (~3 weeks). Specifically: "Add `CourseOffering` … Dual-write interceptor per migration."

---

## R1 lessons applied to R2 memo

**Lesson #1 — schema discovery BEFORE memo lock (the surprise that triggered D63):** done in this memo. Pre-write inspection of `apps/api/prisma/schema.prisma` confirms what exists vs greenfield:

| Model | State | R2 action |
|---|---|---|
| `Cohort` (lines 375-398) | **EXISTS** with `slug + programId + name + startDate + endDate` | Source for §5 rename. NOT deleted in R2. |
| `Enrollment` (lines 400+) | **EXISTS** with `cohortId String? @relation(... onDelete: SetNull)` | Will get additive `offeringId String?` FK; dual-write keeps both populated. |
| `Course / CourseModule / Lesson` (lines 299-373) | **EXISTS** | Untouched in R2 (R3 candidate territory). |
| `CourseOffering` | **NOT in schema** — truly greenfield | New model per §2 + dual-write source per §3+§5. |
| `Profile / Student / Instructor` | **NOT in schema** | Deferred to R3+ (identity track). |
| `University / Semester` | **NOT in source** (D44 reverted), tables dormant in production DB | Out of R2 scope. May intersect: if CourseOffering wants `semesterId` FK, see Q2. |

**Lesson #2 — 4-model assumption check:** R2 is single-model migration (Cohort → CourseOffering). Confirmed: only `Enrollment` references `Cohort` directly. Blast radius = 1 downstream model + 1 admin UI page + 1 set of API endpoints.

**Lesson #3 — Performance budget pre-commit per D61 Constraint #2:** R2 admin UI is the new `CourseOfferingsPage.tsx`. Approach: extend the existing `admin-academic` Vite manualChunks bucket (R1's pattern) rather than create a new chunk. Expected admin chunk delta: ~10-15 KB. Main bundle delta target still < 50 KB (likely 0).

---

## Why R2 = Cohort → CourseOffering

Three Compass-roadmap candidates for R2 considered:

| Candidate | Pros | Cons | Verdict |
|---|---|---|---|
| **Cohort → CourseOffering** | First practical MIGRATION_POLICY §3 + §5 + dual-write usage. Existing model needing evolution per Compass. Reasonable single-sub-R scope. Tests rollback caveat discipline (D44). | Higher complexity than greenfield-only sub-R. Dual-write interceptor + Sunset headers add testing surface. | ✅ **R2** |
| **Course + Module + Lesson hierarchy** | All 3 models exist; could be a fields-additive sub-R. Content-side work. | Lower strategic urgency (content authoring is later in Compass than identity). Greenfield-shaped, doesn't test dual-write. | R3 candidate |
| **Profile + Student + Instructor identity** | Unblocks StudentApplication state machine (R3 of R4). Foundation for Compass §B onboarding theme. | Bigger scope (3 new identity models + integration with existing User). Doesn't establish migration discipline. | R3 or R4 candidate |

**Decision: R2 = Cohort → CourseOffering.** Rationale:
1. **First practical MIGRATION_POLICY exercise.** R0.5 documented the policy; R2 USES it. Discipline established now means easier R3+.
2. **Compass-aligned.** Compass §Phase B explicitly lists CourseOffering as the first additive identity model.
3. **Right scope.** ~2,500-3,500 LOC, 5-7 days. Comparable to R1.
4. **Blast radius mapped.** Only Enrollment + 1 admin UI page touch other code; the rest of the 26-model graph unaffected.
5. **Validates §10 rollback caveat in advance.** When the eventual «drop Cohort» step ships in R-Cohort-Sunset (sprint N+4), the precedent is set here.

---

## Scope (R2, post-Q1-Q4 ack)

### Data model

**New: `CourseOffering` (greenfield per §2):**

```prisma
model CourseOffering {
  id            String              @id @default(cuid())
  tenantId      String
  programId     String
  slug          String
  name          String              // Persian primary (Phase A precedent)
  nameEn        String?             // English mirror per D63 Q4.a spirit
  shortCode     String?             // e.g. "CS101-F1404"
  startDate     DateTime?
  endDate       DateTime?

  // R2-NEW richer fields not in legacy Cohort (Q2-gated):
  // capacity      Int?               // max enrolled
  // instructorId  String?            // FK to User with instructor role
  // mode          OfferingMode       // SYNCHRONOUS / ASYNCHRONOUS / HYBRID

  // Cohort linkage during dual-write window:
  legacyCohortId String?            @unique  // links 1:1 to the mirrored Cohort row

  status        OfferingStatus      @default(SCHEDULED)
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt
  deletedAt     DateTime?
  createdBy     String?
  updatedBy     String?

  tenant        Tenant              @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  program       Program             @relation(fields: [programId], references: [id], onDelete: Cascade)
  enrollments   Enrollment[]        @relation("EnrollmentToOffering")
  legacyCohort  Cohort?             @relation(fields: [legacyCohortId], references: [id])

  @@unique([tenantId, slug])
  @@index([tenantId, status])
  @@index([programId, status])
  @@index([tenantId, deletedAt])
}

enum OfferingStatus { SCHEDULED OPEN ACTIVE COMPLETED CANCELED }
enum OfferingMode   { SYNCHRONOUS ASYNCHRONOUS HYBRID }
```

**Additive on `Enrollment` (§4 — backward-compat, both FKs nullable for dual-write window):**
```prisma
model Enrollment {
  // existing fields preserved
  offeringId String?                  // NEW, nullable for migration window
  offering   CourseOffering? @relation("EnrollmentToOffering", fields: [offeringId], references: [id], onDelete: SetNull)
  // existing cohortId stays — dual-write keeps both populated
}
```

**Additive on `Cohort` (§4 — back-reference for §5 stage tracking):**
```prisma
model Cohort {
  // existing fields preserved
  upgradedToOfferingId String?  // NEW, nullable. Set when CourseOffering is created from this Cohort row.
}
```

### Dual-write interceptor (§1 + §3)

```ts
// apps/api/src/university/course-offerings/legacy-sync.service.ts
@Injectable()
export class CohortLegacySyncService {
  constructor(private readonly prisma: PrismaService) {}

  async onOfferingCreate(offering: CourseOffering) {
    // Mirror to legacy Cohort row for the dual-write window.
    const cohort = await this.prisma.cohort.create({
      data: {
        tenantId: offering.tenantId,
        programId: offering.programId,
        slug: offering.slug + "-mirror",
        name: offering.name,
        startDate: offering.startDate,
        endDate: offering.endDate,
        createdBy: offering.createdBy,
        updatedBy: offering.updatedBy,
      },
    });
    await this.prisma.courseOffering.update({
      where: { id: offering.id },
      data: { legacyCohortId: cohort.id },
    });
    await this.prisma.cohort.update({
      where: { id: cohort.id },
      data: { upgradedToOfferingId: offering.id },
    });
    await this.prisma.migrationSyncLog.create({
      data: {
        source: "CourseOffering",
        target: "Cohort",
        rowId: offering.id,
        syncedAt: new Date(),
      },
    });
  }

  async onOfferingUpdate(offering: CourseOffering) { /* mirror non-status fields */ }
  async onOfferingSoftDelete(offering: CourseOffering) { /* mirror deletedAt */ }
}
```

**MigrationSyncLog** is also a new tiny model (per §1 — needed before first dual-write):
```prisma
model MigrationSyncLog {
  id         String   @id @default(cuid())
  source     String   // "CourseOffering"
  target     String   // "Cohort"
  rowId      String
  syncedAt   DateTime @default(now())
  @@index([source, target, syncedAt])
}
```

### API endpoints

```
GET    /v1/offerings                              — list (tenant-scoped)
GET    /v1/offerings/:id                          — single + nested program
GET    /v1/programs/:programId/offerings          — nested under program
POST   /v1/offerings                              — create  [@AuditAction("offering.create")] + dual-write
PATCH  /v1/offerings/:id                          — edit    [@AuditAction("offering.update")] + dual-write
DELETE /v1/offerings/:id                          — soft    [@AuditAction("offering.soft_delete")] + dual-write
```

Legacy `GET /v1/cohorts` and write endpoints:
- Reads stay alive (Stage 1 of §5 — frontend still reads `cohorts`).
- Writes stay alive with `Sunset: Wed, 31 Dec 2026 23:59:59 GMT` + `Deprecation: true` headers.
- Frontend admin UI for Cohorts: marked "Legacy view" in R2; replaced by Offerings page (Q4).

### Admin UI

Add `CourseOfferingsPage.tsx` to the existing admin-academic chunk (no new manualChunks bucket needed per R1 precedent):

```
apps/web/src/pages/admin/OfferingsPage.tsx     — full CRUD per D60 Q2.a default
```

**Sidebar nav** (extend `SIDEBAR_BY_ROLE.ts admin.academic.items`):

```ts
{ id: "offerings", t: "ارائه‌های درس", route: "admin/offerings" }
```

Inside Offerings page: status pill (SCHEDULED/OPEN/ACTIVE/...), program link, dates, instructor (if Q2.a richer), capacity, enrollment count.

### Tests (D12 + D18)

**D12 visual** — `apps/web/tests/visual/phase-b-r2-course-offerings.spec.ts`:
- list page renders with 3 seeded offerings
- card shows name + status pill + program link + enrollment count
- create dialog: opens, validates, submits
- edit dialog: pre-populates
- soft-delete confirm modal

**D18 flow** — same spec or separate file, **state machine focus**:

R2 is the **first sub-R that touches a state field** (`OfferingStatus`). D18 flow covers:
- Create offering → starts at `SCHEDULED`
- Patch status → `OPEN` (admin action; opens registration)
- Patch status → `ACTIVE` (start date passes; future: cron, R2.5)
- Patch status → `COMPLETED` (end date passes)
- Verify illegal transition rejected (`ACTIVE` → `SCHEDULED` returns 400)
- Soft-delete at any status → row hidden but `?includeDeleted=true` returns it

**Dual-write verification** — `apps/api/test/course-offerings.e2e-spec.ts`:
- POST /offerings → check Cohort mirror row exists with linked `legacyCohortId`
- PATCH /offerings → both rows updated
- DELETE /offerings → both rows soft-deleted
- MigrationSyncLog row written on every dual-write
- Direct Cohort writes still work (legacy endpoint backward compat)

### Performance budget per D61 Constraint #2

- R2 admin UI = 1 new page (`OfferingsPage.tsx` ~280 LOC). Extends existing `admin-academic` chunk; no new chunk.
- Expected `admin-academic-*.js` delta: +10-15 KB.
- Expected main `index-*.js` delta: 0 (admin chunk is separate by R1's R7.1.b lazy pattern).
- Asset-weight check in `PHASE_B_R2_REVIEW.md` per precedent.
- If main delta > 50 KB: diagnose before D13.

---

## Estimated scope

| File | LOC |
|---|---:|
| `apps/api/prisma/schema.prisma` | +90 (CourseOffering + 2 enums + Enrollment additive + Cohort additive + MigrationSyncLog) |
| `apps/api/prisma/migrations/*_phase_b_r2_course_offering` | +80 (CREATE TABLE + ALTER TABLE + indexes) |
| `apps/api/src/university/course-offerings/*` (controller + service + DTOs + dual-write interceptor + module) | +520 |
| `apps/api/src/university/cohorts/cohorts.controller.ts` (add Sunset+Deprecation headers + state guard) | +60 |
| `apps/api/src/prisma/seed.ts` | +50 (seed 3 offerings linked to existing programs) |
| `apps/api/test/course-offerings.e2e-spec.ts` | +320 (CRUD + dual-write + state transitions + cascade) |
| `apps/web/src/api/endpoints.js` | +50 (offeringsApi: list / get / create / update / softDelete) |
| `apps/web/src/pages/admin/OfferingsPage.tsx` | +280 (Q2.a full CRUD per R1 precedent) |
| `apps/web/src/sidenav/SIDEBAR_BY_ROLE.ts` | +6 (admin academic.items extension) |
| `apps/web/src/router.tsx` | +4 (lazy route registration) |
| `apps/web/tests/visual/phase-b-r2-course-offerings.spec.ts` | +220 (D12 + D18 state-transition flow) |
| `docs/PHASE_B_R2_REVIEW.md` (post-ship) | +200 |

**Total: ~1,880 LOC.** Tighter than R1 (~3,000) because R2 reuses R1's admin shared components (`CrudDialog`, `ConfirmDelete`, `FormField`).
**Timeline: 5-7 days** (consistent with R1 baseline).

### Commit ordering (atomic, per D61 Constraint #1)

1. **Commit A** — Prisma schema (CourseOffering + 2 enums + MigrationSyncLog + Enrollment.offeringId additive + Cohort.upgradedToOfferingId additive) + migration SQL + seed
2. **Commit B** — NestJS CourseOfferings module (controller + service + DTOs + state-transition validator) + audit decorators
3. **Commit C** — `CohortLegacySyncService` (dual-write interceptor) + wire into CourseOfferings module
4. **Commit D** — Cohorts controller: add `Sunset` + `Deprecation` response headers on write endpoints
5. **Commit E** — API e2e tests (CRUD + state machine + dual-write + cascade)
6. **Commit F** — `endpoints.js` + reuse R1's `_shared/{CrudDialog, ConfirmDelete, FormField}.tsx`
7. **Commit G** — `OfferingsPage.tsx` full CRUD + state pill UI + program link breadcrumb
8. **Commit H** — sidebar nav extension + router registration + admin-only access guard
9. **Commit I** — D12 + D18 spec covering state-machine transitions + dual-write assertion
10. **Commit J** — review doc + pre-smoke evidence + bundle-delta measurement

10 commits (R1 had 11; R2 saves one by reusing `_shared` components).

---

## Risks

1. **Dual-write race condition.** If two requests create offerings with the same slug simultaneously, the Cohort mirror could collide on slug-mirror. Mitigation: unique `legacyCohortId` constraint on offering side, transactional Prisma write, idempotent retry on error.
2. **`Enrollment.cohortId` vs `Enrollment.offeringId` split-brain.** During the dual-write window, enrollments may be created against either FK. Mitigation: enrollment creation always populates BOTH FKs if both exist; controller-level guard. Documented in `MIGRATION_POLICY` §5 Stage 2 anyway.
3. **State transition validator complexity.** OfferingStatus has 5 values + transition rules. If owner asks for richer transitions (cron-based, instructor-triggered), scope creep. Mitigation: R2 ships manual admin-driven transitions only; cron + auto-status = R2.5 follow-up sub-R.
4. **Cohort UI legacy-page question (Q4).** If owner wants single merged "Offerings" page that hides Cohorts entirely, that's bigger UI scope (merge + filter UX). Q4 below.
5. **R1 still recent — admin chunk bundle bloat risk.** R1 admin chunk is 37 KB. R2 adds ~12 KB → 49 KB admin chunk. Still under main 50 KB budget but admin chunk doubled. Monitor.

---

## What's OUT of scope for R2

- ❌ Cohort hard-delete migration (§5 Stage 3 — R-Cohort-Sunset sub-R at sprint N+4)
- ❌ Cron-based status transitions (R2.5 candidate)
- ❌ Instructor assignment (Q2 conditional)
- ❌ Capacity enforcement at enrollment time
- ❌ Profile/Student/Instructor identity models (R3+)
- ❌ Notification on offering state change (R-Notif sub-R)

---

## 4 open questions for owner ack

### Q1 — Scope confirm: R2 = Cohort → CourseOffering, or pick different R2?

- **Q1.a — R2 = Cohort → CourseOffering** (recommended; this memo). Establishes dual-write discipline, Compass-aligned.
- **Q1.b — R2 = Course + Module + Lesson additive enrichment.** Greenfield-shaped, simpler scope, but doesn't test dual-write.
- **Q1.c — R2 = Profile + Student + Instructor identity.** Unblocks state machines, but bigger scope (3 new models).

**Default proposed:** Q1.a — Cohort → CourseOffering.

### Q2 — CourseOffering shape: same as Cohort, or richer?

- **Q2.a — Same as Cohort** (slug + program + name + dates). Minimal-disruption rename; UI parity.
- **Q2.b — Richer (capacity + instructorId + mode enum).** Compass-aligned (offerings have more semantics than cohorts); R2 ships more value.

**Default proposed:** Q2.b — richer. The `capacity` + `mode` fields are foundational for R3+ enrollment logic. `instructorId` is a `User` FK with role check — adds 5-10 LOC of validation. Worth it.

If Q2.b: `OfferingMode` enum (SYNCHRONOUS/ASYNCHRONOUS/HYBRID) + `capacity Int?` + `instructorId String?` with FK to User (validated instructor role).

### Q3 — Dual-write timing: all in R2, or split R2.A (additive) + R2.B (dual-write activation)?

- **Q3.a — All in R2.** Ship CourseOffering + dual-write interceptor + Cohort sunset headers in single sub-R. Establishes pattern in one cycle.
- **Q3.b — Split R2.A (additive CourseOffering only) + R2.B (dual-write activation).** Smaller incremental sub-Rs, easier rollback per stage.

**Default proposed:** Q3.a — all in R2. Per R1 precedent (full CRUD in one sub-R), split-by-default = ناقص-by-design feeling (D60 reasoning).

### Q4 — Existing Cohort admin UI: keep dual-page, merge, or hide?

- **Q4.a — Keep both pages.** `/admin/cohorts` (legacy view) + `/admin/offerings` (new). Owner sees both during transition; eventually `/admin/cohorts` deprecated.
- **Q4.b — Merge into single "Offerings" page.** Hide Cohort UI; admin only sees offerings. Cohort rows still mirrored in DB but invisible to admin.
- **Q4.c — Hide Cohort page on R2 ship.** No legacy admin view; only `/admin/offerings` from day 1.

**Default proposed:** Q4.a — keep both. Lets owner verify dual-write works (see same data in both views during transition). Cohort page gets "Legacy — مدیریت کنید از طریق ارائه‌ها" banner. Removed in R-Cohort-Sunset sub-R.

---

## Verification plan

### Pre-deploy
- TypeScript clean
- `npm run typecheck` + `npm run test` green
- Prisma migrate dry-run on staging
- D12 + D18 spec green
- All Phase A + R1 regression specs green
- Bundle delta measurement: admin-academic chunk + main bundle

### Post-deploy
- Chrome Extension D29 pre-smoke on `/admin/offerings` + state-transition smoke
- API e2e suite green
- AuditLog populated for every offering mutation
- MigrationSyncLog populated for every dual-write
- No regression on Phase A R-Landing-v2 routes + R1 admin pages

### D13 owner smoke
- Owner real device + incognito + hard reload
- Login as admin → `/admin/offerings` shows 3 seeded offerings
- Create new offering → status SCHEDULED → transition to OPEN → save
- Verify in `/admin/cohorts` (if Q4.a) that mirror Cohort row exists
- Drill: offering → linked program → linked department → linked faculty → linked school (full breadcrumb chain through R1)
- Soft-delete offering → mirror Cohort also soft-deleted
- Student login: no Offerings sidebar item visible (access guard)
- All non-admin routes (/, /login, /dashboard, /classroom) untouched

---

## Status

| Item | Status |
|---|---|
| Memo | ✅ this file |
| Schema discovery done | ✅ Cohort + Enrollment + Course inspected pre-write |
| R1 lessons applied | ✅ #1 discovery / #2 assumption check / #3 perf budget |
| **Owner ack + Q1-Q4 answers** | ⏳ **pending** |
| Code | ⏳ post-ack |
| Specs | ⏳ post-ack |
| D29 pre-smoke | ⏳ post-deploy |
| Review doc | ⏳ post-ship |
| D13 owner smoke | ⏳ post-deploy |

— Phase B R2 kickoff, 2026-05-26. R1 closed (D64). Awaiting Q1-Q4 ack to begin code.

**One-line ack format:** «Q1.a Q2.b Q3.a Q4.a شروع کن» (or letter combos).
