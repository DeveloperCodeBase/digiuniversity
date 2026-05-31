# R-CI-Api — jest hermetic refactor — Memo (STUB)

**Status:** STUB — scoped at R-CI capstone close (D88/D89). Not yet started.
**Predecessor:** R-CI-Cleanup capstone (D87 grind → D88 split → D89 close).
**Why this exists:** D88 (Q1.a escape hatch) split the api-jest repair out of R-CI
because the suite is **non-hermetic** — a test-harness refactor, a different kind
of debt than R-CI's tsc-type cleanup. R-CI shipped the unified `verify.ps1` with
the **jest gate ADVISORY**; R-CI-Api makes jest **hermetic + green**, then flips the
gate to **blocking** — completing the jest half of the D81 closure.

---

## Where the capstone left jest (the starting point)

`scripts/verify.ps1` runs `api jest` via `remote.ps1 test` and reports it, but it
is **advisory** (warn, never blocks; the deploy gate calls `verify.ps1` without
`-EnforceJest`). The capstone applied **LIGHT** hermeticity only:

- **throttle-skip** — `ThrottlerModule.skipIf(NODE_ENV==="test")` (`apps/api/src/app.module.ts`). Killed the `429` wall (shared in-memory per-IP bucket under `--runInBand`). Prod (`NODE_ENV=production`) is unchanged.
- **DB-cleanup wrapper** — jest `globalSetup`+`globalTeardown` → `apps/api/test/global-db-clean.cjs` sweeps `test-*` tenants (Tenant cascade, resilient). Removed the cross-run slug-collision noise (it cleared **456** accumulated test tenants on first run).

Result: **jest 20 → 8 failures** (`8 failed, 1 skipped, 113 passed / 122`). The
remaining 8 are genuine test-vs-code drift / within-suite isolation — the R-CI-Api
work-list below.

---

## Scope (the full hermetic refactor)

### 1. Disposable test DB — get tests OFF prod (the core structural fix)
`docker-compose.yml` `api-test` `DATABASE_URL` == the prod `api` service's
(`digiuniversity` / schema `public`). So `remote.ps1 test` runs jest **against the
production database**, isolated only by per-tenant random slug. This is the root
of the DB-state fragility (and a data-hygiene concern — test tenants accumulate
in prod; the capstone's db-clean is a band-aid). R-CI-Api should point api-test at
a **separate, disposable database** — either a `digiuniversity_test` DB on the same
pg, or an ephemeral pg in the `test` compose profile (mirroring CI's ephemeral pg
service). Once tests own their DB, the db-clean wrapper can stay as defence-in-depth
or be replaced by a per-run schema drop/recreate.

### 2. Per-test throttle isolation — restore the rate-limit assertion
The capstone's `skipIf(NODE_ENV==="test")` disables throttling for the whole test
env (blunt) and forced `applications-r3b.spec.ts` "rate-limit: 6th submit → 429"
to `it.skip`. R-CI-Api should restore **per-test** throttler control (reset the
throttler storage between tests, or a test-only toggle) so the rate-limit
assertion runs again, then **un-skip** that test.

### 3. The 8 remaining failures (fix each — do NOT blanket-assume "stale test")
- **⚠️ ENROLLED idempotency `200`-vs-`400` (`applications-r3b`) — EXPLICIT BEHAVIOR-QUESTION, NOT assumed drift (owner directive, D88).** The test expects a 2nd `ENROLLED` transition on an already-enrolled application to reject (`400`, message `/Allowed from ENROLLED:/`); the running code returns `200`. **R-CI-Api MUST determine which is right before touching either side:** is the transition state machine failing to lock the terminal/idempotent `ENROLLED` state (a **real product bug** — re-enrolling silently succeeds), or is the test asserting a behavior the design intentionally changed? Investigate the application transition state machine + the ENROLLED side-effect path. Do not "fix the test" to green without answering this.
- **empty-PATCH `200`-vs-`400` (`academic-hierarchy` School):** test sends `{}` to PATCH expecting `400`; code returns `200`. Behavior-question (lesser): should an empty update be rejected, or is `200` (no-op) correct? Decide, then align test or code.
- **studentCode min-len 2 (`identity-r3a` cross-tenant):** test sends `studentCode: "X"` (1 char); a later-added DTO validation rejects on length **before** the cross-tenant check, so the assertion (`/does not exist in this tenant/`) never fires. Use a valid `studentCode` so the cross-tenant path is exercised. (Clear test drift.)
- **audit-subject id (`identity-r3a` profile):** the "latest audit row" lookup picks up a different test's row (isolation). Scope the audit query to the test's actor/subject. (Isolation gap.)
- **`course-offerings` illegal-transitions + list-filters; `academic-hierarchy` dup-shortCode + Faculty cross-tenant:** within-suite slug collisions (`Unique constraint (tenantId, slug)`) — the suite reuses fixed slugs (`"illegal-1"`, `"filt-a"`, `"ALP"`) across tests in a shared tenant (db-clean fixes cross-run, not within-run). Give each test a fresh tenant or unique slugs.

### 4. Flip jest → blocking (completes the D81 jest half)
Once jest is hermetic + green: in `deploy-and-smoke.ps1` `Invoke-VerifyGate`, call
`& $verify -EnforceJest` (one-line) so a jest failure → `exit 50` blocks the deploy.
Update `DEPLOY_SCRIPT_USAGE.md` (exit 50 now also covers jest) + the review doc.
This makes the deploy gate enforce ALL four gates — the full D81 closure.

---

## Out of scope
- Anything beyond making api-jest hermetic + green + the gate flip. No new tests,
  no product features. (If §3's ENROLLED investigation surfaces a real product bug,
  that fix is in scope — it's what the gate exists to catch.)

## Acceptance
- `remote.ps1 test` (or the disposable-DB equivalent) → **0 jest failures**, repeatably (run twice back-to-back; no cross-run state).
- The `applications-r3b` rate-limit assertion **un-skipped + passing**.
- `verify.ps1 -EnforceJest` → exit 0; deploy gate flipped to jest-blocking.
- The ENROLLED-idempotency question **answered + recorded** (bug-fixed or test-corrected, with the rationale in the review).
