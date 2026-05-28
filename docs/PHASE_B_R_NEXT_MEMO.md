# Phase B R-Next — Direction Planning Memo

**Author:** Phase B (post-R3.b-close, D72)
**Date:** 2026-05-28
**Status:** ⏳ DRAFT — awaiting owner direction (pick a candidate) before a scoped sub-R memo is written
**Workflow:** THIS planning memo → owner picks candidate → full scoped memo (schema discovery + Q-decisions) → ack → code (D61 Constraint #1)
**Predecessor:** Identity track (R3.a + R3.b) complete per D72. See `PHASE_B_RETROSPECTIVE.md`.

---

## Purpose

Identity track is done — applicants can be submitted, reviewed (verification-gated), accepted, and promoted to Student/Instructor. But there's a **functional gap discovered at D72**: the ENROLLED side effect creates a Student *roster identity* but never an **Enrollment** (the row that ties a Student to a CourseOffering/Cohort — i.e., actually registers them in a course). The apply→accept→**enroll**→learn spine is broken at the enroll step.

This memo lays out the three R-Next candidates the owner named, sketches each, and recommends a sequencing. It is intentionally NOT a scoped implementation memo — once the owner picks a direction, a full memo (with schema discovery + locked Q-decisions) follows per the standard process.

---

## The three candidates

### Candidate A — Content track: Course/Module/Lesson enrichment

**What:** Enrich the existing `Course → CourseModule → Lesson` hierarchy with the fields a real LMS needs: learning objectives, prerequisites, credit hours validation, lesson ordering UI, content-type tagging (video/reading/quiz-link), module completion criteria. Likely additive (§4) onto existing models + a couple of greenfield child tables (e.g., `LearningObjective`, `Prerequisite`).

**Why it matters:** Courses currently exist as thin shells (code + title + credits). To deliver actual learning, they need structure.

**Dependencies:** None blocking — Course/Module/Lesson already exist from Phase 3. Independent of the Identity track.

**Rough size:** ~3,500-4,500 LOC, 7-9 days. Admin authoring UI is the heavy part (drag-reorder lessons, rich module editor).

**Risk:** Authoring UX is the most design-heavy work in Phase B so far; could spawn its own sub-Rs.

---

### Candidate B — Enrollment lifecycle (RECOMMENDED)

**What:** Close the D72 gap. Make the ENROLLED side effect create a real `Enrollment` row (Student → CourseOffering, with status). Build the admin Enrollments surface + the missing pieces:
- Extend `ApplicationEnrollmentService.enrollStudent()` to create an `Enrollment` (into the program's current/default `CourseOffering`, or a chosen one) inside the same `$transaction`.
- `/admin/enrollments` admin page (the model + a student-facing `enrollmentsApi.listMine` already exist from Phase 3 — no admin CRUD page yet).
- Enrollment status lifecycle (active → completed → dropped → withdrawn) — likely a small state machine reusing the R2/R3.b pattern.
- Wire `StudentApplication.resultingEnrollmentId` (a field the R3.b memo sketched but the implementation dropped) so the application → enrollment trace is complete.
- Manual admin enroll/unenroll (enroll an existing Student into an offering without going through an application).

**Why it matters:** This is the **completion of the core university spine** (apply → accept → enroll → learn). It's also the smallest lift relative to impact because it reuses R3.b's transactional side-effect pattern + the existing Enrollment model. It directly closes the D72 accuracy gap rather than leaving it as latent debt.

**Dependencies:** Builds directly on R3.b's `ApplicationEnrollmentService` + the existing `Enrollment` model + R2's `CourseOffering`. All prerequisites shipped.

**Rough size:** ~2,800-3,400 LOC, 5-7 days. Mostly backend + one admin page (matches R3.a/R3.b cadence).

**Risk:** Low — well-trodden patterns. The one judgment call is "which offering does an accepted applicant enroll into?" (Q-decision below).

---

### Candidate C — Applicant self-service UX (R3.c deferred from R3.b)

**What:** Build the applicant-facing front door that R3.b deferred. The public submission API (`POST /v1/applications/student|instructor`) + `/me` + WITHDRAW all exist; this candidate builds the browser UI on top: a public application form (no login), an applicant status page ("your application is UNDER_REVIEW"), a withdraw button, and the email-claim landing page stub.

**Why it matters:** Right now only admins can drive the application flow via the admin inbox. Real applicants have no UI. This makes the public submission endpoint actually reachable by humans.

**Dependencies:** Backend complete (R3.b). Pure frontend + a public route (no auth). Would also benefit from R-Notif (the password-claim email) but can ship with the stub.

**Rough size:** ~2,500-3,000 LOC, 5-6 days. New public (anon) route surface is the novel part — first non-admin, non-authenticated page in the workspace shell since the landing page.

**Risk:** Medium — public anon routes need careful handling in the AppShell route classification (currently public = landing/login/programs/admissions only). Adds a new route kind.

---

## Recommendation: Candidate B (Enrollment lifecycle) first

**Reasoning:**
1. **Closes the D72 gap** — the Identity track currently produces "Students who aren't enrolled in anything". That's a real incompleteness in the core flow, not a nice-to-have.
2. **Smallest lift / highest spine-completion** — reuses R3.b's exact transactional pattern; the Enrollment model + student API already exist. Mostly "wire the last connection + one admin page".
3. **Unblocks downstream** — once enrollment works, candidate A (content) has students to deliver content to, and candidate C (applicant UX) has a complete backend story to surface ("you've been enrolled in CS101").
4. **Natural sequencing:** B (complete the spine) → C (open the front door) → A (fill courses with content). Each builds on the prior.

**If the owner prefers a different order**, all three are viable independently; B is just the lowest-risk highest-leverage starting point given the D72 finding.

---

## Q-decisions (for whichever candidate is picked — staged for B since it's recommended)

These are the open questions for **Candidate B** specifically. If the owner picks A or C instead, a fresh Q-set comes with that candidate's scoped memo.

### Q1 — Which CourseOffering does an accepted applicant enroll into?
- **Q1.a (Recommended)** — `StudentApplication` gains an optional `targetOfferingId` (admin sets it during review, before ACCEPTED). ENROLLED side effect enrolls into that offering. If null at ENROLLED time, create the Student but skip the Enrollment (admin enrolls manually later) — preserves the current behavior as the fallback, no regression.
- **Q1.b** — Auto-pick the program's current OPEN offering (most recent by startDate). Magic, but brittle if multiple offerings are OPEN.
- **Q1.c** — Always manual: ENROLLED never auto-enrolls; admin always enrolls via the new `/admin/enrollments` page in a separate step.

### Q2 — Enrollment status lifecycle
- **Q2.a (Recommended)** — Small state machine reusing the R2/R3.b pattern: `ACTIVE → COMPLETED | DROPPED | WITHDRAWN` (the `Enrollment.status` string field already exists with these values as free-text from Phase 3; formalize with a state machine guard).
- **Q2.b** — Keep status as free-text string (no state machine) for R-Next; formalize later. Lower effort, less safety.

### Q3 — Enrollment uniqueness
- **Q3.a (Recommended)** — One active Enrollment per (Student, CourseOffering). Re-enrolling after DROPPED is allowed (new row OR un-drop the existing — TBD in scoped memo). The existing `@@unique([tenantId, userId, courseId])` on Enrollment already enforces one-per-course; confirm it plays with the offering dimension.
- **Q3.b** — Allow multiple (re-takes as separate rows). More complex; defer.

### Q4 — Manual admin enroll surface
- **Q4.a (Recommended)** — `/admin/enrollments` page: list + filter by offering/status + "enroll a student" dialog (pick Student + pick CourseOffering) + status transition controls + soft-delete. Mirrors the R3.a admin page pattern.
- **Q4.b** — Defer the admin page; only the ENROLLED side effect creates enrollments in R-Next. Smaller, but leaves admins without a direct enroll tool.

### Q5 — `resultingEnrollmentId` back-link on StudentApplication
- **Q5.a (Recommended)** — Add the `resultingEnrollmentId String?` column (the R3.b memo sketched it but the implementation dropped it). Populated by the ENROLLED side effect so the application → student → enrollment trace is complete + auditable.
- **Q5.b** — Skip the back-link; rely on joining through Student. Loses the direct trace.

---

## Process reminders (carried from PHASE_B_RETROSPECTIVE.md §5.1)

Whichever candidate is picked, the scoped memo + execution follow the settled contract:
- Memo includes a **schema discovery table** (greenfield §2 / additive §4 / modification §3 classification) before lock.
- **Migration SQL hand-authored** in Commit A (schema edit alone doesn't reach production).
- **Per-route lazy chunking** (D66 Path D) — no admin manualChunks bucket; bundle measurement in the review doc.
- **D13 smoke includes explicit delete/destroy** per surface (D70 binding).
- **Deploy is owner-executed** via `remote.ps1` (D71/D72 — session SSH unreliable). Implementer ships to `main` + local bundle measurement + review doc with the full deploy/smoke recipe.
- `tsc --noEmit` + `prisma validate` + `prisma generate` clean before each commit.

---

## Status

| Item | Status |
|---|---|
| Identity track (R3.a + R3.b) | ✅ closed (D70 + D72) |
| Phase B retrospective | ✅ `PHASE_B_RETROSPECTIVE.md` |
| R-Next direction | ⏳ owner picks A / B / C |
| Scoped R-Next memo | ⏳ after direction picked |
| D72 Enrollment gap | ⏳ closed by Candidate B (if picked) |

**Re-ack format:** «R-Next = B، شروع memo» (or «A» / «C», or a custom blend / different priority). If B, the scoped memo will lock Q1–Q5 above.

---

— Phase B R-Next planning, 2026-05-28. Recommendation: Candidate B (Enrollment lifecycle) to close the D72 spine gap. Owner decides direction.
