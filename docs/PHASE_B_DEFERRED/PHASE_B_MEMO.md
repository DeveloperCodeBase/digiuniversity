# Phase B — Memo (Academic Hierarchy + Onboarding)

## Header

- **Phase A closed:** 2026-05-24 per D36 (Path A accepted). See `docs/PHASE_A_CLOSE_MEMO.md` + Gate A Dossier.
- **Source plan:** Compass roadmap §B — Academic Hierarchy + Onboarding (~3 weeks).
- **Policy carry-over from Phase A:**
  - Additive migrations + dual-write (per the user's spec; no destructive renames).
  - External dependencies stay stubbed with three-backend interface (Mock | Real | Degraded), `source: "mock"` always in response.
  - D13 owner real-mobile smoke gate per sub-R.
  - D29 Chrome Extension pre-smoke (when extension is connected).
  - 300-line target per sub-R (10-15% grace OK).
  - Memo first, owner ack, code, spec, deploy, regression, review (per Phase A workflow).

## Goal — single sentence

Land the **Academic Hierarchy** models (`University`, `Semester`, `CourseOffering`, `Profile`, `Student`, `Instructor`) and the **Onboarding** flows (`StudentApplication`, `InstructorApplication`) with additive migrations, dual-write interceptors, application state machines, notification service v1 (Email SMTP + Kavenegar SMS stub), and demo seed data — without breaking any Phase A surface.

## Sub-R breakdown (proposed)

| Sub-R | Title | Scope | Estimate |
|---|---|---|---|
| **B.1** | University + Semester additive models + admin CRUD | Prisma schema additions, NestJS controllers, RBAC gates, admin UI table view, dual-write from any legacy `Faculty.semester` if present | ~3 days |
| **B.2** | CourseOffering additive model + dual-write from `Cohort` | Connects Course + Semester + Instructor; admin schedule view; cohort sync interceptor + MigrationSyncLog | ~3 days |
| **B.3** | Profile + Student + Instructor additive models | Decouples profile-data from `User` (keep User for auth). Dual-write user.fullName → profile.displayName etc. | ~4 days |
| **B.4** | StudentApplication + InstructorApplication models + XState machines | DRAFT → SUBMITTED → UNDER_REVIEW → ACCEPTED/REJECTED → ENROLLED. Per-state UI on /admissions + /admin. | ~4 days |
| **B.5** | Notification service v1 | SMTP via Nodemailer for email; Kavenegar SMS stub (`source: "mock"`); preferences UI; notifications inbox refactor | ~3 days |
| **B.6** | Seed data + smoke spec | 4 universities × 2 semesters × ~20 course offerings × ~80 students × ~12 instructors. Demo applications in each state. | ~1 day |
| **Gate B dossier** | Verify all sub-Rs pass DoD checks per Phase B exit criteria | per the standing Compass §Gate B (TBD details when this memo gets owner ack) | 0.5 day |

**Total Phase B:** ~18-19 working days = ~3.5 calendar weeks (matches Compass estimate).

## B.1 — University + Semester models (DETAILED PLAN)

The first Phase B sub-R follows the same memo→code→review pattern. B.1 detailed plan:

### Schema additions (additive)

```prisma
model University {
  id          String   @id @default(cuid())
  slug        String   @unique
  nameFa      String
  nameEn      String?
  shortCode   String   @unique // e.g., "DIGI" for the demo tenant
  charterDate DateTime
  status      String   @default("active") // active | suspended | dissolved
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  semesters   Semester[]
  // tenant relation if multi-tenant — TBD per existing tenant model
}

model Semester {
  id          String   @id @default(cuid())
  universityId String
  university   University @relation(fields: [universityId], references: [id])
  code        String   // e.g., "S-1404-FALL"
  nameFa      String   // e.g., "نیمسال اول ۱۴۰۴"
  termType    String   // FALL | SPRING | SUMMER | INTERSESSION
  startDate   DateTime
  endDate     DateTime
  registrationOpen DateTime?
  registrationClose DateTime?
  status      String   @default("upcoming") // upcoming | open | active | closed | archived
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@unique([universityId, code])
}
```

**Migration safety:** both models are NEW — no destructive impact. Existing `Faculty`, `Cohort`, `User`, `Course` tables untouched. Dual-write interceptors will populate `University` from any inferred records in Phase B.2.

### NestJS module

`apps/api/src/modules/universities/` and `apps/api/src/modules/semesters/`:
- `universities.module.ts`
- `universities.controller.ts` — GET / POST / PATCH / DELETE; @AuditAction on mutations (per R4 audit-on-mutation rule)
- `universities.service.ts` — Prisma CRUD; @Roles + @CheckPolicies for super_admin + admin
- Same shape for semesters; semester controller has GET /universities/:id/semesters scoping.

### Admin UI

`apps/web/src/pages/admin/universities.tsx`:
- Table view: list of universities with status badges, semester count, action menu
- "Add university" dialog: slug + name (FA/EN) + shortCode + charterDate + status
- Per-university drawer: edit + view semesters list

For semesters per-university view → reuses the same dialog/table primitives.

### Tests

- Unit: universities.service.spec.ts (CRUD + RBAC enforcement)
- Integration: universities.e2e.spec.ts (full Nest + Postgres)
- Visual: phase-b-r1-universities.spec.ts (table renders, dialog opens, RBAC redirect)

### Seed

Adds 4 universities to the seed:
- "دیجی‌یونیورسیتی مجازی" (the platform's own university; charter 2026)
- 3 partner placeholders (with `source: "mock"` flag for clarity)

Each gets 2-3 semesters: 1403 FALL (closed/archived), 1404 SPRING (active), 1404 FALL (upcoming).

### B.1 sub-R workflow checklist

1. Write detailed memo (this is it).
2. Owner ack — Q1: any additional fields on University? Q2: tenant ownership pattern (single-tenant per university vs multi-tenant within one University record)? Q3: timezone handling on Semester dates (assume Asia/Tehran)?
3. Code: Prisma schema → npx prisma migrate dev (locally, then commit migration SQL to apps/api/prisma/migrations/) → controllers → services → tests.
4. Frontend: /admin/universities route, list + dialog.
5. Deploy via `scripts/remote.ps1 up` + run remote migration.
6. Spec + regression sweep (R1.1 + R3 + R7.7 + new B.1 spec).
7. D29 pre-smoke (if Chrome Extension connected).
8. Owner D13 smoke.
9. Write `docs/PHASE_B_R1_REVIEW.md`.

### B.1 estimated scope

| File | Lines | Purpose |
|---|---|---|
| `apps/api/prisma/schema.prisma` | +35 | University + Semester models |
| `apps/api/prisma/migrations/0NNN_b1_universities/migration.sql` | +20 (auto-generated) | Additive create-table SQL |
| `apps/api/src/modules/universities/*` | +180 | Module + controller + service + DTO + tests |
| `apps/api/src/modules/semesters/*` | +140 | Same shape, semester scope |
| `apps/api/src/seeds/universities.seed.ts` | +60 | 4 universities × 2-3 semesters demo data |
| `apps/web/src/pages/admin/universities.tsx` | +220 | Table + dialog + RBAC gate |
| `apps/web/src/router.tsx` | +5 | Lazy import for /admin/universities |
| `apps/web/tests/visual/phase-b-r1-universities.spec.ts` | +120 | RBAC + CRUD spec |

**Total: ~780 lines.** Above the 300-line target — split into B.1a (api + migration + seed) and B.1b (admin UI + spec) if needed.

## Open questions for owner

These need owner answers before B.1 code starts:

1. **Q1 — Multi-tenant scoping of University.** Does the demo deployment have one University ("دیجی‌یونیورسیتی") or multiple? If one: simplify by skipping `tenantId` on University. If multiple: each University owns its own User/Course/etc graph via cascading scope. Memo defaults to **single-tenant** (one University per deployment instance) for B.1 simplicity; multi-tenant can be added later.
2. **Q2 — Timezone on Semester dates.** All dates in Asia/Tehran (UTC+3:30)? Or store UTC, render local? Memo defaults to **Asia/Tehran** stored + displayed (matches existing convention in classroom + tutor pages).
3. **Q3 — Persian calendar (Jalaali) support.** Display semester names in Jalaali (۱۴۰۴) but store dates in ISO/Gregorian? Memo defaults: **store ISO, display Jalaali via existing `toFa()` + a new `jalaaliDate()` helper**.
4. **Q4 — Charter date of the platform's own University.** Owner-specified value or autogen "2026-01-01"? Memo defaults: **2026-01-01** as a placeholder; owner can override.
5. **Q5 — B.1 split or combined.** Combined ~780 lines (above 300-line target). Split: B.1a = api+migration+seed (~430 lines), B.1b = admin UI + spec (~340 lines). Memo proposes **split** for cleaner ship.

## Standing instruction

«**memo نوشتی، stop + owner memo review. هیچ code تا owner ack.**» — applies.

Owner picks:
- Ack the memo + answer Q1-Q5 → B.1a starts.
- Modify scope (e.g., skip Semester for now, do University-only) → revise memo.
- Pivot Phase B priorities (e.g., do Notification service v1 first because it unblocks Phase A's deferred email confirmations) → re-order sub-Rs.

— Phase B planner, 2026-05-24. Phase B memo pre-staged the moment Phase A closed (D36). B.1 detailed; B.2-B.6 outlined. Ready when owner is.
