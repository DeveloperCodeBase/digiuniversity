# Phase B R3.a — Identity Foundation (Profile + Student + Instructor + R2 instructorId wire) — Memo

**Author:** Phase B post-R2-D13 (D67) + R3-split (D68)
**Date:** 2026-05-27
**Status:** ⏳ DRAFT — awaiting owner ack before R3.a code
**Workflow:** memo → owner ack → code → spec → deploy → D29 pre-smoke → D13 owner smoke → close (D61 Constraint #1)
**Split-from:** `PHASE_B_R3_MEMO.md` (parent R3 memo) — split into R3.a (this) + R3.b (state machines + Applications + NotificationLog, deferred until R3.a deployed)

---

## 🔒 Locked answers (D68) — narrow R3.a scope

Owner answered «Q1.b Q2.a Q3.a Q4.a شروع کن» on the parent R3 memo. R3.a inherits the relevant subset:

| Q | Decision | R3.a impact |
|---|---|---|
| **Q1.b** | **Split** R3 into R3.a (this) + R3.b | This memo = R3.a only |
| **Q2.a** | Strict 1:1 Profile-to-User | R3.a creates Profile row for every existing User via seed-time backfill; new User signups get Profile via interceptor |
| **Q3.a** | Single `CourseOffering.instructorId` | R3.a wires this additively per MIGRATION_POLICY §4 |
| Q4.a | Nullable `StudentApplication.userId` | **Not in R3.a** — defers to R3.b along with the verification caveat |

**Q4.a + verification caveat:** logged in D68 as R3.b binding (UNDER_REVIEW → next stage gate requires email/phone verification). Not in R3.a scope at all.

---

## R1 + R2 lessons applied

**Lesson #1 — schema discovery BEFORE memo lock:**
Done. Pre-write inspection of `apps/api/prisma/schema.prisma` confirms:

| Model | State | R3.a action |
|---|---|---|
| `User` | ✅ EXISTS (line 64) | Additive 1:1 backlink to Profile (no User column change) |
| `Profile` | ❌ greenfield | NEW model (MIGRATION_POLICY §2) |
| `Student` | ❌ greenfield | NEW model (§2) |
| `Instructor` | ❌ greenfield | NEW model (§2) |
| `Department` | ✅ EXISTS (R1) | Reverse relation added: `instructors  Instructor[]` (no schema change to Department itself) |
| `CourseOffering` | ✅ EXISTS (R2) | Additive `instructorId String?` + `instructor Instructor? @relation` per Q3.a (MIGRATION_POLICY §4) |
| `StudentApplication` / `InstructorApplication` | ❌ greenfield | **Not in R3.a** — R3.b scope |

All R3.a additions are either greenfield (§2) or additive (§4). No §3 / §5 / §6 patterns triggered.

**Lesson #2 — bundle vigilance (R2 D66 Path D):**
R3.a adds 3 admin pages. Each ships as **its own per-route lazy chunk**. **NO admin manualChunks bucket.** Post-deploy bundle measurement in `PHASE_B_R3_A_REVIEW.md` REQUIRED, including:
- Main `index-*.js` size delta vs current 379 KB baseline (target < 50 KB)
- New per-route chunks: `ProfilePage-*.js`, `StudentsPage-*.js`, `InstructorsPage-*.js` (each < 55 KB expected)
- Modulepreload verification on `/`, `/login`, `/programs` — admin chunks MUST be absent

**Lesson #3 — service-layer business logic + tests:**
No state machines in R3.a (those defer to R3.b). Standard CRUD pattern from R1 SchoolsService applies. D18 flow assertion still warranted for the R2 instructorId wire (verify Instructor soft-delete cleanly nulls `CourseOffering.instructorId` via SetNull cascade).

---

## Scope (R3.a)

### Data models (Prisma additive)

```prisma
model Profile {
  id            String    @id @default(cuid())
  userId        String    @unique                  // 1:1 strict per Q2.a
  bio           String?   @db.Text
  dateOfBirth   DateTime?
  phoneNumber   String?
  avatarUrl     String?
  address       String?   @db.Text
  nationalId    String?                            // optional Iranian ID (used by R3.b applicant verification + dedup)
  locale        String?                            // optional per-user override of User.locale
  // Audit + soft-delete per R4 lint
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?
  createdBy     String?
  updatedBy     String?

  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId])                               // belt-and-suspenders against duplicate insertion
  @@index([deletedAt])
}

model Student {
  id            String         @id @default(cuid())
  tenantId      String
  userId        String         @unique             // 1 User → 0..1 Student (a user might be only-instructor)
  studentCode   String                             // "STU-40219" — human-readable, unique per tenant
  admissionDate DateTime?
  status        StudentStatus  @default(ENROLLED)
  // Audit fields
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  deletedAt     DateTime?
  createdBy     String?
  updatedBy     String?

  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  tenant        Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, studentCode])
  @@index([tenantId, status])
  @@index([deletedAt])
}

model Instructor {
  id              String           @id @default(cuid())
  tenantId        String
  userId          String           @unique         // 1 User → 0..1 Instructor
  instructorCode  String                           // "INS-781"
  departmentId    String?                          // R1 hierarchy FK (nullable; SetNull on dept delete)
  rank            InstructorRank?
  expertise       String[]                         // e.g., ["machine_learning", "rtl_ui"]
  hireDate        DateTime?
  status          InstructorStatus @default(ACTIVE)
  // Audit fields
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  deletedAt       DateTime?
  createdBy       String?
  updatedBy       String?

  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  tenant          Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  department      Department?      @relation(fields: [departmentId], references: [id], onDelete: SetNull)
  // Reverse relation for R2 instructorId wire:
  taughtOfferings CourseOffering[]

  @@unique([tenantId, instructorCode])
  @@index([tenantId, status])
  @@index([departmentId])
  @@index([deletedAt])
}

enum StudentStatus    { ENROLLED  ON_LEAVE  GRADUATED  WITHDRAWN  DISMISSED }
enum InstructorStatus { ACTIVE    ON_SABBATICAL  INACTIVE  TERMINATED }
enum InstructorRank   { ASSISTANT  ASSOCIATE  FULL  EMERITUS }
```

**Additive on existing R2 `CourseOffering` per Q3.a:**

```prisma
model CourseOffering {
  // … existing fields …
  instructorId  String?
  instructor    Instructor? @relation(fields: [instructorId], references: [id], onDelete: SetNull)
  @@index([instructorId])
}
```

`SetNull` on instructor soft-delete: a `CourseOffering` survives if its instructor leaves; admin can reassign via UI. Matches MIGRATION_POLICY §7 cascade matrix («child can exist orphaned, but should lose its parent reference»).

**Reverse relations on existing models** (no schema change, just declarations):
- `User.profile  Profile?` (1:0..1; 1:1 enforced by Profile.userId UNIQUE)
- `User.student  Student?`
- `User.instructor  Instructor?`
- `Tenant.students    Student[]`
- `Tenant.instructors Instructor[]`
- `Department.instructors Instructor[]`

### API surface (NestJS, R4 audit-lint compliant)

**Profiles** (1:1 with current User, self-service-first):
- `GET    /v1/profile`       — own profile (any authenticated user)
- `PATCH  /v1/profile`       — edit own profile
- `GET    /v1/users/:id/profile` — admin-only, view another user's profile

**Students** (admin CRUD; self-read):
- `GET    /v1/students`         — list (admin)
- `GET    /v1/students/:id`     — single (admin)
- `GET    /v1/students/me`      — own student record (student role)
- `POST   /v1/students`         — create (admin only; normal flow is via R3.b application acceptance)
- `PATCH  /v1/students/:id`     — edit
- `DELETE /v1/students/:id`     — soft-delete

**Instructors** (admin CRUD; partial public-ish read):
- `GET    /v1/instructors`              — list (admin + student visible for catalog/profile browsing)
- `GET    /v1/instructors/:id`          — single (admin + student visible)
- `GET    /v1/instructors/me`           — own (instructor role)
- `POST   /v1/instructors`              — create (admin)
- `PATCH  /v1/instructors/:id`          — edit
- `DELETE /v1/instructors/:id`          — soft-delete
- `PATCH  /v1/instructors/:id/department` — sub-resource for department reassignment

**R2 wire** — extend existing `OfferingsAdminPage`:
- New PATCH endpoint `/v1/offerings/:id/instructor {instructorId}` to assign/unassign an instructor to a CourseOffering. Service-layer guard: instructor must belong to the same tenant as the offering.

All mutations carry `@AuditAction(...)` per Phase A R4 lint. Admin endpoints gated `@Roles("admin")`.

### Admin UI

Four pages (3 admin + 1 self-service), **each as its own lazy chunk per D66 Path D**:

1. `/profile` — self-service profile editor for every authenticated user (any role). 1 page, all the personal fields.
2. `/admin/students` — student list + CRUD (admin only). Includes filter by status (ENROLLED / ON_LEAVE / GRADUATED / …).
3. `/admin/instructors` — instructor list + CRUD + department assignment + expertise tags input. Includes a column showing `taughtOfferings.length` (live join).
4. `/admin/offerings` extension — add inline «instructor» column + assign dropdown. ~30 LOC change, NOT a new page (modifies existing R2 page).

**Sidebar nav extension** (admin role only, after the existing «ساختار آکادمیک» group):
```ts
{ h: "افراد" },
{ id: "admin/students", t: "دانشجویان", ic: "users" },
{ id: "admin/instructors", t: "اساتید", ic: "users" },
```

Top-level «پروفایل من» link added to the user dropdown for every role (not sidebar — fits ergonomically in the existing dropdown that already has «خروج»).

### D12 + D18 spec coverage

`apps/web/tests/visual/phase-b-r3a-identity.spec.ts` (~280 LOC estimate):

**D12 (4 assertions):**
- `/profile` renders form for authenticated user; PATCH round-trip updates the bio field
- `/admin/students` table renders + status pill colors map to StudentStatus enum
- `/admin/instructors` table renders + department column + expertise tags chip
- `/admin/offerings` instructor column visible + dropdown populated

**D18 / flow assertions (5 assertions):**
- 1:1 Profile invariant: POSTing a duplicate Profile for the same userId fails (unique constraint enforcement)
- Seed-time backfill ran (Profile rows exist for every seeded User after first deploy)
- Student soft-delete sets `deletedAt`; subsequent GET returns 404; admin restore (PATCH `deletedAt: null`) brings it back
- Instructor soft-delete causes ALL their `CourseOffering.instructorId` to become NULL via `onDelete: SetNull` (verifies cascade behavior end-to-end)
- Cross-tenant defense: PATCH `/v1/offerings/X/instructor {instructorId}` where instructor belongs to tenant B fails with 400 even if X is in tenant A's session

### Notification stub: NOT in R3.a

Per Q1.b split, the NotificationLog stub belongs to R3.b (it's triggered by state machine transitions, which are R3.b-scoped). R3.a does NOT introduce it.

### Estimated scope

| File | LOC |
|---|---:|
| `apps/api/prisma/schema.prisma` | +130 (3 models + 3 enums + R2 instructorId wire + reverse relations) |
| `apps/api/prisma/migrations/20260528000000_phase_b_r3a_identity` | +110 SQL |
| `apps/api/src/identity/profiles/*` (controller + service + DTOs + module) | +260 |
| `apps/api/src/identity/students/*` | +320 |
| `apps/api/src/identity/instructors/*` | +380 (extra dept-reassignment endpoint + cross-tenant guard) |
| `apps/api/src/university/course-offerings/*` extension (instructor assign endpoint) | +60 |
| `apps/api/src/prisma/seed.ts` extension (Profile backfill + 1 sample instructor) | +80 |
| `apps/api/test/identity-r3a.e2e-spec.ts` | +320 |
| `apps/web/src/api/endpoints.js` extension | +95 |
| `apps/web/src/pages/admin/StudentsPage.tsx` | +260 |
| `apps/web/src/pages/admin/InstructorsPage.tsx` | +320 |
| `apps/web/src/pages/ProfilePage.tsx` (self-service, not in admin/) | +220 |
| `apps/web/src/pages/admin/OfferingsPage.tsx` (extension: instructor column) | +30 |
| `apps/web/src/sidenav.tsx` extension | +12 |
| `apps/web/src/router.tsx` (3 lazy routes per Path D — NO bucket) | +14 |
| `apps/web/src/shared.tsx` (user-dropdown «پروفایل من» link) | +10 |
| `apps/web/tests/visual/phase-b-r3a-identity.spec.ts` | +280 |
| `docs/PHASE_B_R3_A_REVIEW.md` (post-ship) | +220 |

**Total: ~3,120 LOC.** Slightly above the Q1.b ~2,800 estimate; the +320 is from the Instructor cross-tenant guard tests + department-reassignment sub-endpoint that came out of writing the spec mentally.

**Timeline: 5-6 days** (matches R1+R2 cadence).

### Commit ordering (atomic per D61 Constraint #1)

1. **A** — Prisma schema (3 models + 3 enums + R2 instructorId additive) + migration SQL + seed (Profile backfill + sample instructor)
2. **B** — NestJS Profile module (controller + service + DTOs + 1:1 invariant guard)
3. **C** — NestJS Student module
4. **D** — NestJS Instructor module (incl. dept-reassignment sub-endpoint + cross-tenant guard)
5. **E** — CourseOffering instructor-assign endpoint (extends R2 module)
6. **F** — API e2e tests (`identity-r3a.e2e-spec.ts`)
7. **G** — endpoints.js extension + sidebar nav + user-dropdown «پروفایل من»
8. **H** — ProfilePage (self-service)
9. **I** — StudentsPage + InstructorsPage admin pages
10. **J** — OfferingsPage instructor-column extension + router registration (3 new lazy routes — NO bucket per D66) + D12+D18 spec
11. **K** — Review doc + bundle measurement + ping

11 atomic commits, identical cadence to R2.

---

## What's OUT of scope for R3.a

- ❌ StudentApplication + InstructorApplication models → R3.b
- ❌ AppStatus enum + state machines → R3.b
- ❌ ApplicationsPage admin inbox → R3.b
- ❌ NotificationLog stub → R3.b
- ❌ ACCEPTED → ENROLLED side effects (User + Student/Instructor creation from application) → R3.b
- ❌ Q4.a verification caveat enforcement → R3.b
- ❌ Avatar upload pipeline (Profile.avatarUrl is a URL field; upload requires media/storage sub-R post-Phase-B)
- ❌ OAuth/SSO

---

## Performance budget per D61 + D66 lessons

- **Main bundle delta target < 50 KB.** Current baseline post-R2: `index-PIY1gIAW.js` = 379 KB.
- **Per-route chunking pattern from D66 Path D mandatory.** NO admin manualChunks bucket. Each new page → its own lazy chunk.
- **Post-deploy bundle measurement REQUIRED** in `PHASE_B_R3_A_REVIEW.md`:
  ```
  Main index-*.js: 379 KB → ? KB (target < 429 KB)
  Per-route chunks: ProfilePage-*.js, StudentsPage-*.js, InstructorsPage-*.js
  Modulepreload on / + /login + /programs: vendor chunks only
  ```
- **Proactive ping** if main delta > 40 KB OR any new chunk > 55 KB (early-warning, not stop).

---

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| Profile 1:1 backfill on a tenant with many existing seeded users could be slow | Batched seed script (100 rows/batch); O(N) one-time on first migrate |
| Instructor.expertise as `String[]` Postgres array has no element-level FK | Acceptable for R3.a (tags are free-text). If a controlled vocabulary becomes needed later, additive ExpertiseTag model in R4 |
| Cross-tenant instructor assignment to CourseOffering | Explicit service-layer guard in `CourseOfferings.assignInstructor()` + D18 spec test (asserts 400 on cross-tenant attempt) |
| R3.a `instructorId` wired but no UI to USE it until R3.a admin pages ship | Acceptable; the wire is functional from Commit E; UI follows in Commit J. API consumers can assign via PATCH before UI ships. |

---

## Verification plan

### Pre-deploy
- TypeScript clean (`npm run typecheck`)
- Local Prisma generate clean (regenerate after schema changes)
- `npm run test` green
- Local Prisma migrate dev applies cleanly on fresh DB
- D12 + D18 spec green against `npm run test:e2e`
- Existing R-Landing-v2 + R7.x + Phase-A + R1 + R2 specs all still green (regression sweep)

### Post-deploy
- API smoke (8 steps): login admin → POST /v1/profile (own) → PATCH → GET admin/students → POST → PATCH → DELETE → POST /v1/offerings/:id/instructor cross-tenant rejected 400
- D29 Chrome Extension pre-smoke on `/profile`, `/admin/students`, `/admin/instructors`, `/admin/offerings` (instructor column visible)
- Bundle measurement curl → confirm modulepreload absence of admin chunks on anon routes
- AuditLog populated for every mutation (verify via `/v1/audit/logs` admin endpoint)

### D13 owner smoke checklist (8 step, mobile + incognito + hard reload)

1. **Login as admin** → `/profile` self-service page renders + edit bio works
2. **/admin/students** list visible + create + edit + soft-delete cycle
3. **/admin/instructors** list visible + create + assign department + add expertise tags
4. **/admin/offerings** new «instructor» column visible + dropdown assigns instructor + saves
5. **Instructor soft-delete cascade**: delete an instructor → reload offerings → that offering's instructor cell shows «—» (SetNull cascade)
6. **Cross-tenant defense**: (manual API test or skip) PATCH offering instructor with mismatched tenant → 400
7. **Student login** (student1@digiuniversity.ir) → `/profile` works for self; `/admin/students` blocked (403)
8. **Phase A routes untouched** + bundle: open DevTools Network on `/`, confirm no admin/profile chunks preloaded

---

## Status

| Item | Status |
|---|---|
| Memo | ✅ this file |
| Schema discovery | ✅ all greenfield except R2 instructorId additive |
| Owner ack on R3.a memo | ⏳ pending |
| Code (Commits A-K) | ⏳ NOT STARTED |
| Spec | ⏳ post-ack |
| D29 pre-smoke | ⏳ post-deploy |
| Bundle measurement | ⏳ post-deploy |
| D13 owner smoke | ⏳ post-deploy |
| R3.b memo (state machines + Applications + NotificationLog) | ⏳ AFTER R3.a deploys (per D68 sequencing) |

**Re-ack format:** «R3.a memo OK، شروع» (or list edits needed).

— Phase B R3.a kickoff, 2026-05-27. R2 closed per D67. Q-decisions locked per D68. Awaiting memo ack to begin code.
