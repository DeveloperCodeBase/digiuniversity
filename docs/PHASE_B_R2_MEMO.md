# Phase B R2 — Memo (CourseOffering additive model + dual-write from Cohort)

## Header

- **B.1 closed** 2026-05-24 (B.1a + B.1b shipped; review at `docs/PHASE_B_R1_REVIEW.md`).
- **B.2 is the second Phase B sub-R per `docs/PHASE_B_MEMO.md`.** Compass-roadmap goal: introduce `CourseOffering` (Course × Semester × Instructor) as the canonical "a specific run of a course in a specific term" record, and dual-write from the existing `Cohort` records so legacy code paths continue working during the migration window.
- **Policy carry-over:** additive-only schema, dual-write interceptors, `Sunset` + `Deprecation` headers on any newly-deprecated endpoint, MigrationSyncLog write on every dual-write, no destructive changes to Phase A or B.1 surfaces.

## Goal — single sentence

Introduce `CourseOffering` model (linking Course + Semester + primary Instructor) as the future canonical "course run" record; populate it from existing `Cohort` records via dual-write; expose CRUD endpoints + read-only admin UI; keep the existing `/v1/cohorts` endpoint intact with a `Sunset` header for Sprint N+4 drop.

## Why this matters

The current `Cohort` model is a leftover from the original platform's "people-grouped-by-program" abstraction. The Compass roadmap moved to a **course-offering** abstraction (per industry standard LMS schemas like OneRoster 1.2):

| Concept | Old (Cohort) | New (CourseOffering) |
|---|---|---|
| Granularity | per program-cohort | per (course, semester, section) |
| Time-anchor | implicit via cohort.year/term | explicit via Semester FK |
| Instructor | n/a (instructor on per-class basis) | primary Instructor FK |
| Enrollment | many students, one cohort | many students, one offering |
| Lifecycle | active/archived | upcoming/open/active/closed/archived |
| Section A/B/C | not supported | first-class `section` field |

Phase C (Core Learning Loop) needs CourseOffering as the anchor for Assignment / Quiz / Grade items. B.2 ships the foundation; B.3 (Profile + Student + Instructor) supplies the people graph.

## Schema additions (additive only)

```prisma
model CourseOffering {
  id             String   @id @default(cuid())
  tenantId       String
  courseId       String   // FK to existing Course
  semesterId     String   // FK to new Semester (B.1a)
  instructorId   String?  // FK to User (until Phase B.3 splits Profile)
  section        String   @default("A") // A | B | C | … per section letter
  capacity       Int?     // null = unbounded (default)
  enrolled       Int      @default(0) // denormalized count, updated by Enrollment dual-write
  status         String   @default("upcoming") // upcoming | open | active | closed | archived
  syllabusUrl    String?  // optional cdn link to syllabus PDF (Phase C populates)

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?
  createdBy String?
  updatedBy String?

  tenant     Tenant     @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  course     Course     @relation(fields: [courseId], references: [id], onDelete: Cascade)
  semester   Semester   @relation(fields: [semesterId], references: [id], onDelete: Cascade)
  instructor User?      @relation("CourseOfferingInstructor", fields: [instructorId], references: [id])
  // Phase C will add: assignments, quizzes, grade items, enrollments

  @@unique([courseId, semesterId, section])
  @@index([tenantId])
  @@index([courseId])
  @@index([semesterId])
  @@index([deletedAt])
}

// MigrationSyncLog — write per dual-write event (audit trail for the
// Sprint N+0 → N+4 drop window).
model MigrationSyncLog {
  id           String   @id @default(cuid())
  tenantId     String
  fromModel    String   // e.g., "Cohort"
  fromId       String
  toModel      String   // e.g., "CourseOffering"
  toId         String
  syncedAt     DateTime @default(now())
  direction    String   // "legacy_to_new" | "new_to_legacy"
  payload      Json?    // optional diff snapshot
  @@index([tenantId, fromModel, syncedAt])
}
```

**Tenant relation update:**
```prisma
// In Tenant model — add:
courseOfferings  CourseOffering[]
migrationSyncLogs MigrationSyncLog[]
```

**User relation update:**
```prisma
// In User model — add:
courseOfferingsAsInstructor CourseOffering[] @relation("CourseOfferingInstructor")
```

## Dual-write strategy

Three integration points:

### A. On Cohort create/update — populate CourseOffering

Add a NestJS interceptor `CohortToCourseOfferingSyncInterceptor` that:
- After every `POST /v1/cohorts` or `PATCH /v1/cohorts/:id`, kicks off an async job (in-process Promise — no queue infra yet).
- Job creates or updates the matching CourseOffering. Mapping: Cohort.program → first Course in that program; Cohort.startDate → first matching Semester; Cohort.lead → instructor.
- Writes a MigrationSyncLog row with direction `"legacy_to_new"`.

If the mapping is ambiguous (e.g., a Cohort spans multiple Courses), skip the sync + log a warning. This is acceptable for the migration window.

### B. On CourseOffering create/update — populate Cohort (back-sync)

For routes that use CourseOffering directly (Phase C+), back-sync to Cohort so legacy code paths still work. Same interceptor pattern, direction `"new_to_legacy"`.

### C. /v1/cohorts retains `Sunset: Wed, 31 Dec 2026 23:59:59 GMT` + `Deprecation: true` headers

Per the standing migration policy. Sprint N+0 add, N+1 frontend migrates, N+2 dev banner, N+3 verify zero legacy traffic, N+4 drop. B.2 is N+0.

## API surface

```
GET    /v1/course-offerings                    — list, filterable by ?semesterId, ?courseId, ?instructorId
GET    /v1/course-offerings/:id                — get by id (tenant-scoped)
POST   /v1/course-offerings                    — admin/instructor; @AuditAction; back-sync to Cohort
PATCH  /v1/course-offerings/:id                — admin/instructor; @AuditAction
DELETE /v1/course-offerings/:id                — admin only; soft-delete; back-sync to Cohort

(Cohort endpoints stay; gain Sunset + Deprecation headers via a CohortDeprecationInterceptor.)
```

## Frontend impact

Minimal in B.2:
- Add `academicsApi.listCourseOfferings({ semesterId, courseId, instructorId })` etc.
- Extend `/admin/academics` to show CourseOfferings per Semester when expanded (or a separate `/admin/courseofferings` page).
- The existing `/catalog` and `/my-courses` pages CAN swap to CourseOffering as the source of truth, but that's a B.4 or B.5 task — out of B.2 scope.

## Estimated scope

| File | Lines | Purpose |
|---|---|---|
| `apps/api/prisma/schema.prisma` | +50 | CourseOffering + MigrationSyncLog models; Tenant/User/Course/Semester relations |
| `apps/api/prisma/migrations/20260525000000_b2_course_offering/migration.sql` | +60 | CREATE TABLE × 2 + indexes + FKs |
| `apps/api/src/university/course-offerings/*.ts` | +220 | Module + controller (CRUD) + DTO + dual-write interceptor |
| `apps/api/src/university/cohorts/cohorts.controller.ts` | +20 | Add Sunset + Deprecation headers + dual-write call |
| `apps/api/src/migration-sync-log/*.ts` | +80 | Module + service for writing sync log rows |
| `apps/api/src/prisma/seed.ts` | +40 | Seed ~3-5 CourseOfferings linking existing Course (CS101) to existing Semester (1404-SPRING) |
| `apps/web/src/api/endpoints.js` | +20 | academicsApi.{listCourseOfferings, ...} |
| `apps/web/src/pages/admin/AcademicsPage.tsx` | +60 | Per-semester sub-section listing offerings |
| `apps/api/src/university/course-offerings/course-offerings.spec.ts` | +120 | Service spec (CRUD + dual-write) |

**Total: ~670 lines.** Above 300-line target. Recommend split:
- **B.2a:** schema + migration + CourseOffering module + MigrationSyncLog (~430 lines)
- **B.2b:** Cohort dual-write interceptor + frontend list + spec (~240 lines)

## Open questions for owner

1. **Q1 — Cohort → CourseOffering mapping when ambiguous.** If a Cohort.program has multiple Courses, which one do we map to? Options: A) skip + log warning (memo default), B) create one CourseOffering per Course in the program, C) use Cohort.courseId if it exists (currently nullable on Cohort).
2. **Q2 — section default.** "A" by default OR null (= no sectioning) by default? Memo defaults to "A" (always has a section, simpler for downstream).
3. **Q3 — capacity default.** null (unbounded) OR a sane default like 30? Memo defaults to **null** — admin sets per-offering.
4. **Q4 — Back-sync direction.** Should NEW CourseOffering writes back-sync to Cohort, or do we only sync legacy → new during the migration window? Memo defaults to **both directions** for the full Sprint N+0 → N+3 window; Sprint N+4 drops the back-sync.
5. **Q5 — Frontend update scope.** B.2 ships the read-only sub-section on /admin/academics. B.3 will swap /catalog + /my-courses to CourseOffering. Or do we want /catalog updated in B.2? Memo defaults: **leave /catalog on Cohort until B.5**.

## Verification

1. `prisma migrate deploy` → new tables exist on production.
2. `npm run seed` → seeded CourseOfferings visible in `GET /v1/course-offerings`.
3. Create a new Cohort via `POST /v1/cohorts` → verify a matching CourseOffering row was auto-created via the interceptor + a MigrationSyncLog row was written.
4. `curl -I /v1/cohorts` → response includes `Sunset` + `Deprecation: true` headers.
5. /admin/academics page expands a Semester → shows offering list.
6. Service spec passes (CRUD + dual-write + cross-tenant guard).

## Risks

- **R1 — Dual-write race.** If two concurrent Cohort creates fire, both might trigger CourseOffering creates and hit unique-key violation. Mitigation: wrap in a transaction OR use `upsert` with the natural key `(courseId, semesterId, section)`.
- **R2 — MigrationSyncLog growth.** Every dual-write writes a log row. With N=10 sync events/day × 90 days = 900 rows. Negligible. No retention needed for B.2; Sprint N+4 can drop the table when the legacy endpoint goes.
- **R3 — Existing /v1/cohorts consumers.** The dossier doesn't fully map who calls /v1/cohorts from the SPA. The Sunset header is informational; clients keep working until N+4. Mitigation: audit /v1/cohorts call sites in the SPA during B.2; flag any that need to migrate in B.3.

## Standing instruction

«**memo نوشتی، stop + owner memo review. هیچ code تا owner ack.**» — applies.

Owner picks:
- Ack memo + answer Q1-Q5 → B.2a starts.
- Pivot to B.1c (CRUD dialogs) first → smaller, lower-risk continuation of B.1.
- Skip B.2 for now; do B.3 (Profile/Student/Instructor) first → bigger people-graph foundation.
- B.4 (StudentApplication state machine) → unblocks `/admissions` flow.

— Phase B R2 author, 2026-05-24. Memo pre-staged. B.1 shipped autonomously; B.2 awaits owner gate. Sleep well.
