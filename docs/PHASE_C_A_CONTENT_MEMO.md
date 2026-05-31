# Phase C / Candidate A — Content Enrichment — Memo

**Status:** ⏳ DRAFT — awaiting owner ack before any code (schema-discovery done; scope + Q-decisions below).
**Phase:** opens **Phase C — Core Learning Loop** (per Compass). First sub-R after Phase B closure.
**Predecessor:** R-CI-Cleanup CLOSED (D89) — full-CI deploy gate is green + active, so A starts on a real green baseline (this was the locked D79 reason R-CI came before A).
**Sequence (D79):** Candidate C ✅ → R-CI ✅ → **A** (this).
**Discovery:** 8-agent schema/codebase sweep (read-only). Findings cited inline with `file:line`.

---

## 0. Phase B → C transition

Phase B closed the **onboarding** loop (anon apply → track → admin review → accept → Student → enrolled). Phase C builds the **learning** loop: enrolled student → opens course content → progresses → is assessed. The Compass defines Phase C ("Core Learning Loop") as ~20 additive models (Module, Lesson, **LessonContent, Asset, Progress**, Bookmark, Note, Highlight, Assignment, Quiz, QuizAttempt, Question, QuestionResponse, Rubric, RubricCriterion, Gradebook*, Grade, DiscussionThread/Post) + a Quiz|Assignment split + a stubbed video pipeline + a gradebook + a transcript PDF — i.e. **the whole phase is far larger than one sub-R**. Candidate A is the **opening slice**, not all of Phase C. (`PHASE_B_RETROSPECTIVE.md:211-217`; `PHASE_B_R6_PLANNING_MEMO.md:42-48,67`.)

---

## 1. Schema discovery (mandatory Phase B lesson #1)

### The headline: the content hierarchy ALREADY EXISTS — it is just unwired

`Course → CourseModule → Lesson` has existed since **Phase 3** (`20260520010000_university_domain`). All three are fully modelled — tenant-scoped, soft-deletable, audit-stamped, with `orderIndex` on both child levels (`schema.prisma:336-410`). **This is NOT greenfield.** But the wiring is ~30% complete:

| Layer | State today |
|---|---|
| Schema | ✅ Course/CourseModule/Lesson complete. `Lesson.contentMarkdown String?` is the **only** content payload — no blocks, no content-type, no status, no objectives/prereqs. |
| Read API | ⚠️ ONLY `CoursesController.getById` nests `modules → lessons` (`courses.controller.ts:88-113`) — and it **omits `contentMarkdown`** (selects id/title/orderIndex/durationMinutes). `list()` returns `_count.modules`. |
| Write API | ❌ **None.** `CourseModule`/`Lesson` have no controller/service/DTO. The only writers anywhere are `seed.ts:390-423`. No create/update/delete/**reorder**. |
| Authz | ❌ `CourseModule`/`Lesson` are **not CASL subjects** (`ability.types.ts:41-68`); a design comment anticipates them (`ability.factory.ts:25`) but no rule exists. |
| Frontend | ⚠️ `Course.tsx` renders a **hardcoded mock** whose shape doesn't match Prisma (`Course.tsx:98-192`). `CourseLive.tsx` IS API-backed but can't show bodies (API omits `contentMarkdown`). |

So **A's bulk is write-surface + frontend, not schema**: mirror the thin `courses/` pattern into `course-modules/` + `lessons/` Nest modules (CRUD + a transactional reorder), add CASL subjects, serve `contentMarkdown` through a gated endpoint, and build a real authoring UI + learner render to replace the mock.

### §3 reshape vs §4 additive (MIGRATION_POLICY)

Per `MIGRATION_POLICY.md` §0 decision-tree + the binding §3:67 precedent ("a nullable column on a pre-existing model is **§4 Additive, not §3**" — the Faculty.schoolId rule): adding nullable/defaulted columns to the existing `CourseModule`/`Lesson` is **§4 additive** (cheap, no dual-write). New child tables (LessonContent, Asset, LearningObjective, Progress…) are **§2 Greenfield** (no existing rows → no dual-write). **A stays in the cheap lane.** What would flip it to expensive §3 (avoid unless proven): splitting `contentMarkdown` into a blocks table + migrating existing rows, changing an existing FK cascade, or a NOT-NULL-without-backfill. (`migration-policy` thread.)

---

## 2. Attach point — content belongs to Course (decided by the schema)

`Course`, `Cohort`, and `CourseOffering` are **siblings** under `Program` — not a (template, instance) pair. `CourseOffering` has `programId` but **no `courseId`** (it's the Cohort successor / term container, `schema.prisma:931-976`). The schema states it outright: *"Course content: Course → CourseModule → Lesson"* (`schema.prisma:196-198`). So **content attaches to Course**; there is literally no FK to hang it on `CourseOffering`.

⚠️ **Caution (Q-flag):** if any requirement implies content should differ **per term/offering** (per-term syllabus, versioned materials), that is **net-new schema** (a `courseId` on CourseOffering, an `OfferingCourse` junction, or a content-version model) — a separate decision, **STOP + ping**, not part of A.

---

## 3. The student content gate (the subtle one)

`Enrollment` is **dual-shape** (`schema.prisma:447-505`): course-level (`courseId` set) **XOR** program-term (`offeringId` set, **`courseId` NULL**). The **primary production student** — minted by the ACCEPTED→ENROLLED side effect (`application-enrollment.service.ts:132-162`) — is **offering-scoped with `courseId` null**.

Today there is **no content gate**: `GET /courses/:id` returns full modules+lessons to any tenant member (`courses.controller.ts:88`), and CASL deliberately grants students broad Course read (catalogue browsing, `ability.factory.ts:42-50`). The only enrollment-access precedent — live-class `ensureCanJoin` — gates by `courseId + status:'active'` (`class-sessions.service.ts:44-64`), which is **blind to program-term students** (it wrongly locks out exactly the applicants admissions just enrolled — a latent bug A should fix).

**A must build a shared resolver** `hasContentAccess(tenantId, userId, courseId)` = true if **(active course-level enrollment on courseId)** OR **(active program-term enrollment whose `offering.programId === course.programId`)**, with staff bypass. Apply it to the new gated lesson-content endpoint (and retrofit live-class). **Q-decision (gate granularity):** a program-term admission unlocks **(a) ALL courses in `offering.programId`** [implementable now, no new schema — **recommended v1**] or **(b)** a curated subset via a new `OfferingCourse` junction (§2). (`enrollment-access` thread.)

---

## 4. Scope — tight MVP, and a sub-R split (the anti-sprawl plan)

The prior planning memo already sizes the *narrow* A at **~3.5–4.5k LOC / 7–9 days**, calls the **authoring UX the highest-risk, most-likely-to-overrun** part, and says A "could spawn its own sub-Rs" (`PHASE_B_R6_PLANNING_MEMO.md:48`). Discovery confirms it. So this memo **pre-authorizes splitting A into sub-Rs** rather than one monolith, and recommends a **tight A.1**:

**Recommended A.1 (the minimal content loop) — "make the thin shell real, end-to-end":**
- Backend: `course-modules/` + `lessons/` Nest modules — CRUD + **transactional reorder** (mirror the thin `courses/` pattern); DTOs; `@AuditAction` strings; new CASL subjects + factory rules.
- Backend: the **dual-shape content gate** (`hasContentAccess`) + a **gated `GET …/lessons/:id`** that finally serves `contentMarkdown`; retrofit the live-class gate to the same resolver.
- Schema (§4, minimal): `Lesson.contentType` enum (video/reading/quiz-link/file) + a publish flag/status so students see only published content. (No blocks model yet.)
- Frontend: a real **authoring UI** (replace `Course.tsx` mock — module/lesson editor + drag-reorder) + a **learner render** of real lessons (extend `CourseLive.tsx`) + `modulesApi`/`lessonsApi` in `endpoints.js`.
- e2e: api-jest spec mirroring `course-offerings.spec.ts`.

**Deferred to later Phase-C sub-Rs (A.2+), explicitly OUT of A.1** so the estimate holds:
- A.2 — typed rich content: `LessonContent` blocks + `Asset` (§2) + the real authoring block editor.
- A.3 — `LearningObjective` (Bloom-tagged, per `Authoring.jsx`) + module completion criteria + **`Progress`** (the D18 "first lesson → progress recorded" flow + the done/current/locked map).
- A.4+ — `Prerequisite` validation; the Quiz|Assignment **dual-write split** + Rubric + Gradebook + transcript PDF (**extends the EXISTING `Assessment→Question→Submission` spine** `schema.prisma:608-682`, so cheaper + separable); Bookmark/Note/Highlight; Discussion. Real **video/file storage** = its own media sub-R (see Q7).

> The design mockups (`docs/my-upload/landing-page/src/pages/{Authoring,Course,Instructor,Classroom}.jsx`) map the **full** Phase C+D+E surface (authoring studio, live class, AI review queue, AI planner). Only the **Authoring blueprint/outline + Course module-map** concepts are A-scope; **route live-class + AI pieces to Phase D/E.** Preserve the mockups' governance rule — *"nothing publishes without instructor final approval"* (`Authoring.jsx:106`) — as a constraint, but the AI itself is Phase E.

---

## 5. Q-decisions (discovery-informed; owner confirms/adjusts)

| # | Decision | Options | Recommendation |
|---|---|---|---|
| **Q1** | A.1 scope / sub-R split | (a) minimal content loop [above] · (b) discovery MVP-core (blocks+objectives+progress+gate, ~7-9d) · (c) broader | **(a)** — tightest; de-risks the authoring sprawl; ships a working loop fast |
| **Q2** | Content representation in A.1 | keep `Lesson.contentMarkdown` (+ a `contentType` enum, §4) · OR add `LessonContent`/`Asset` blocks (§2) now | **markdown + `contentType` enum** in A.1; blocks → A.2 |
| **Q3** | Attach point | Course (only schema-possible option) | **Course** (confirmed by `schema.prisma:196`) — flag per-term-content as separate |
| **Q4** | Student gate granularity | (a) program-term unlocks ALL courses in program · (b) `OfferingCourse` junction (§2) | **(a)** v1 + the shared `hasContentAccess` resolver |
| **Q5** | Authoring actor + ownership | (a) admin + any-instructor (status-quo `@Roles`, tenant-wide) · (b) admin + `content_manager` · (c) instructor-owns-their-courses (NEW ownership guard) | **(a)/(b)** v1; defer record-level ownership (it needs the Course↔Offering↔Program indirection fix — see §6) |
| **Q6** | Content lifecycle | draft→published→archived state machine (enum, reuse the triad) · OR a simple `isPublished` flag | **simple publish flag** in A.1; full lifecycle → later |
| **Q7** | Video/file handling | external-link-first (defer storage, like R6 deferred R-Notif) · OR upload→storage now | **external-link-first / stub** (three-backend mock policy); real storage = its own sub-R |

---

## 6. Caution flags (A is the biggest, most design-heavy surface — expect catches)

1. **Authoring-UX sprawl** (named #1 risk). Keep A.1 to a functional module/lesson editor + drag-reorder; **not** a WYSIWYG/AI studio. Sub-R split is the guardrail.
2. **Instructor-ownership indirection.** Ownership exists only at `CourseOffering.instructorId`; Course/Module/Lesson have **no owner column**, and `SelfOrAdminGuard` checks `User.id` equality (not resource ownership) so it's **not reusable** for "instructor owns their courses" (`instructor-authoring` thread). True owner-scoping needs a new guard/CASL record-level pass **and** resolving that CourseOffering links to Program, not Course. → keep Q5 simple for v1.
3. **Dual-shape gate trap.** Any query gating by `enrollment.courseId === X` silently drops program-term students. The naive copy of the live-class pattern is **wrong** — use the resolver.
4. **Storage is a real architecture decision.** Upload/video → object storage (MinIO/S3/CDN) is a separate concern; A stubs it (Q7) or it balloons.
5. **Mockups are cross-phase** (C+D+E). Triage hard; don't pull LiveKit/AI-gateway work into a content sub-R.
6. **Cascade vs soft-delete.** DB FKs are `onDelete: Cascade` but the app soft-deletes; new module/lesson delete endpoints must **write `deletedAt`** (soft), not rely on hard cascade (ADR-0005 contract).
7. **State-machine duplication.** No shared transition helper exists — the triad is copy-pasted 3×. If A.1 adds a lifecycle, either copy it a 4th time or (recommended, optional) extract a generic `makeStateMachine<T>` into `apps/api/src/common/` and retrofit. Flag, don't force.

---

## 7. Migration + process obligations

- **§4 additive** for `CourseModule`/`Lesson` columns (every new field **nullable or defaulted** — assert per-field, no NOT-NULL-without-backfill, `MIGRATION_POLICY §4:71-74`). **§2 greenfield** for any new child table (carry the full contract: `tenantId` + Tenant relation + `@@index([tenantId])` + Tenant back-relation + audit/soft-delete columns).
- Migration via `prisma migrate dev --name phase_c_a_content_*` (§2:55 naming); hand-author/verify SQL in the schema commit.
- Pass §9 testing gate (create-only dry-run, dev apply, clean seed, e2e green, cascade test) + the §11 5-point PR checklist (incl. the `git checkout HEAD~1 && remote.ps1 up` backward-compat boot). Prod auto-applies via the Dockerfile entrypoint `prisma migrate deploy`; the deploy gate covers it (step-2 pre-push warn + 8.2 migrate-status).
- **Every new mutation handler needs `@AuditAction()` / `@AuditSkip()`** or CI fails (`audit-on-mutation.js`).

---

## 8. Perf budget + the full-CI gate as a forcing function

- **D66 Path D:** per-route lazy chunks — authoring UI and the learner content view as **separate** lazy chunks; main-bundle Δ **< 50 KB** (warn +40). Post-deploy measured by `deploy-and-smoke.ps1` (now full-CI-gated).
- **The new gate is a forcing function:** A's deploy runs `verify.ps1` first — **static gates (web/api tsc + audit-lint) BLOCK on red (`exit 50`)**. A literally **cannot ship type-debt or a missing `@AuditAction`** — the gate stops it. (jest stays advisory until R-CI-Api.) This is the R-CI capstone paying off on its first real consumer.

---

## 9. Estimate (A.1, the recommended slice)

| Item | LOC (est.) | Notes |
|---|---:|---|
| schema §4 (contentType + publish flag) + migration | ~80 | additive, hand-verified |
| backend: course-modules/ + lessons/ (CRUD + reorder + DTOs) | ~900 | mirror `courses/` pattern |
| backend: content gate resolver + gated lesson endpoint + live-class retrofit | ~300 | the `hasContentAccess` dual-shape resolver |
| CASL subjects + rules + audit actions | ~120 | |
| frontend: authoring UI (editor + drag-reorder) | ~1,100 | the heavy part; lazy chunk |
| frontend: learner render + endpoints client | ~500 | extend CourseLive; lazy chunk |
| api-jest e2e | ~400 | mirror course-offerings spec |
| **A.1 total** | **~3.4k** | **~5–7 days**; **6 atomic commits** (schema → modules API → lessons API+gate → CASL → authoring UI → learner view+e2e+review) |

Full A (A.1–A.3) is multi-sub-R; A.4+ (assessment split/gradebook/video) are later Phase-C sub-Rs.

---

## 10. Ledger + naming

- This memo: `docs/PHASE_C_A_CONTENT_MEMO.md`.
- Decision ledger: **continue the single `docs/PHASE_A_DECISIONS.md`** (per D84 it is the one continuous all-phases ledger; the retrospective + every memo reference it — fragmentation is worse). Add a `## Phase C — Core Learning Loop` section header at the **first** Phase-C decision (the A ack).

---

## 11. Active stop triggers (D61 — armed for A, the largest surface)

1. **Unexpected discovery** that invalidates a scope assumption → STOP + ping.
2. **Scope expand** beyond the acked A.1 (e.g. a "small" addition pulls in blocks/gradebook/storage) → STOP + ping.
3. **Per-term content requirement** surfaces (would need new Course↔Offering schema) → STOP + ping (§2 caution).
4. **Instructor owner-scoping** requested for v1 (the Course↔Offering↔Program indirection) → STOP + ping (it's not free).
5. **Storage/upload** required rather than external-link/stub → STOP + ping (separate media sub-R).
6. **main-bundle Δ > 50 KB** or an authoring/content chunk leaking into the anon shell (D66 Path D) → STOP + ping.
7. A migration that isn't cleanly §4-additive / §2-greenfield (i.e. drifts toward §3 reshape) → STOP + ping (§0 Q6: do not invent a path).

---

**Re-ack format:** «Q1.a Q2.a Q3 Q4.a Q5.a Q6.b Q7.a، شروع A.1» (or pick alternatives). Discovery is done; A.1 starts on ack. No code until then.
