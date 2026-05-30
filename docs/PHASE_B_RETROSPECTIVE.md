# Phase B Retrospective — Academic Hierarchy → Identity Track (R0.5 → R3.b)

**Author:** Phase B (post-R3.b-close, D72)
**Date:** 2026-05-28
**Scope:** R0.5 (MIGRATION_POLICY) → R1 (Academic Hierarchy) → R2 (CourseOffering migration) → R3.a (Identity foundation) → R3.b (Applications + parallel state machines)
**Decisions covered:** D58 → D72
**Status:** Identity track complete. This doc consolidates the patterns + lessons that R-Next / Phase C inherit.

---

## 1. Sub-R inventory

| Sub-R | Shipped | Core deliverable | Commits | Close |
|---|---|---|---|---|
| **R0.5** | MIGRATION_POLICY.md | §0 decision tree + §1-11 (dual-write, greenfield, additive, rename 3-stage, deprecation, cascade, soft-delete, testing, rollback) | `3229758` | D62 |
| **R1** | Academic Hierarchy CRUD | School → Faculty → Department → Program, 4-level cascade soft-delete, additive nameEn (D63 Path A spirit) | 11 atomic | D64 |
| **R2** | Cohort → CourseOffering migration | Dual-write interceptor + MigrationSyncLog + Sunset/Deprecation/Link headers + first state machine (OfferingStatus) | 14 (10+4 fixes) | D67 |
| **R3.a** | Identity foundation | Profile (1:1) + Student + Instructor (1:0..1) + SelfOrAdminGuard primitive + R2 instructorId wire | 12 (A–K) | D70 |
| **R3.b** | Applications + parallel state machines | StudentApplication + InstructorApplication (shared AppStatus) + Q4.a verification gate + transactional ENROLLED side effect + NotificationLog stub + Q8.a public submission | 9 (A–I) | D72 |

**Total:** ~55 commits across 5 sub-Rs + R0.5, ~13,000 LOC net.

---

## 2. D-decision ledger (D58 → D72)

| D | Subject |
|---|---|
| D58 | Logo restore (light-logo.png) + AIRAC-ACECR subtitle |
| D59 | Gate A close ceremony + `phase-a-complete` tag |
| D60 | R1 Q-answers (Q2.a full CRUD override) |
| D61 | **Binding constraints**: #1 workflow discipline (memo→ack→code→spec→deploy→D29→D13→close, no skip), #2 performance budget (main bundle Δ<50 KB, admin chunk lazy) |
| D62 | R0.5 closed / R1 starts |
| D63 | R1 Path A — existing Faculty/Dept/Program kept, additive nameEn (spirit-not-literal Q4.a) |
| D64 | R1 D13 ack |
| D65 | R2 Q-answers (Q2.b modified — instructorId deferred to R3) |
| D66 | **R2 admin-academic bundle leak fix** — Path A → B → D (per-route lazy chunks, NO admin bucket) |
| D67 | R2 D13 ack |
| D68 | R3 split into R3.a + R3.b; Q1.b/Q2.a/Q3.a/Q4.a locked + Q4.a verification caveat |
| D69 | **R3.a SelfOrAdmin authorization primitive** + audit semantic + /admin/profiles 5th page |
| D70 | R3.a D13 ack + **explicit-delete D13 lesson** (R1 latent api.delete bug) |
| D71 | R3.b Q-answers + Q5.a (find-or-create-or-link) + Q8.a (rate-limit + spam-flag) refinements |
| D72 | R3.b D13 ack + Enrollment-gap accuracy correction; Identity track complete |

---

## 3. Key patterns (reusable across Phase C / R-Next)

### 3.1 MIGRATION_POLICY usage (R2)
- **Dual-write window**: Cohort + CourseOffering both live; `LegacySyncService` interceptor keeps `Cohort.upgradedToOfferingId` + `Enrollment.offeringId` in sync. Errors swallowed so legacy writes never blocked.
- **Sunset headers**: `Sunset: Wed, 31 Dec 2026 23:59:59 GMT`, `Deprecation: true`, `Link: </v1/offerings>; rel="successor-version"` on every legacy `/v1/cohorts` handler. `@Header` is a **method decorator only** (R2 fix1 — applying at class level throws TS1238).
- **MigrationSyncLog**: append-only audit trail; drop gate = 7 consecutive days zero legacy traffic.
- **Greenfield vs additive**: greenfield models get full new tables (§2); additive columns are nullable, no backfill risk (§4). Every Phase B sub-R after R1 used schema discovery to classify each change.

### 3.2 State machine pattern (R2 single → R3.b parallel)
- **Canonical shape** (`ALLOWED_TRANSITIONS` map in service layer + `isLegalTransition()` + illegal-transition 400 with «Allowed from X: [list]»):
  - R2: single `OfferingStatus` (SCHEDULED → OPEN → ACTIVE → COMPLETED + CANCELED)
  - R3.b: **parallel** — Student + Instructor applications share one `AppStatus` enum + one `ALLOWED_TRANSITIONS` map; they diverge only in the ACCEPTED → ENROLLED side effect handler.
- **Side effects on transitions**: R3.b added transactional side effects (ENROLLED creates User/Student/Instructor). Pattern: the transition method delegates to a dedicated `*EnrollmentService` that owns the `$transaction`.
- **Gated transitions**: R3.b's Q4.a verification gate is a service-layer guard fired only on specific (from, to) pairs (UNDER_REVIEW → forward). Reusable shape for any "can't advance until precondition met" rule.

### 3.3 SelfOrAdmin authorization primitive (R3.a, reused R3.b)
- `@SelfOrAdmin()` decorator + `SelfOrAdminGuard` at `apps/api/src/auth/guards/`. Opt-in (handlers without the decorator pass through). Admin short-circuits; non-admin compares `request.user.userId` to the target.
- **Audit semantic**: `AuditLog.actorId` is ALWAYS `request.user.userId` — admin editing another's resource logs as `actor=admin, subject=<resource>:<target>`.
- Reused in R3.b for applicant `/me` + WITHDRAW (the in-service variant, since the owner-id lives on the resource not the URL).

### 3.4 Bundle discipline (D66 Path D)
- **Per-route lazy chunks, NO admin manualChunks bucket.** The R2 leak crisis (admin-academic 37 KB → 416 KB eager-preloaded) was caused by a grouped admin bucket becoming an attractive home for hoisted shared symbols. Dropping the bucket entirely (Vite default per-route chunking) fixed it.
- **Every sub-R since reports post-build bundle measurement** + verifies admin chunks are absent from `<link rel=modulepreload>` on anon routes. R3.a actually *shrank* main by 25 KB (un-wiring Productivity.tsx from /profile). R3.b added +2 KB.

### 3.5 find-or-create-or-link (R3.b, Q5.a)
- Eliminates the P2002 race in the ENROLLED side effect: REUSE (userId set) → LINK (matching `(tenantId, email)`) → CREATE (new User + Profile + role + notification). All inside one `$transaction`. P2002 still caught + surfaced with a retry hint pointing at the LINK branch.
- **Reusable for any "promote an external actor into a first-class User" flow** (future: org-invite acceptance, parent-account linking).

---

## 4. Lessons learned (binding on R-Next / Phase C)

### 4.1 D13 smoke MUST include explicit delete/destroy/withdraw (D70)
The R1 `api.delete` was undefined (only `api.del` existed) — every R1+R2 admin delete button silently TypeErrored; the backend never received the call. This survived **two** D13 cycles (D64, D67) because both smokes only exercised create+edit. R3.a Commit I found it by accident.
- **Rule**: every D13 checklist adds, per mutating surface: «click delete → confirm → row disappears» + «refresh → row absent» + «admin GET → deletedAt non-null or 404».
- R3.b honored this (9-step D13 step 9 covers WITHDRAW + soft-delete + GET 404).

### 4.2 Schema discovery pre-memo is mandatory
- R1 D63 discovered existing Faculty/Department/Program already existed → forced the additive-nameEn "Path A spirit" decision mid-memo.
- Every sub-R since runs a schema grep BEFORE writing the memo, classifying each change as greenfield (§2) / additive (§4) / modification (§3). Caught R3.a's "all greenfield except R2 instructorId" + R3.b's "all greenfield + reverse relations on 8 models" cleanly.
- **Rule**: memo §«Schema discovery» table is non-optional; it gates the migration SQL authoring.

### 4.3 Phase B sub-R first-deploy is high-risk
Three first-deploy failures, all caught + fixed:
- **R2 fix1**: `@Header` class-decorator TS1238 → method decorator only
- **R2 fix2**: schema edited but migration SQL never generated → production 500s. **Prisma schema change alone does NOT trigger DDL**; explicit migration file required.
- **R3.a Commit I**: latent `api.delete` undefined (pre-existing R1 bug)
- **Rule**: migration SQL is hand-authored + committed in the schema commit (Commit A); never rely on `prisma migrate dev` auto-gen reaching production. `tsc --noEmit` + `prisma validate` + `prisma generate` run before every commit.

### 4.4 Deploy from the Claude Code session is unreliable
- VPS SSH (`193.163.201.141:22`) timed out from the session runner in both R3.a + R3.b closeout. Deploy was handed back to the owner each time.
- **Rule (R-Next onward)**: deploy is OWNER-executed via `remote.ps1`. The implementer's job ends at: code pushed to `main` + local `npm run build` bundle measurement + review doc with the full deploy/smoke recipe. Owner runs pull/build/up/migrate/seed/health + D29 + D13.

### 4.5 Owner ack ≠ ground truth on implementation detail (D72)
- D72: owner's ack claimed "Enrollment created" but the code creates User + Student only. Flagged + corrected rather than rubber-stamped.
- **Rule**: when an ack asserts a specific technical claim, verify it against the code before encoding into the decisions log. Acks are authoritative on "did the user-visible flow work"; they are not authoritative on internal mechanics the owner may have inferred from memo language.

### 4.6 ENTERPRISE LESSON — pre-deploy schema-and-code discovery now operationally proven (added at R4 close, D75)
The combination of **schema discovery pre-memo (lesson #1)** + **«ack ≠ ground truth on internals» (D72)** has now caught **four** memo-stated assumptions BEFORE they reached deploy-time, across four consecutive sub-Rs:

| # | Sub-R | Catch | Would have caused | Resolved by |
|---|---|---|---|---|
| 1 | R1 / D63 | Q4.a literal-vs-spirit (existing Faculty/Dept/Program already exist) | Either FK violation or destructive rename (§5) instead of additive (§4) | Path A "spirit" interpretation — additive `nameEn` |
| 2 | R2 | `@Header` class-decorator (TS1238) + schema edit without migration SQL | Build failure + production 500s on first POST/PATCH | Method-decorator move + hand-authored migration SQL (now standing rule) |
| 3 | R3.b / D71 | Q5.a "reuse if userId set; else create" raced P2002 on parallel registrations | Transaction failure mid-ENROLLED for an applicant who self-registered between submit + accept | Refinement to find-**or**-link-**or**-create (LINK branch added) |
| 4 | R4 / D74 | Memo's "values already match the enum" — existing data was lowercase + the Phase-7 RBAC controller built on lowercase strings | Migration cast failure on production rows AND a regression in the existing student self-enroll/withdraw flow | Service-layer state machine; storage stays String; existing flow untouched |

Each catch was the result of doing schema **and code** discovery *before* the memo locked + verifying the memo's stated assumption against the actual repo state. Four for four = the discipline is **operationally proven**, not aspirational. Every future memo continues with the same schema+code discovery section + flags any wrong-assumption finding as a STOP+ping (per the D61 stop triggers).

The discipline now lives in three concrete artifacts that don't depend on any one person remembering them:
- The memo template's `Schema discovery` section (table form, mandatory)
- The standing 5-6 stop triggers per sub-R (D61), with #1 always being "unexpected discovery"
- The retrospective itself (this file) being read as part of every R-Next planning memo

### 4.7 Deploy-mechanism finding (updated at D76)
The earlier rule («deploy is OWNER-executed via remote.ps1; session SSH unreliable», §4.4) was **refined** at D76 after R4 closeout. The owner observed Claude Code execute `remote.ps1 health`/`up`/`migrate`/`seed` + a precise prisma cascade on production successfully during R4 cleanup → **Claude-from-session CAN deploy reliably enough for this single-VPS / single-operator setup** (intermittent SSH retries succeed within a couple of tries; not a hard block). This invalidated the original R-Infra Q1 assumption (need a self-hosted runner to sidestep SSH). The pivot to a lightweight `deploy-and-smoke` script (R5) reflects this: keep Claude in the loop as the operator, but collapse the 6 individual `remote.ps1` calls + the manual API smoke into one command that produces a structured markdown report. Full CD (self-hosted runner) is deferred until staging+prod environments or team scale make it worth the maintenance cost.

---

## 5. What R-Next / Phase C should know

### 5.1 Process contract (settled through 5 sub-Rs)
```
memo (with schema discovery + Q-decisions)
  → owner ack (Q-answers, possibly with modifications)
  → code (atomic commits A–N, tsc+validate+generate per commit)
  → spec (API e2e + D12/D18 visual)
  → local npm run build (bundle measurement)
  → owner deploy (remote.ps1) + owner D29 + owner D13
  → close (D-decision ack + retrospective note)
```
- D61 Constraint #1 (no skip) + #2 (bundle budget) are permanent.
- Stop triggers per sub-R (typically 5-6): unexpected discovery, scope expand, bundle delta >50 KB, admin chunk >limit, + sub-R-specific ones.

### 5.2 Carried-forward technical debt / deferrals
| Item | Deferred from | Target |
|---|---|---|
| **Enrollment auto-creation on ENROLLED** | R3.b (Q5.a memo scoped it out) | R-Next candidate #2 |
| Applicant-facing submission/withdraw UI | R3.b (admin-only surface) | R3.c / R-Identity-Applicant-UX |
| Email-token + SMS-OTP self-verification | R3.b Q3.a (admin PATCH only) | R-Notif (post-Phase-B) |
| Actual email/SMS sender (NotificationLog is write-only stub) | R3.b | R-Notif |
| Avatar/CV file upload (URL fields only) | R3.a + R3.b | media/storage sub-R |
| Cohort hard-drop (Sunset 2026-12-31) | R2 | post-Sunset cleanup R |
| No Enrollment admin page | (never built) | R-Next candidate #2 |

### 5.3 Open primitives ready for reuse
- `SelfOrAdminGuard` + `@SelfOrAdmin` (D69)
- `ALLOWED_TRANSITIONS` state-machine shape (R2/R3.b)
- `*EnrollmentService` transactional-side-effect pattern (R3.b)
- `find-or-create-or-link` user resolution (R3.b)
- `_shared/` admin CRUD primitives (CrudDialog + ConfirmDelete + FormField) from R1
- MIGRATION_POLICY §0-11 decision tree

---

— Phase B retrospective, 2026-05-28. Identity track closed at D72. R-Next memo follows.
