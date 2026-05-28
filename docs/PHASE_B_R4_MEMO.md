# Phase B R4 — Enrollment Lifecycle (close the D72 spine gap) — Memo

**Author:** Phase B (post-R3.b-close, R-Next = B picked)
**Date:** 2026-05-28
**Status:** ✅ ACKED (D73 Q0.a/Q1-Q5/dual-write + D74 Q2=service-layer) — Commit A in flight
**Workflow:** memo → owner ack → code → spec → local build → owner deploy → owner D29 → owner D13 → close (D61 Constraint #1)
**Predecessor:** Identity track (R3.a + R3.b) complete (D70 + D72). Closes the D72 Enrollment gap.
**References:** D72 (Enrollment gap), D73 (R4 Q-answers), D74 (Q2 = service-layer, NOT enum), R2 (CourseOffering + Cohort dual-write), R3.b (ENROLLED side effect), PHASE_B_RETROSPECTIVE.md

> **D74 Q2 resolution (supersedes Q2.a-as-written in this memo):** `Enrollment.status` stays a **String** column (no Postgres enum — backward-compat with the existing Phase-7 RBAC status controller + existing lowercase data). The state machine (`ALLOWED_TRANSITIONS` + illegal-400) lives at the **service layer** in the new R4 admin transition endpoint. Existing student self-enroll/withdraw flow untouched. Status values stay lowercase (`active`/`completed`/`dropped`/`withdrawn`) to match existing data + code. The §«State machine design» + §«Data model» enum references below are superseded by this — read `status` as a String field with a service-layer guard.

---

## ⚠️ Schema discovery surfaced a real architecture decision — read this first

The R-Next planning memo + the owner's framing both assumed R4 is "wire the last connection + one admin page" (smallest lift). **The schema discovery says that's only true under one interpretation.** There's a genuine model impedance mismatch that the owner must resolve in **Q0** before the rest of the scope is fixed.

### The mismatch

```
StudentApplication.programId ──→ Program ──┬── Course[]          (CS101, CS102, … — the SUBJECTS)
                                            ├── CourseOffering[]  (Fall-1405, … — the TERM INSTANCES)
                                            └── Cohort[]          (legacy term groups)

Enrollment (Phase 3 + R2):
  userId     REQUIRED  → User      (NOT studentId — ties to User)
  courseId   REQUIRED  → Course    ← ⚠️ enrollment is COURSE-level, mandatory
  cohortId   optional  → Cohort    (legacy)
  offeringId optional  → CourseOffering  (R2 additive)
  status     string    (active | completed | dropped | withdrawn)
  @@unique([tenantId, userId, courseId])
```

**An accepted applicant targets a *Program*. But `Enrollment` requires a *Course*.** A `CourseOffering` is a program-term instance — it has `programId` but **no `courseId`**. So "enroll the accepted applicant" can't trivially create an `Enrollment` row: there is no Course in the application→offering chain.

This is exactly why the owner asked for *very precise* schema discovery. The "smallest lift" holds only if we pick the program-level-admission interpretation (Q0.a below); the course-level interpretations are materially larger.

---

## Schema discovery (precise)

| Model | Field / relation | State | R4 relevance |
|---|---|---|---|
| `Enrollment` | `userId String` (req, → User) | EXISTS | Enrollment keys on User, not Student. Student dimension is via `userId → User → Student`. |
| `Enrollment` | `courseId String` (req, → Course) | EXISTS | **Mandatory Course FK — the crux of Q0.** |
| `Enrollment` | `cohortId String?` (→ Cohort, SetNull) | EXISTS | Legacy. Dual-write era. |
| `Enrollment` | `offeringId String?` (→ CourseOffering, SetNull) | EXISTS (R2 additive) | Modern context FK. |
| `Enrollment` | `status String` (free-text: active/completed/dropped/withdrawn) | EXISTS | No state machine yet → Q2. |
| `Enrollment` | `@@unique([tenantId, userId, courseId])` | EXISTS | One enrollment per user per course → Q3. |
| `Enrollment` | NO `studentId`, NO `deletedAt`-less? | — | `deletedAt` EXISTS (soft-delete ready). No `resultingFromApplicationId` back-ref. |
| `Student` | relation to Enrollment | **ABSENT** | Student has no `enrollments` relation (connects via User). Additive reverse relation if we want `student.enrollments`. |
| `CourseOffering` | `courseId` | **ABSENT** | Offering is program-level, not course-level. Has `programId` only. |
| `CourseOffering` | relation to Enrollment | EXISTS (`enrollments Enrollment[]`) | Already wired (R2). |
| `Program` | `courses Course[]` + `offerings CourseOffering[]` + `cohorts Cohort[]` | EXISTS | Courses + Offerings are PARALLEL children of Program. |
| `StudentApplication` | `resultingStudentId String? @unique` | EXISTS (R3.b) | Back-link to Student works. |
| `StudentApplication` | `resultingEnrollmentId` | **ABSENT** | R3.b memo sketched it; implementation dropped it → Q5. |
| `ApplicationEnrollmentService.enrollStudent()` | creates User + Student | EXISTS (R3.b) | Does NOT create Enrollment (the D72 gap). |

**Net:** the only greenfield-free path requires a Q0 decision on how a program-level application maps to the course-level Enrollment contract.

---

## ❓ Q0 — Architecture decision (NEW, must resolve first)

How does an accepted `StudentApplication` (program-level) become enrollment?

### Q0.a (Recommended) — Program-term admission via `offeringId`; relax `courseId` to optional

Make `Enrollment.courseId` **nullable**. Introduce the notion of a *program-term enrollment*: an `Enrollment` row with `offeringId` set + `courseId` null = "this Student is admitted to this CourseOffering (term) of the program". Course-level enrollments (existing Phase 3 rows) keep `courseId` set as before — fully backward compatible (widening a constraint never breaks existing rows).

- **ENROLLED side effect** (Q5.a find-or-create-or-link already builds the User + Student): additionally create one `Enrollment { userId, offeringId: <targetOffering>, courseId: null, status: "active" }`.
- **Admin can later enroll the student into specific Courses** (course-level rows) via `/admin/enrollments`.
- **Smallest lift** — one nullable migration + the side-effect addition + the admin page. Matches the owner's "wire the last connection" expectation.
- **Trade-off:** `Enrollment` now has two shapes (program-term vs course-level). The `@@unique([tenantId, userId, courseId])` constraint doesn't apply to null courseId rows (Postgres treats nulls as distinct), so a partial unique index on `(tenantId, userId, offeringId) WHERE courseId IS NULL` is added to prevent duplicate program-term admissions.

### Q0.b — Fan-out: enroll into every Course of the program

ENROLLED side effect creates one course-level `Enrollment` per Course in the program (or per Course in the offering's term). No schema change to Enrollment.

- **Trade-off:** "which courses belong to this term offering?" is undefined — `CourseOffering` has no Course link. Would need a new `OfferingCourse` join table (greenfield) to define the term's course set. Materially larger (~+1 model + the join management UI). Also: bulk-creating N enrollments per applicant is a heavier transaction.

### Q0.c — New `ProgramEnrollment` model (two-level)

Greenfield `ProgramEnrollment` (Student → CourseOffering, the "admitted to this term") distinct from the existing course-level `Enrollment`.

- **Trade-off:** cleanest conceptually (no overloading Enrollment), but largest lift (new model + new admin page + new API + the existing student `enrollmentsApi.listMine` doesn't cover it). Defers reuse of the existing Enrollment surface.

**Recommendation: Q0.a.** It's backward-compatible (nullable widening), reuses the existing Enrollment model + its R2 `offeringId` FK + the student-facing `listMine` API, and is the genuine "smallest lift" the owner expected. The two-shape trade-off is managed with a partial unique index. If the university later needs strict course-level-only enrollment, that's an additive refinement.

> **The rest of this memo assumes Q0.a.** If the owner picks Q0.b or Q0.c, the scope + Q1-Q5 + LOC estimate change materially and I'll revise.

---

## Scope (R4, assuming Q0.a)

### Data model changes (additive per MIGRATION_POLICY §4)
```prisma
model Enrollment {
  // … existing …
  courseId   String?   // ⚠️ R4: relaxed from required → nullable (Q0.a).
                       // null = program-term admission (offeringId set);
                       // set = course-level enrollment (existing shape).
  // status formalized via EnrollmentStatus enum (Q2.a) — or kept string (Q2.b)
  // NEW partial unique: one program-term admission per (tenant, user, offering)
  //   @@unique on (tenantId, userId, offeringId) WHERE courseId IS NULL
  //   (authored as a raw partial index in migration SQL — Prisma can't express
  //    partial uniques in the schema DSL, so it's a manual CREATE UNIQUE INDEX)
}

model StudentApplication {
  // … existing …
  resultingEnrollmentId String?  @unique  // Q5.a back-link
  resultingEnrollment   Enrollment? @relation(...)
  targetOfferingId      String?           // Q1.a — admin sets during review
  targetOffering        CourseOffering? @relation(...)
}
```
Reverse relations: `Student.enrollments`? (Q — via User, optional convenience), `CourseOffering.studentApplications` (for targetOffering back-ref).

### Behavior
- **ENROLLED side effect extension** (`ApplicationEnrollmentService.enrollStudent`): inside the existing `$transaction`, after creating the Student, create an `Enrollment { userId, offeringId: app.targetOfferingId, courseId: null, status: active }` IF `targetOfferingId` is set; populate `application.resultingEnrollmentId`. If `targetOfferingId` is null → create Student only (current behavior; no regression — Q1.a fallback).
- **Enrollment status state machine** (Q2.a): `ACTIVE → COMPLETED | DROPPED | WITHDRAWN`, terminal at COMPLETED/DROPPED/WITHDRAWN. Service-layer guard + illegal-transition 400 (R2/R3.b pattern).
- **`/admin/enrollments` page** (Q4.a): list + filter (offering / status / program) + "enroll a student" dialog (pick Student + pick CourseOffering and/or Course) + status transition controls + soft-delete.

### API surface (NestJS)
- `GET    /v1/enrollments` — admin list (filters: offeringId, status, programId-via-join)
- `GET    /v1/enrollments/:id` — admin single
- `POST   /v1/enrollments` — admin manual enroll (userId/studentId + offeringId and/or courseId)
- `POST   /v1/enrollments/:id/transition` — admin status transition (state machine)
- `DELETE /v1/enrollments/:id` — admin soft-delete
- `GET    /v1/enrollments/me` — already exists (student self-list) — verify it surfaces the new program-term rows
- (StudentApplication `targetOffering` set via existing PATCH or a new `/applications/student/:id/target-offering` sub-endpoint — Q1 detail)

### Admin UI
- `/admin/enrollments` — own per-route lazy chunk (D66 Path D). List + filters + enroll dialog + transition controls + soft-delete.
- ApplicationsPage drawer extension: a "target offering" selector during review (so admin sets `targetOfferingId` before ACCEPTED → ENROLLED).

---

## ❓ Q1–Q5 (reframed under Q0.a)

### Q1 — target-offering selection
- **Q1.a (Recommended)** — `StudentApplication.targetOfferingId` (nullable); admin sets it in the ApplicationsPage drawer during review. ENROLLED enrolls into it. Null → Student-only (no regression).
- **Q1.b** — Auto-pick the program's current OPEN offering. Brittle if multiple OPEN.
- **Q1.c** — No target on the application; admin always enrolls manually via `/admin/enrollments` after ENROLLED. Decouples but adds a step.

### Q2 — Enrollment status state machine
- **Q2.a (Recommended)** — `EnrollmentStatus` enum + state machine: `ACTIVE → COMPLETED | DROPPED | WITHDRAWN` (terminal). Migrate the existing free-text `status` string → enum (additive: add enum, backfill existing values, they already match). Service-layer guard per R2/R3.b.
- **Q2.b** — Keep `status` free-text; no state machine. Lower effort, no D18 state-machine assertions, less safety.

### Q3 — Enrollment uniqueness
- **Q3.a (Recommended)** — Course-level: keep `@@unique([tenantId, userId, courseId])` (one per course). Program-term: NEW partial unique `(tenantId, userId, offeringId) WHERE courseId IS NULL` (one admission per term-offering). Re-enroll after DROPPED/WITHDRAWN: allow by clearing the prior row's `deletedAt`-based filter (TBD — likely "must soft-delete the prior terminal row first").
- **Q3.b** — Allow duplicates (re-takes as separate rows). Drop the program-term partial unique. More flexible, more cleanup burden.

### Q4 — `/admin/enrollments` page scope
- **Q4.a (Recommended)** — Full: list + filters + manual-enroll dialog + status transitions + soft-delete. Mirrors R3.a admin page pattern.
- **Q4.b** — Read + manual-enroll only; no status transitions in UI (transition via API only). Smaller; weaker admin UX.

### Q5 — `resultingEnrollmentId` back-link
- **Q5.a (Recommended)** — Add `StudentApplication.resultingEnrollmentId String? @unique`. Populated by the ENROLLED side effect → full application→student→enrollment trace, auditable + visible in the ApplicationsPage drawer.
- **Q5.b** — Skip; join through Student → User → Enrollment. Loses the direct trace.

---

## Dual-write / Cohort consideration (owner's explicit ask)

Schema discovery confirms: `Enrollment.cohortId` + `Enrollment.offeringId` **both exist + both optional**. The R2 dual-write era populates `cohortId` for legacy enrollments; `offeringId` is the modern surface.

**R4 decision (recommended):** new R4-created enrollments (program-term admissions from the ENROLLED side effect) populate **`offeringId` only**; `cohortId` stays null for them. We do NOT extend the R2 dual-write to mirror these into a Cohort — the dual-write interceptor's job is migrating *existing* Cohort↔Offering data during the Sunset window (drop date 2026-12-31), not back-filling new offering-native enrollments into the deprecated Cohort surface.
- Rationale: writing new data into the deprecated `cohortId` path would extend the legacy surface's lifetime + violate the Sunset intent. R4 enrollments are offering-native from day one.
- The existing dual-write (R2 `LegacySyncService`) is untouched by R4 — it continues mirroring Cohort writes for backward compat until the Sunset drop.
- **Confirm in Q-ack:** is this the owner's intent (R4 enrollments = offering-only, no cohort back-write)? Flagging because it's a migration-policy-adjacent call.

---

## State machine design (Q2.a, if picked)

```ts
const ALLOWED_TRANSITIONS: Record<EnrollmentStatus, EnrollmentStatus[]> = {
  ACTIVE:    ["COMPLETED", "DROPPED", "WITHDRAWN"],
  COMPLETED: [],   // terminal
  DROPPED:   [],   // terminal
  WITHDRAWN: [],   // terminal
};
```
`completedAt` stamped on → COMPLETED. Same `isLegalTransition` + illegal-transition-400 shape as R2/R3.b. D18 flow assertion covers happy path + illegal + terminal lock.

---

## Performance budget (D61 + D66)
- Main bundle delta < 50 KB.
- `/admin/enrollments` = own per-route lazy chunk (D66 Path D). NO admin manualChunks bucket.
- Post-deploy bundle measurement REQUIRED in `PHASE_B_R4_REVIEW.md` (main Δ + EnrollmentsPage chunk size, target < 25 KB + modulepreload verify on `/`, `/login`, `/programs`).
- Proactive ping if main Δ > 40 KB OR EnrollmentsPage chunk > 25 KB.

---

## D13 owner smoke (8-step, **D70 explicit-delete clause included**)
1. Login admin → `/admin/enrollments` renders + filters
2. Manual enroll: pick a Student + a CourseOffering → row appears, status ACTIVE
3. Status transition: ACTIVE → COMPLETED (verify `completedAt` set); illegal COMPLETED → ACTIVE → 400
4. Application-driven: set `targetOffering` on an ACCEPTED application drawer → transition to ENROLLED → verify (a) Student created, (b) Enrollment row created with offeringId set + courseId null, (c) `resultingEnrollmentId` linked in drawer
5. Student self-view: login student1 → `/enrollments/me` (or the existing surface) shows the program-term enrollment
6. **D70 explicit delete**: admin soft-delete an enrollment → row disappears + refresh absent + GET 404
7. Re-enroll after withdraw (Q3 behavior) works as decided
8. Phase A/R1/R2/R3 routes untouched; bundle vigilance (no admin chunk preloaded on `/`)

---

## Estimated scope (Q0.a)
| File | LOC |
|---|---:|
| `apps/api/prisma/schema.prisma` (Enrollment.courseId nullable + EnrollmentStatus enum + StudentApplication.targetOfferingId + resultingEnrollmentId + reverse rels) | +60 |
| migration SQL (`20260530000000_phase_b_r4_enrollment`) incl. partial unique index | +90 |
| `apps/api/src/university/enrollments/*` (admin controller + service + state machine + DTOs) | +480 |
| `ApplicationEnrollmentService` extension (create Enrollment in the transaction) | +70 |
| ApplicationsPage drawer target-offering selector | +90 |
| seed extension (1 program-term enrollment demo) | +50 |
| `apps/api/test/enrollments-r4.spec.ts` | +400 |
| `apps/web/src/api/endpoints.js` (enrollmentsAdminApi) | +60 |
| `apps/web/src/pages/admin/EnrollmentsPage.tsx` | +420 |
| sidebar + router (1 lazy route, NO bucket) | +12 |
| `apps/web/tests/visual/phase-b-r4-enrollments.spec.ts` | +300 |
| `docs/PHASE_B_R4_REVIEW.md` | +220 |

**Total: ~2,750 LOC** (Q0.a). Q0.b adds ~+800 (OfferingCourse join + fan-out). Q0.c adds ~+1,500 (new ProgramEnrollment model + parallel surface).

**Timeline: 5-7 days** (Q0.a), matches R3.a/R3.b cadence.

## Atomic commit breakdown (Q0.a)
1. **A** — schema (Enrollment.courseId nullable + EnrollmentStatus enum + targetOfferingId + resultingEnrollmentId + partial unique) + migration SQL + seed
2. **B** — Enrollments NestJS module (admin CRUD + state machine validator)
3. **C** — ENROLLED side-effect extension (create program-term Enrollment in the `$transaction` + populate resultingEnrollmentId) + targetOffering set path
4. **D** — API e2e spec (state machine + side effect + uniqueness + cross-tenant + manual enroll)
5. **E** — Frontend API + sidebar + EnrollmentsPage (list + filters + manual-enroll dialog + transition controls + soft-delete)
6. **F** — ApplicationsPage drawer target-offering selector
7. **G** — D12+D18 visual spec (incl. D70 explicit-delete) + review doc + bundle measurement

7 atomic commits (tighter than R3.b — single admin page + side-effect extension).

---

## What's OUT of scope for R4
- ❌ Course-level enrollment fan-out / OfferingCourse join (that's Q0.b territory)
- ❌ Grades / transcript generation (separate R)
- ❌ Enrollment capacity enforcement against `CourseOffering.capacity` (could be a small add — flag in Q-ack if wanted)
- ❌ Waitlist when offering is full
- ❌ Bulk enroll (CSV import)
- ❌ Cohort back-write (R4 enrollments are offering-only per the dual-write decision above)

---

## Status
| Item | Status |
|---|---|
| Schema discovery | ✅ precise (surfaced Q0 mismatch) |
| Memo | ✅ this file |
| **Q0 architecture decision** | ⏳ owner MUST resolve first |
| Q1–Q5 | ⏳ owner ack (staged under Q0.a) |
| Code (A–G) | ⏳ NOT STARTED |
| Deploy + D29 + D13 | ⏳ owner-executed post-code |

**Re-ack format:** «Q0.a Q1.a Q2.a Q3.a Q4.a Q5.a شروع» (all defaults) — or pick Q0.b/Q0.c (triggers scope revision) + any Q1-Q5 overrides. Also confirm the dual-write decision (R4 enrollments = offering-only, no cohort back-write).

— Phase B R4 kickoff, 2026-05-28. Q0 is the gate: the "smallest lift" framing holds under Q0.a; Q0.b/Q0.c are larger. Owner decides.
