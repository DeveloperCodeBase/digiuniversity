# Phase B R6 — Direction Planning Memo (R-Next, round 2)

**Author:** Phase B (post-R4-close D75, post-R5-close D78)
**Date:** 2026-05-30
**Status:** ⏳ DRAFT — for owner review. Pick a direction → a full scoped memo (schema/code discovery + Q-decisions) follows per the standard contract (D61 #1).
**Supersedes:** `docs/PHASE_B_R_NEXT_MEMO.md` (2026-05-28). That memo's recommendation — **Candidate B, Enrollment lifecycle** — *shipped as R4 and is acked at D75*. Its other two candidates (A content, C applicant UX) are carried forward here, and **R-CI-Cleanup** is added as a third (debt) candidate per `docs/PHASE_B_CI_DEBT_REPORT.md`.
**Inputs read:** `PHASE_B_RETROSPECTIVE.md` (§4 lessons, §5 contract), `PHASE_B_CI_DEBT_REPORT.md`, the Compass Roadmap (`~/.claude/plans/…compass…partitioned-eclipse.md`, Phase B/C definitions), D72/D75/D76/D78.

---

## Where we are

The **Identity → Enrollment spine is connected end-to-end on the backend**:

- **R3.a** (D70) — Profile + Student + Instructor + `SelfOrAdminGuard`.
- **R3.b** (D72) — StudentApplication + InstructorApplication (parallel state machines) + Q4.a verification gate + Q8.a public submission API + transactional ENROLLED side effect.
- **R4** (D75) — closed the D72 gap: ENROLLED now creates a real **Enrollment** (program-term, two-shape `courseId`-nullable model), `/admin/enrollments` admin surface, service-layer state machine, `resultingEnrollmentId` back-link.
- **R5** (D78) — `deploy-and-smoke.ps1` (one-command deploy + smoke + bundle gate).

**The one thing that is still missing to make all of this real for humans:** every step above is **admin-operated**. The public submission API exists (`POST /v1/applications/student|instructor`, `/me`, WITHDRAW) but **no applicant-facing UI exists** — a real applicant cannot apply, check status, or withdraw from a browser. The front door is built in the backend but has no handle on the outside.

So the three live candidates are the ones the owner named, with B removed (shipped):

| | Candidate | One-line | Roadmap home |
|---|---|---|---|
| **C** | Applicant self-service UX | The public front door (apply / status / withdraw UI) — R3.c, deferred from R3.b | **Phase B (Onboarding)** — *closes the current phase* |
| **A** | Content enrichment | Course/Module/Lesson objectives + prereqs + authoring UI | **Phase C (Core Learning Loop)** — *opens the next phase* |
| **R-CI** | R-CI-Cleanup | Flip the red CI green: 198 web typecheck errors + API jest | Cross-cutting quality policy (not a phase deliverable) |

---

## The three candidates

### Candidate C — Applicant self-service UX (R3.c)

- **What:** Build the browser UI on top of the already-shipped public API. A public (no-login) application form for student + instructor; an applicant status page («درخواست شما UNDER_REVIEW است»); a self-withdraw button; the password-claim landing-page stub. The first **anonymous workspace route** since the landing page.
- **Why it matters:** Today the entire apply→accept→enroll funnel is admin-only. C is what **turns on** the whole R3.a + R3.b + R4 investment for real users. Highest value-per-LOC of the three because the backend is *done* — this is "build UI against a complete, tested backend."
- **Scope & size:** ~2,500–3,000 LOC, **5–6 days**. Mostly frontend + one new public route kind. No schema work expected (backend complete); a small amount may appear if the status page needs a public read endpoint.
- **Dependencies:** Backend complete (R3.b). **Soft** dependency on R-Notif (the real password-claim email) — but C ships against the NotificationLog stub exactly as R3.b did, so it is **not blocked**.
- **Risk:** **Medium**, and the risk is *concentrated in one known place*: the AppShell route classification currently knows PUBLIC / AUTH_FLOW / WORKSPACE, where PUBLIC = landing/login/programs/admissions only. C introduces an **anonymous, form-bearing workspace-adjacent route** — a new route kind. Memory `feedback_phase14_7_lessons` (route classification gates auth + visual) + `feedback_manual_smoke_required` both bear on this. Everything else is well-trodden form/validation/toast work.

### Candidate A — Content enrichment (Course/Module/Lesson)

- **What:** Enrich the thin `Course → CourseModule → Lesson` shells with what an LMS needs: learning objectives, prerequisites, credit-hour validation, lesson-ordering UI, content-type tagging, module completion criteria. Likely additive (§4) onto existing models + 1–2 greenfield child tables (`LearningObjective`, `Prerequisite`) + a real authoring UI.
- **Why it matters:** Courses currently exist as code+title+credits shells. To deliver actual learning you need structure. High eventual value — but it serves the *bottom* of the funnel (content), whereas C serves the *top* (intake).
- **Scope & size:** ~3,500–4,500 LOC, **7–9 days** — the largest of the three. The authoring UX (drag-reorder lessons, rich module editor) is the heaviest design work in Phase B so far and **could spawn its own sub-Rs**.
- **Dependencies:** None blocking — Course/Module/Lesson exist from Phase 3, independent of the Identity track. (Note: students *can* already reach content — R4 lets admins enroll students manually — so A is not blocked by C.)
- **Risk:** **Medium**, but a *different shape* than C: the risk is **design/scope sprawl** (authoring UX), not a novel architectural seam. Highest chance of the three to exceed its estimate.

### Candidate R-CI-Cleanup — flip CI green

- **What:** Clear the **198 web typecheck errors** + investigate/fix the **API jest** failure so CI goes green for the first time since R0.5. Per the characterization report, ~59% (117/198) fall in three codemod-friendly buckets — `useState({})` inference (~30), toast-contract drift (~30), implicit-any params/binding (~77 TS7006/TS7031), `err: unknown` narrowing (~10) — the rest are per-file manual.
- **Why it matters:** CI has been **red on every commit since R0.5** (pre-existing debt, *not* a regression — R3.a/R3.b/R4 contributed **0** of the 198). A green CI: (1) satisfies the Compass cross-cutting "anti-vasle-pinneh" mandate ("TypeScript passes / tests green before every commit"); (2) removes the "is this red mine or pre-existing?" noise on every push; (3) unlocks the **follow-on R-Infra-v2** that tightens the R5 deploy gate from *lean-deployability* to *full CI* — i.e. it completes the infra/quality thread R5 started.
- **Scope & size:** **3–5 days** (20–30h, lower with a ts-morph codemod for buckets A/C/D). Per-file atomic commits, monotonically decreasing error count.
- **Dependencies:** None. Pure typecheck/jest; no API/UI/runtime change. **No deploy needed** until (optionally) the final commit.
- **Risk:** **Low** — the surface is fully characterized, quarantined to legacy Phase-14.5-era files, and the lean deploy gate already guarantees deployability independent of it. The only unknown is the **API jest** failure (needs a local Postgres repro; could split into R-CI-Cleanup-Api if structural — see report §3 Option 2).

---

## Compass Roadmap alignment (which candidate is closest)

This is the most decision-relevant lens, because the roadmap sequence is *locked* (Phases A→F) and the same "finish the current phase before opening the next" discipline that gated **Gate-A-before-Phase-B** (D44/D25) applies here.

| Candidate | Roadmap location | Alignment verdict |
|---|---|---|
| **C — Applicant UX** | **Phase B** explicitly = "Academic Hierarchy **+ Onboarding**" with StudentApplication/InstructorApplication + XState machines. The applicant-facing onboarding UI is the **missing user-visible half of Phase B's own definition.** | ✅ **Closes the current phase.** Most aligned. |
| **A — Content** | **Phase C** = "Core Learning Loop" explicitly lists **Module, Lesson, LessonContent, Asset, Progress…**. Candidate A *is* Phase C work. | 🟡 Roadmap-aligned but **jumps ahead** to the next phase before B is closed. |
| **R-CI** | Not a phase deliverable. Serves the cross-cutting **anti-vasle-pinneh** policy ("TypeScript passes, tests green before every commit") that applies to *every* phase. | ⚪ Roadmap-**supporting** (quality bar), not roadmap-**advancing** (feature). |

**Takeaway:** only **C** finishes Phase B. **A** is the correct *next* thing after Phase B closes — but starting it now means opening Phase C with Phase B's onboarding still half-built. **R-CI** is phase-agnostic hygiene that can slot anywhere.

---

## Debt-first or feature-momentum? (the explicit question)

**My answer: debt-second, not debt-first — do R-CI-Cleanup *after* C and *before* A, not ahead of all feature work.** Reasoning:

**Why NOT strictly debt-first (ahead of everything):**
1. **The debt is static, not growing.** R3.a/R3.b/R4 each added **0** of the 198 errors — new work is already clean. The red CI is *legacy sediment*, not an active leak. Debt-first is most justified when debt compounds with each feature; here it doesn't.
2. **It blocks nothing functional.** The R5 lean deploy gate (vite build + prisma migrate + api tsc build) already guarantees deployability. Red CI today is a *hygiene/visibility* cost, not a *shipping* cost.
3. **Momentum / sequencing optics.** R5 was already a non-feature (tooling) sub-R. Stacking R-CI-Cleanup immediately after = **two consecutive non-feature sub-Rs**, deferring user-visible value while the owner's stated priority is a "production-quality finish" — which is most visible through the front door (C), not a green check mark.

**Why NOT defer it indefinitely either:**
4. **Do it before A, the big web-surface push.** A is the largest sub-R (~4k LOC, authoring UI) and adds many new web files. Entering A on a **green-CI baseline** means every new error A introduces is instantly visible against zero — exactly the regression-catching value CI is for. Entering A on a 198-error baseline buries new errors in old noise.
5. **It completes the R5 thread.** Green CI is the prerequisite for the R-Infra-v2 full-CI gate tighten that R5/D76 explicitly deferred. Doing it as the R6→A bridge closes that loop cleanly.

So: **C (close Phase B) → R-CI-Cleanup (green baseline + finish infra thread) → A (open Phase C on clean CI).**

---

## Recommendation: Candidate C first

**Sequence: C → R-CI-Cleanup → A.**

**Why C is the first sub-R:**
1. **It closes the current roadmap phase.** C is the only candidate inside Phase B's own definition (Onboarding). A opens Phase C; finishing B first respects the locked sequence (same discipline as Gate-A-before-Phase-B).
2. **It is the highest-leverage, lowest-backend-risk option.** R3.a + R3.b + R4 built a complete, tested intake+enrollment backend that **no human can currently reach.** C is "UI on a finished backend" — the cheapest way to convert the largest amount of already-shipped work into user-visible product. Without C, the entire Identity+Enrollment investment stays admin-only.
3. **It returns to feature delivery after a tooling sub-R (R5).** Matches the owner's production-finish priority and keeps user-visible momentum.
4. **Its risk is bounded and known** — the single novel seam is the anonymous route in AppShell, which becomes the headline Q-decision in C's scoped memo. Everything else is standard form/validation/status-page work.

**Why C also satisfies the R5 Phase-2 trigger (D78):** C ships a runtime change and deploys via `deploy-and-smoke.ps1` through the full path (build → up → migrate? → seed → health → smoke → bundle), so the first R6 = C **closes R5 D13 in full** as the owner specified. (Contrast: if R-CI-Cleanup were R6, it is typecheck-only with no migration/seed/runtime change — it would *not* fully exercise the deploy script, so R5 D13 Phase-2 would keep waiting. Another reason to put a feature sub-R first.)

**If the owner prefers a different order**, all three are viable independently:
- **Owner wants the next user-facing milestone fastest →** C (and it closes Phase B).
- **Owner wants the platform's quality bar green before any more features (debt-first) →** R-CI-Cleanup first; accept two non-feature sub-Rs in a row and that R5 D13 Phase-2 waits for the following deploy.
- **Owner wants to start the learning-content build now (accept opening Phase C early) →** A; but expect the longest, most design-heavy sub-R and possible sub-R spawning.

---

## Q-decisions preview — staged for C (the recommendation)

Open questions for **Candidate C** specifically. If the owner picks A or R-CI-Cleanup instead, a fresh Q-set comes with that candidate's scoped memo (and C's scoped memo will run full schema/route discovery to confirm these before locking).

### Q1 — How does the anonymous applicant route live in AppShell? *(the headline risk)*
- **Q1.a (Recommended)** — Add a new route classification `PUBLIC_FORM` (or extend PUBLIC) for `/apply` + `/apply/status` that renders the public chrome (no sidebar, no auth gate) like landing/login. Status page reachable by a tokenized link or by re-entering email + tracking code (no login).
- **Q1.b** — Reuse the existing PUBLIC classification as-is; gate the form purely at the page level. Less explicit; risk of the AppShell auth gate redirecting anon users.
- **Q1.c** — Put the applicant flow behind a lightweight "applicant" pseudo-session. Heavier; introduces an auth concept Phase B doesn't otherwise need.

### Q2 — Applicant status lookup without a login
- **Q2.a (Recommended)** — On submit, issue a tracking code + (stub) email; status page accepts email + tracking code → calls a `@Public` read endpoint scoped to that tuple. No account required.
- **Q2.b** — Require the applicant to register/login to view status. Conflicts with the Q8.a anonymous-applicant convenience; defer.

### Q3 — Withdraw from the applicant side
- **Q3.a (Recommended)** — Reuse the existing SelfOrAdmin WITHDRAW path (D69 in-service variant) keyed off the same email + tracking-code proof used for status.
- **Q3.b** — Admin-only withdraw (status quo). Leaves the applicant unable to self-withdraw — defeats part of C's purpose.

### Q4 — Password-claim landing on ENROLLED
- **Q4.a (Recommended)** — Ship the claim **landing page stub** wired to the NotificationLog stub (same pattern R3.b used). Real email send stays deferred to R-Notif. Page renders with a visible `source: "mock"`/«نمونه» badge per the Compass no-silent-mock rule.
- **Q4.b** — Skip the claim page until R-Notif. Leaves a dead-end after ENROLLED for self-service applicants.

### Q5 — Form scope: student-only or both shapes in R6?
- **Q5.a (Recommended)** — Ship **both** student + instructor public forms (the backend supports both; the parallel state machine is symmetric). One sub-R, two forms sharing a component.
- **Q5.b** — Student form only in R6; instructor form as a fast-follow. Smaller, but leaves the instructor intake admin-only.

---

## Process reminders (carried from `PHASE_B_RETROSPECTIVE.md` §5.1, updated for R5)

Whichever candidate is picked, the scoped memo + execution follow the settled contract:
- **Schema/code discovery table** (greenfield §2 / additive §4 / modification §3) before lock — and verify every memo assumption against the actual repo (the "four-for-four" pre-deploy-catch discipline, retrospective §4.6). For C this is light (backend done) but the **AppShell route classification** must be discovered in code before Q1 locks.
- **Migration SQL hand-authored** in Commit A if any schema change appears (retrospective §4.3 — schema edit alone never reaches production).
- **Per-route lazy chunking** (D66 Path D) — no admin/feature manualChunks bucket; the **R5 bundle gate (8.5/8.6)** now enforces this automatically (modulepreload allow-list + +40/+50 KiB delta vs `BUNDLE_BASELINE.json`).
- **D13 smoke includes explicit delete/destroy/withdraw** per surface (D70 binding). For C: the applicant self-withdraw is the destructive path to exercise.
- **Deploy via `deploy-and-smoke.ps1`** (R5/D78) — the first R6 real deploy through the full path **closes R5 D13 Phase-2**. Owner does only the final ~2-min mobile visual.
- `tsc --noEmit` + `prisma validate` + `prisma generate` clean before each commit (note: web `tsc` still carries the 198 legacy errors until R-CI-Cleanup — keep new files clean and measure the count doesn't rise).

---

## Status

| Item | State |
|---|---|
| Identity track (R3.a + R3.b) | ✅ closed (D70 + D72) |
| Enrollment spine (R4) | ✅ closed (D75) — D72 gap resolved |
| Deploy-and-smoke script (R5) | ✅ memo-level closed (D78); D13 Phase-2 awaits first R6 real deploy |
| Prior R-Next memo's Candidate B | ✅ shipped as R4 (this memo supersedes it) |
| **R6 direction** | ⏳ **owner picks C / A / R-CI-Cleanup** (recommendation: C) |
| Scoped R6 memo | ⏳ after direction picked |

**Re-ack format:** «R6 = C، شروع memo» (or «A» / «R-CI», or a custom order). If C, the scoped memo locks Q1–Q5 above (with Q1 the headline anon-route decision).

---

— Phase B R6 direction planning, 2026-05-30. Recommendation: **Candidate C (Applicant self-service UX)** first — it closes Phase B's onboarding half, turns the admin-only intake/enrollment backend into a real public front door, and (as a deploying sub-R) closes the R5 D13 Phase-2. Then R-CI-Cleanup (green baseline + R5/infra thread), then A (open Phase C on clean CI). Owner decides direction.
