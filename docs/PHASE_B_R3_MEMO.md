# Phase B R3 — Identity Track (Profile + Student + Instructor + Applications) — Memo

**Author:** Phase B post-R2-D13 (D67)
**Date:** 2026-05-27
**Status:** ⏳ DRAFT — awaiting owner ack + Q1-Q4 answers before code
**Workflow:** memo → owner ack → code → spec → deploy → D29 pre-smoke → D13 owner smoke → close (D61 Constraint #1)
**Compass Roadmap reference:** §Phase B — Academic Hierarchy + Onboarding (~3 weeks). Specifically the «Onboarding» half: `Profile`, `Student`, `Instructor`, `StudentApplication`, `InstructorApplication` + XState machines + Notification service v1 stub.

---

## R1 + R2 lessons applied to R3 memo

**Lesson #1 — schema discovery BEFORE memo lock** (R1 D63 surprise: Faculty/Department/Program were existing models, only School was greenfield):

| Model | State | R3 action |
|---|---|---|
| `User` | ✅ EXISTS (line 64) — basic identity: email, passwordHash, fullName?, locale, isActive | Additive: + 1-to-1 link to new `Profile` row. No User column change. |
| `Profile` | ❌ greenfield | NEW model — extends User with bio, dateOfBirth, phoneNumber, avatarUrl, address, etc. (MIGRATION_POLICY §2) |
| `Student` | ❌ greenfield | NEW model — student-specific record (admission cohort, advisor, gradeLevel). FK to User. (§2) |
| `Instructor` | ❌ greenfield | NEW model — instructor-specific (department FK, academic rank, expertise tags). FK to User. (§2) |
| `StudentApplication` | ❌ greenfield | NEW model + state machine. (§2) |
| `InstructorApplication` | ❌ greenfield | NEW model + state machine. (§2) |
| `CourseOffering.instructorId` | ⏳ DEFERRED in R2 per D65 Q2 modification | **Wire now** as additive column (§4) referencing `Instructor.id`. Single-instructor first; multi-instructor (team-taught) is a Q3 decision below. |

All identity-domain code is greenfield → no dual-write needed (MIGRATION_POLICY §2). The R2 instructorId wire is additive (§4). No §3 / §5 / §6 patterns triggered.

**Lesson #2 — bundle constraint vigilance** (R2 D66, 3-iteration chunk-leak fix): R3 will add 4+ new admin pages (ApplicationsPage / StudentsPage / InstructorsPage / ProfilePage). These get the **per-route chunking pattern** locked by R2 Path D — NO admin-bucket grouping in `manualChunks`. Each new page = its own lazy chunk = no preload escalation on anon routes.

**Lesson #3 — state machine = service layer + ALLOWED_TRANSITIONS map** (R2 pattern from `CourseOfferingsService.transition`): R3 has TWO state machines (StudentApplication, InstructorApplication). Both follow the same shape:
- Service-layer map: `ALLOWED_TRANSITIONS: Record<Status, Status[]>`
- `isLegalTransition(from, to)` exported helper for tests
- Illegal transitions → 400 with helpful `Allowed from {current}: [{list}]` message
- Soft-delete legal at any status
- D18 spec asserts: happy-path chain + each illegal pair + cascade behavior

---

## Scope (R3)

### Data models (Prisma additive — all greenfield except R2 instructorId wire)

```prisma
model Profile {
  id            String    @id @default(cuid())
  userId        String    @unique         // 1:1 with User
  bio           String?   @db.Text
  dateOfBirth   DateTime?
  phoneNumber   String?
  avatarUrl     String?
  address       String?   @db.Text
  locale        String?   // override User.locale per-profile
  // Audit fields per R4 lint
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?
  createdBy     String?
  updatedBy     String?

  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([deletedAt])
}

model Student {
  id            String    @id @default(cuid())
  tenantId      String
  userId        String    @unique
  studentCode   String              // "STU-12345" — human-readable
  admissionDate DateTime?
  status        StudentStatus @default(ENROLLED)
  // … audit + soft-delete fields …

  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tenant        Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, studentCode])
  @@index([tenantId, status])
}

model Instructor {
  id              String    @id @default(cuid())
  tenantId        String
  userId          String    @unique
  instructorCode  String              // "INS-789"
  departmentId    String?
  rank            InstructorRank?     // ASSISTANT / ASSOCIATE / FULL / EMERITUS
  expertise       String[]            // ["machine_learning", "rtl_ui", ...]
  hireDate        DateTime?
  status          InstructorStatus @default(ACTIVE)
  // … audit + soft-delete fields …

  user            User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  tenant          Tenant     @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  department      Department? @relation(fields: [departmentId], references: [id], onDelete: SetNull)

  @@unique([tenantId, instructorCode])
  @@index([tenantId, status])
  @@index([departmentId])
}

model StudentApplication {
  id              String    @id @default(cuid())
  tenantId        String
  userId          String?             // null until applicant creates account
  email           String              // applicant contact
  fullName        String
  programId       String              // target program
  status          AppStatus @default(SUBMITTED)
  notes           String?   @db.Text
  decisionAt      DateTime?
  decisionBy      String?
  // … audit + soft-delete fields …

  tenant          Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user            User?     @relation(fields: [userId], references: [id], onDelete: SetNull)
  program         Program   @relation(fields: [programId], references: [id], onDelete: Restrict)

  @@index([tenantId, status])
  @@index([programId])
  @@index([email])
}

model InstructorApplication {
  // … same shape as StudentApplication, status = AppStatus too …
}

enum StudentStatus       { ENROLLED, ON_LEAVE, GRADUATED, WITHDRAWN, DISMISSED }
enum InstructorStatus    { ACTIVE, ON_SABBATICAL, INACTIVE, TERMINATED }
enum InstructorRank      { ASSISTANT, ASSOCIATE, FULL, EMERITUS }
enum AppStatus           { SUBMITTED, UNDER_REVIEW, INTERVIEW, ACCEPTED, REJECTED, WITHDRAWN, ENROLLED }
```

**Additive on existing R2 `CourseOffering` (per Q4 below):**
```prisma
model CourseOffering {
  // … existing fields …
  instructorId  String?              // ← NEW — wires R2 Q2 deferral
  instructor    Instructor? @relation(fields: [instructorId], references: [id], onDelete: SetNull)
  @@index([instructorId])
}
```

### State machine — StudentApplication (canonical Phase B state machine #1)

```
SUBMITTED ─→ UNDER_REVIEW ─→ INTERVIEW ─→ ACCEPTED ─→ ENROLLED
   │              │              │            │
   └──────────────┴──────────────┴────────────┴──→ REJECTED
                                              ↓
                                          WITHDRAWN (terminal)
```

| From | Allowed to |
|---|---|
| `SUBMITTED` | `UNDER_REVIEW`, `WITHDRAWN`, `REJECTED` |
| `UNDER_REVIEW` | `INTERVIEW`, `ACCEPTED`, `REJECTED`, `WITHDRAWN` |
| `INTERVIEW` | `ACCEPTED`, `REJECTED`, `WITHDRAWN` |
| `ACCEPTED` | `ENROLLED`, `WITHDRAWN` |
| `ENROLLED` | (terminal — happy path complete) |
| `REJECTED` | (terminal) |
| `WITHDRAWN` | (terminal) |

`ACCEPTED → ENROLLED` triggers a side effect: create User row (if not exists), Student row (linking the application to the new student record), and Enrollment row for the target program's default offering.

`InstructorApplication` reuses the same `AppStatus` enum with a parallel transition map and a different side effect on `ACCEPTED → ENROLLED`: create Instructor row.

### API surface (NestJS)

- **Profiles** (1:1 with current User): `GET /v1/profile` (own), `PATCH /v1/profile`, plus admin-scoped `GET /v1/users/:id/profile`
- **Students**: full CRUD `/v1/students` (admin) + `GET /v1/students/me` (self)
- **Instructors**: full CRUD `/v1/instructors` (admin) + `GET /v1/instructors/me` (self) + `GET /v1/instructors` (public-ish for listing/filtering — student-visible)
- **StudentApplications**: `POST /v1/student-applications` (public — applicant create), `GET /v1/student-applications` (admin list), `GET /:id` (admin or owning applicant), `POST /:id/transition {to}` (admin only, state-machine guarded), soft-delete admin
- **InstructorApplications**: mirror shape

All mutations carry `@AuditAction(...)` per R4 lint. All admin endpoints gated `@Roles("admin")`.

### Admin UI

Four new admin pages, **each as its own lazy chunk per R2 D66 Path D** (no manualChunks bucket):

1. `/admin/applications` — unified inbox: list both Student + Instructor applications with status filter + transition controls + decision notes
2. `/admin/students` — student record list + CRUD (admin override; normal student onboarding flows via Application acceptance side effect)
3. `/admin/instructors` — instructor record list + CRUD + department assignment + R2 `instructorId` wire UI (assign instructor to existing CourseOfferings)
4. `/profile` — self-service profile editor (not admin-only; every authed user gets this)

Sidebar additions (admin role):
```ts
{ h: "افراد" },
{ id: "admin/applications", t: "درخواست‌های پذیرش", ic: "users" },
{ id: "admin/students", t: "دانشجویان", ic: "users" },
{ id: "admin/instructors", t: "اساتید", ic: "users" },
```

Plus a top-level «پروفایل من» link in the user dropdown (every role).

### D12 + D18 spec

`apps/web/tests/visual/phase-b-r3-identity.spec.ts` (~450 LOC estimate):

**D12 (4 assertions):** Application inbox renders both types, status pill colors correct per AppStatus, Student detail view shows linked Profile, R2 OfferingsPage row shows instructor name when wired.

**D18 (10 assertions):** Full SA + IA state machine happy-paths; each illegal transition rejected (`SUBMITTED → ENROLLED` etc.); `ACCEPTED → ENROLLED` side effect creates User + Student/Instructor + (for SA) Enrollment row; soft-delete legal at any status; cascade: User soft-delete → Profile soft-delete (1:1 cascade).

### Notification service v1 (Compass §Phase B stub)

R3 ships a minimal **Notification stub interceptor** that logs «notification would send» events on key state transitions:
- `SUBMITTED` (applicant) → log "confirmation email queued"
- `INTERVIEW` (admin) → log "interview invitation queued"  
- `ACCEPTED` / `REJECTED` (admin) → log "decision email queued"

Stub writes rows to a new `NotificationLog` table (audit + future-real-sender hook). NO actual email/SMS in R3 — defer to a dedicated R-Notif sub-R post-Phase-B per Compass cross-cutting.

### Estimated scope

| File | LOC |
|---|---:|
| `apps/api/prisma/schema.prisma` | +280 (5 models + 4 enums + indexes + R2 instructorId additive) |
| `apps/api/prisma/migrations/20260528000000_phase_b_r3_identity` | +180 SQL |
| `apps/api/src/identity/{profiles,students,instructors,applications}/*.ts` (8 files per module pattern × 4 = ~32 files) | +1,400 |
| `apps/api/src/notifications/notification-log.service.ts` (stub) | +90 |
| `apps/api/src/prisma/seed.ts` extension | +120 (sample profiles + 2 sample applications) |
| `apps/api/test/identity.e2e-spec.ts` | +420 (state machine + side-effect coverage) |
| `apps/web/src/api/endpoints.js` extension | +120 |
| `apps/web/src/pages/admin/{Applications,Students,Instructors}Page.tsx` + `ProfilePage.tsx` | +1,100 (4 × ~275 each) |
| `apps/web/src/sidenav.tsx` extension | +20 |
| `apps/web/src/router.tsx` | +18 (4 lazy routes per R2 Path D — NO manualChunks bucket) |
| `apps/web/tests/visual/phase-b-r3-identity.spec.ts` | +450 |
| `docs/PHASE_B_R3_REVIEW.md` (post-ship) | +250 |

**Total: ~4,450 LOC.** ~50% larger than R2 (R2 was ~3,000); justified by R3 covering 2 state machines + 5 new models + 4 admin pages + Notification stub. Could split into R3.a + R3.b if owner prefers (see Q1).

### Timeline

7-10 days if shipped as single R3. 4-5 days each if split (R3.a Identity models + Student/Instructor + Profile admin pages; R3.b Applications state machines + side effects + Notification stub).

### Commit ordering (atomic per D61 Constraint #1)

If single R3:
1. **A** — Prisma schema + migration + seed
2. **B** — NestJS Profile module
3. **C** — NestJS Student module
4. **D** — NestJS Instructor module + R2 `instructorId` wire
5. **E** — NestJS StudentApplication + InstructorApplication modules + state machines
6. **F** — NotificationLog stub service
7. **G** — API e2e tests (state machines + side effects)
8. **H** — `endpoints.js` extension + sidebar nav
9. **I** — admin pages (Applications + Students + Instructors)
10. **J** — ProfilePage (self-service, every role)
11. **K** — Router registration + D12+D18 spec
12. **L** — Review doc + bundle measurement + ping

---

## Q1-Q4 for owner

### Q1 — Scope: single R3 vs split R3.a + R3.b?

- **Q1.a (default proposed)** — single R3, ~4,450 LOC, 7-10 days. One D13 cycle. Identity models + state machines ship together.
- **Q1.b** — split. R3.a = Profile + Student + Instructor + Profile/Students/Instructors admin pages + R2 instructorId wire (~2,800 LOC, 4-5 days). R3.b = StudentApplication + InstructorApplication state machines + ApplicationsPage + NotificationLog stub (~1,650 LOC, 3-4 days). Two D13 cycles, smaller blast radius per sub-R.

**Recommendation: Q1.b split.** State machines are higher-risk than additive identity models; isolating them in R3.b means R3.a can ship + bake while R3.b takes its time. Also matches R2's lesson that state machines deserve their own atomic shipping window for D18 coverage clarity.

### Q2 — `Profile` cardinality vs `User`?

- **Q2.a (default proposed)** — Strict 1:1. Every `User.id` has exactly one `Profile` row (created on user signup via interceptor; existing seeded users get backfill).
- **Q2.b** — Lazy 1:0..1. Profile created only on first edit; existing users have no Profile until they touch the editor.

**Recommendation: Q2.a.** Predictable invariants make downstream queries simpler (`user.profile` always present). Backfill is O(N) one-time. Q2.b's lazy pattern saves DB rows but breaks every `user.profile.bio ?? defaultBio` access pattern.

### Q3 — `CourseOffering` instructor cardinality?

R2 deferred `instructorId` decision to R3. Options:
- **Q3.a (default proposed)** — Single `instructorId String?` on CourseOffering. Each offering has 0 or 1 instructor of record. Team-teaching modeled later via a separate `OfferingCoInstructor[]` junction if needed.
- **Q3.b** — Many `instructorIds String[]` array. Direct support for team-taught from day 1. Simpler queries but loses FK integrity (Postgres arrays don't enforce FK).
- **Q3.c** — Junction table `CourseOfferingInstructor { offeringId, instructorId, role }`. Full FK integrity + role per instructor (lead / co / TA). Adds a model.

**Recommendation: Q3.a.** Single instructorId now (~5 LOC schema change + 10 LOC service wire). Junction table (Q3.c) is correct long-term but adds 200+ LOC for what's currently a 1-of-many sketch. If team-teaching becomes real soon, R4 can introduce the junction additively (the single `instructorId` becomes "lead instructor" + junction rows for co-teachers).

### Q4 — `StudentApplication.userId` — null-until-signup vs require-account-first?

- **Q4.a (default proposed)** — Nullable until signup. Public users submit application without creating account (`userId = NULL`); on ACCEPTED, the side-effect creates User + Student rows and back-populates `userId`. Lowest friction for applicants.
- **Q4.b** — Require account first. Public user must sign up before applying. Email + name come from User, not Application form. Less friction in the side-effect (User already exists) but higher friction at submission.

**Recommendation: Q4.a.** Iranian university applicants commonly explore options before committing to an account; Q4.b would block engagement at the apply form. Q4.a's userId backfill is a 3-line addition to the ACCEPTED transition handler.

---

## Performance budget per D61 + D66 lessons

- **Main bundle delta target: < 50 KB** (D61 Constraint #2).
- **Per-route chunking pattern from R2 D66 Path D mandatory.** NO admin manualChunks bucket. Each new page → its own lazy chunk.
- **Post-deploy bundle measurement is REQUIRED** in `PHASE_B_R3_REVIEW.md`:
  ```
  Main index-*.js: pre-R3 (379 KB) → post-R3 (?) → Δ (?)
  Per-route admin chunks: ApplicationsPage-*.js, StudentsPage-*.js, …
  Modulepreload on / + /login + /programs: must contain ONLY vendor chunks
  ```
- **Proactive ping** if any single admin chunk > 55 KB OR if main delta > 40 KB (early-warning, not stop).

---

## Out of scope for R3

- ❌ Actual email/SMS sending (NotificationLog stub only; real sender = R-Notif post-Phase-B)
- ❌ Student self-service application UI (admin reviews; applicant-facing form is its own R3.c if needed)
- ❌ Multi-tenancy variations on Profile/Student/Instructor (single-tenant per D60 Q3.a, same as R1/R2)
- ❌ Avatar image upload pipeline (Profile.avatarUrl is a URL field; upload comes in a media/storage sub-R)
- ❌ OAuth/SSO integration for applicant signup (form-based for R3)

---

## 4 questions for owner

| Q | Default | Override notes |
|---|---|---|
| Q1 — single R3 vs split R3.a + R3.b | **Q1.b split** (recommended) | Q1.a accepted if owner prefers single longer ship cycle |
| Q2 — Profile cardinality | **Q2.a strict 1:1** | Q2.b lazy if owner wants minimal DB rows |
| Q3 — CourseOffering instructor cardinality | **Q3.a single instructorId** | Q3.b array (no FK) or Q3.c junction (heavier) |
| Q4 — StudentApplication userId before signup | **Q4.a nullable, backfill on ACCEPTED** | Q4.b require-account-first |

**One-line ack format:** «Q1.b Q2.a Q3.a Q4.a شروع کن» (or letter combos).

---

## Status

| Item | Status |
|---|---|
| Memo | ✅ this file |
| Schema discovery | ✅ all greenfield except R2 instructorId additive |
| Owner ack on Q1-Q4 | ⏳ pending |
| Code | ⏳ NOT STARTED |
| Spec | ⏳ post-ack |
| D29 pre-smoke | ⏳ post-deploy |
| Review doc + bundle measurement | ⏳ post-ship |
| D13 owner smoke | ⏳ post-deploy |

— Phase B R3 kickoff, 2026-05-27. R2 closed per D67. Awaiting Q1-Q4 ack to begin.
