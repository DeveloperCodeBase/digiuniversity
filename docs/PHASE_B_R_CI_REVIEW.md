# R-CI-Cleanup — Review (CLOSED)

**Status:** ✅ CLOSED — D89 (2026-05-31). Mobile-accepted; deployed green (`eb2c81f`).
**Decisions:** D84 (Q-lock) → D85 (Hybrid scope) → D86 (Icon contract) → D87 (grind→0, capstone deferred) → **D88 (jest structural → R-CI-Api split)** → **D89 (close)**.
**Sequence (D79):** Candidate C → **R-CI** (this) → Candidate A (next). Follow-up: **R-CI-Api** (any time).

---

## TL;DR

R-CI-Cleanup paid down the static-analysis debt and **closed the static half of the
D81 divergence** (a quality gate green in one path while red in another). It:

1. drove `apps/web` typecheck **198 → 0** with proper per-site types (zero new
   `any`, zero `@ts-ignore`/`@ts-nocheck`, 13 verified buckets);
2. built **`scripts/verify.ps1`** — one entry point for all four quality gates
   (web tsc + api tsc + audit-lint + api jest); and
3. **flipped the R5 deploy gate lean → full-CI** — `deploy-and-smoke.ps1` now runs
   `verify` before any deploy mutation: the static gates **block** (`exit 50`),
   jest is **advisory** (non-blocking) until R-CI-Api makes it hermetic.

The full-CI gate is **proven on a real production deploy** (`eb2c81f`, exit 0).

---

## What shipped

### 1. `apps/web` typecheck 198 → 0 (the grind)
13 buckets, each verified (count strictly down, zero new error codes, **zero new
`any`**). Fixes were real types, a known-shared `IconProps` extension (D86 —
`className`+`style` aligned with 28 existing call-sites), or precise coercions
(`String()`/`Number()`/`=== true`/`as keyof`). Anti-patchwork mandate held
end-to-end (D85 Hybrid: a small conservative codemod for the ~30 proper-able, then
manual per-site types for the ~150). `vite build` clean; main bundle unchanged
(zero-runtime). Bucket-by-bucket trail in `R-CI-PROGRESS.md`.

### 2. `scripts/verify.ps1` — the unified gate (Q3.a)
One entry point, single source of truth, consumed by the deploy gate. Gates:

| # | gate | how | enforcement |
|---|---|---|---|
| 1 | web tsc | `apps/web` `npm run typecheck` | **HARD** (exit 10) |
| 2 | api tsc | `apps/api` `npm run typecheck` (new script: `tsc --noEmit -p tsconfig.build.json`) | **HARD** (exit 20) |
| 3 | audit-lint | `tools/eslint-rules/audit-on-mutation.js` | **HARD** (exit 30) |
| 4 | api jest | `remote.ps1 test` (DB-backed, VPS docker test profile) | **ADVISORY** (warn; exit 40 only with `-EnforceJest`) |

Mirrors `deploy-and-smoke.ps1` conventions (Add-Step, ASCII-only, UTF8-no-BOM log
under `logs/verify/`, per-gate exit codes). `-SkipJest` = fast local static-only
(no push/VPS). Gates 1–3 run first; jest runs only if they're green (a red static
gate never triggers the jest push).

### 3. R5 deploy-gate flip lean → full-CI (Q4.a)
`deploy-and-smoke.ps1` gained `Invoke-VerifyGate`, wired **after** the migration
gate (D83 ordering — verify's jest stage pushes `main`, which would empty
`origin/main..HEAD` and blind the step-2 migration heuristic if it ran first).
Static gates **block** the deploy (`exit 50` = new `EXIT_VERIFY_FAILED`); jest is
advisory. Plus:
- **`-SkipVerify`** emergency escape hatch — bypasses with a prominent
  `!! VERIFY SKIPPED` warning + a `[WARN]` report step + a header tag (D81 ethos:
  gates enforce; a bypass is allowed only WITH visibility, never silent).
- D83 migration-gate doc note (step-2 = pre-push heuristic; 8.2 authoritative).
- `DEPLOY_SCRIPT_USAGE.md` updated (flags, steps, exit 50).

---

## D81 closure — STATIC done; jest → R-CI-Api

D81 (R6) surfaced the deploy path and the test path were divergent — audit-lint
was silently red in the test path while deploys went green. R-CI closes this **for
the static gates**: web tsc + api tsc + audit-lint are now unified in `verify.ps1`
and **hard-enforced in the deploy gate** (and mirrored by CI). A silently-red
static gate can no longer recur.

The **jest half** is deferred to **R-CI-Api** (D88, the pre-acked Q1.a escape
hatch): the suite proved **non-hermetic** (a harness-refactor problem, not a
type-fix) — throttler active in tests, tests run against the prod DB, ~few
test-vs-code drifts. R-CI applied **light** hermeticity (throttle-skip via
`skipIf(NODE_ENV==="test")` + a `test-*` DB-cleanup wrapper) which dropped jest
**20 → 8** failures and is **advisory** in the gate; R-CI-Api does the full
refactor (disposable test DB, per-test throttle isolation, the 8 drifts) then flips
jest → blocking. Scope: `docs/PHASE_B_R_CI_API_MEMO.md`.

---

## Deploy evidence (`eb2c81f`, exit 0)

Real full-CI-gated production deploy, all green:
- **verify gate** — static green; jest advisory `8 failed, 1 skipped, 113 passed`
  → non-blocking → deploy proceeded (the gate flip proven end-to-end on prod).
- build → up → migrate (no-op) → seed → health (4 services) all PASS.
- smoke: `/healthz` + `/api/v1/health` + `/ai/v1/health` 200; `prisma migrate
  status` = up to date; auth 401 probe.
- bundle: modulepreload vendor-only; main **384.47 KiB (Δ +0.74 KiB)** — unchanged
  (R-CI zero-runtime confirmed).
- Owner mobile check: app load + login + workspace pages (dashboard/catalog/
  settings) clean, no runtime regression.

---

## Catches (Phase B/C discipline held)

- **jest silently-red on the VPS (D88).** `verify.ps1`'s first full run immediately
  exposed `20/122` jest failures the deploy path never checked — the exact D81
  divergence the script exists to catch. Root-caused read-only → Q1.a split.
- **PS array-splat bug, caught by the mandatory `-DryRun` (stop-trigger #7).** The
  gate-flip's `& $verify @verifyArgs` bound `-SkipJest` positionally → exit 99;
  caught in dry-run **before prod**, fixed to a literal-switch call. Practical
  proof of "test the gate before trusting it."
- **456 accumulated test tenants swept from prod.** The new jest `globalSetup`/
  `globalTeardown` (`test-*` cascade-clean) cleared historical pollution from every
  prior Phase B test run — a data-hygiene bonus.

---

## Acceptance
- `apps/web` tsc = 0, api tsc + audit-lint green (verify static gates HARD).
- Deploy gate flipped to full-CI; stop-trigger #7 validated all 3 paths
  (green→0 / red→50 / SkipVerify→warn).
- Real deploy `eb2c81f` exit 0 + owner mobile green.
- **R-CI-Cleanup CLOSED (D89).** Static D81 closure done; jest-hermetic → R-CI-Api.
