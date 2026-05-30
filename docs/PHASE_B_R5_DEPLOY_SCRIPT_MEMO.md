# Phase B R5 — Deploy-and-Smoke Script — Memo

**Author:** Phase B post-R4 close (D75) + R-Infra pivot (D76)
**Date:** 2026-05-28
**Status:** ⏳ DRAFT — awaiting owner ack before R5 code
**Workflow:** memo → owner ack → code A-F → script test run (dogfood) → close (D61 Constraint #1 — adapted for a tooling sub-R; see §«D13 in this case» below)
**Predecessor:** R4 closed (D75); R-Infra original (self-hosted runner CD) abandoned per D76 because Claude Code has working VPS access from session and Option C was over-engineered for the current single-VPS / single-operator setup.
**Goal:** collapse the 6-step manual `remote.ps1` deploy sequence + the manual API smoke + the bundle measurement into **one script** Claude Code invokes per sub-R. Zero owner toil per deploy; owner only does the final 2-min mobile visual.

> **History note**: this file was renamed from `PHASE_B_R_INFRA_MEMO.md` (the heavier R-Infra plan). The original R-Infra Q-decisions are now mostly invalid (D76); the relevant ones (Q3.b spirit, Q4.a API smoke, Q5 alert-first) are preserved in this memo's design as script behaviors, not as gates.

---

## Scope (R5)

A single script `scripts/deploy-and-smoke.ps1` that, when invoked from the project root with the repo on its target branch (typically `main`):

### Steps (in order)
1. **`git pull` on the local repo** (Windows side — Claude operates from the laptop).
2. **Migration detection gate (Q3.b spirit)** — diff the `apps/api/prisma/migrations/` directory between `HEAD@{1}` and `HEAD`. If any new directory appears:
   - Print a visible warning: «⚠️ NEW MIGRATION DETECTED: <name(s)>. This will modify the production database schema.»
   - Pause **5 seconds** with a countdown.
   - Offer an abort prompt: «Type `abort` to cancel, anything else (or Enter) to proceed.» (skipped by `--yes`).
   - If no new migration, skip the gate silently.
3. **`remote.ps1 build`** — push `main` to origin + remote `git pull` + `docker compose build`.
4. **`remote.ps1 up`** — `docker compose up -d --build` (idempotent re-up; the `up` action already includes pull+build).
5. **`remote.ps1 migrate`** (skippable via `--skip-migrate` if you know there are none) — `docker compose exec -T api npx prisma migrate deploy`. Output captured for the report.
6. **`remote.ps1 seed`** (always run; idempotent on natural keys; skippable via `--skip-seed`).
7. **`remote.ps1 health`** — the existing 4-service docker-exec probe.
8. **Automated API smoke** (Q4.a) — sequential curl checks against `https://digiuniversity.ir`:
   - 8.1 Public health endpoints — `/v1/health` (api) + `/v1/health` (ai-gateway) + `/healthz` (nginx app). All must respond 200.
   - 8.2 Migration-applied verify — re-run `prisma migrate status` via `docker compose exec`; expect "Database schema is up to date" (a single line we grep for).
   - 8.3 Login round-trip — POST `/v1/auth/login` admin → 200 with `accessToken`. Catches "API booted but auth broken" cases.
   - 8.4 Authed sample probe — GET `/v1/auth/me` with the token → 200. Catches JWT/strategy regression.
   - 8.5 Bundle modulepreload check — `curl https://digiuniversity.ir/` + grep `<link rel="modulepreload"`. Assert ONLY `react-vendor` + `radix-vendor` appear. **Any admin/page chunk in the modulepreload = fail** (the D66 Path D guard).
   - 8.6 Main-bundle size delta — `curl -sI https://digiuniversity.ir/assets/index-*.js | grep -i content-length`, parse, compare to a stored baseline in `docs/BUNDLE_BASELINE.json`. **Warn if Δ > +40 KB; fail if Δ > +50 KB** (D61 #2). The script updates the baseline only when explicitly told (`--update-baseline`); never silently.
9. **Structured markdown report** — emit to stdout AND a timestamped log file at `logs/deploy/YYYY-MM-DD-HHMMSS.md`. The report is what Claude pastes into the owner ping. Format:
   ```
   # Deploy & Smoke Report — <commit short-sha> — <ISO-8601>
   ## Steps
   - [✓/✗] git pull
   - [✓/✗] migration gate (N new migrations OR skipped)
   - [✓/✗] build / up / migrate / seed / health
   ## API smoke
   - [✓/✗] api /v1/health … (one line per check)
   ## Bundle
   - main index: X KB (Δ vs baseline +Y KB) — pass/warn/fail
   - modulepreload: vendor only ✓ / admin chunks leaked ✗ (list)
   ## Verdict
   - all green / FAIL (summary of failures)
   ```
10. **Exit code** — `0` if all green; non-zero with a specific code per failure family (10 = remote step failed, 20 = api smoke failed, 30 = bundle constraint failed, 40 = migration gate aborted, 99 = unexpected).

### Flags (CLI)
- `--skip-migrate` — skip step 5 if you know no migration is pending
- `--skip-seed` — skip step 6
- `--yes` — bypass the migration-gate confirm prompt (default for Claude automation; owner uses interactive mode if running from terminal)
- `--verbose` — full step-by-step output (default is a summary; full output always lands in the log file)
- `--dry-run` — go through steps 1, 2 (warn only), and 8 (probes against current prod) without 3-7 (no deploy mutation). For verifying the report shape end-to-end.
- `--update-baseline` — after a successful run, overwrite `docs/BUNDLE_BASELINE.json` with the new main-bundle size + (optional) per-chunk sizes. Manual + explicit; the script never updates the baseline silently.

### Outputs
- **stdout**: the markdown report (Claude pastes this into the owner reply).
- **exit code** (above).
- **log file**: `logs/deploy/<timestamp>.md` — same content as stdout + a verbose appendix with all captured command output for postmortems. (`logs/` is gitignored; one deploy log per invocation.)

### Documentation
- `docs/DEPLOY_SCRIPT_USAGE.md` — operator runbook covering:
  - how Claude Code invokes it (the canonical `.\scripts\deploy-and-smoke.ps1 --yes` form)
  - when to fall back to individual `remote.ps1` actions (e.g., a hot rollback, a one-off `shell` or `logs-live`)
  - failure-mode handling per exit code
  - when to re-run with `--update-baseline` (after an intentional main-bundle bump that's been owner-approved)

---

## Platform decision (script form)

- **`.ps1` is the primary** — matches the existing `remote.ps1` ecosystem and the owner's Windows dev box. Claude invokes via `powershell.exe -File scripts/deploy-and-smoke.ps1`.
- A `.sh` mirror is **NOT planned for R5** to avoid maintaining two implementations. If a future operator/CI needs bash, we extract a tiny shared `smoke.sh` for steps 7-10 (the curl-based checks) — but the orchestration stays in PowerShell where `remote.ps1` already lives.

---

## ❓ Q-decisions (mostly carried-forward as design constraints; a few new)

### Q1 — script form (.ps1 primary vs bash + .ps1 vs cross-platform node)
- **Q1.a (Recommended)** — `.ps1` only, matches the `remote.ps1` ecosystem. Bash mirror only if a real second consumer appears.
- Q1.b — `.ps1` + `.sh` mirror from day one. Doubles the maintenance.
- Q1.c — single node CLI (`scripts/deploy-and-smoke.mjs`). Platform-portable, but adds a deps surface + diverges from the `remote.ps1` convention.

### Q2 — migration-gate behavior when running with `--yes`
- **Q2.a (Recommended)** — print the warning + a 5-second pause WITHOUT prompting (so it's visible in the log + Claude's report, but proceeds non-interactively). Owner sees the warning in the report after the fact.
- Q2.b — silently proceed (no pause, no warning). Less safe; reduces signal.
- Q2.c — error out on new migrations + `--yes` (require explicit `--yes-migrate`). Highest safety; double-flag friction.

### Q3 — bundle baseline storage
- **Q3.a (Recommended)** — `docs/BUNDLE_BASELINE.json` (tracked in git). Each baseline update is a commit — review-able + version-controlled. Initial baseline: post-R4 production (`docs/PHASE_B_R4_REVIEW.md` has the numbers).
- Q3.b — `.deploy-baseline.json` at repo root (gitignored). Per-machine baseline; can't catch drift between operators. Not preferred.

### Q4 — `seed` behavior when remote already has data (current R5 plan: always run)
- **Q4.a (Recommended)** — always run; the seed is idempotent on natural keys (proven through 5 sub-Rs). The `--skip-seed` flag is the explicit override for the rare case (e.g., known prod re-seeding causing a known cosmetic side effect).
- Q4.b — auto-skip when no migration was applied (no schema change → no new seed). Saves ~5 seconds per deploy; small.

### Q5 — log retention
- **Q5.a (Recommended)** — keep last 30 days of `logs/deploy/*.md`, prune older on each run. Cheap; sufficient for postmortems.
- Q5.b — keep forever; let the operator prune. Disk grows.

(Q3.b spirit, Q4.a API smoke, Q5-original alert-first from the old R-Infra memo are baked into the script's design above; they're no longer Q-decisions but design constraints.)

---

## Commits planned (atomic per D61)

1. **A** — script skeleton + flag parsing + logging infrastructure (`scripts/deploy-and-smoke.ps1` shell + `logs/deploy/` directory + `.gitignore` entry + the initial `docs/BUNDLE_BASELINE.json` seeded from R4 numbers).
2. **B** — git pull + migration-detection gate (steps 1-2) + the `remote.ps1` wrappers (steps 3-7) + captured output collection.
3. **C** — API smoke checks (steps 8.1-8.4): health + migration-status + login round-trip + authed GET.
4. **D** — bundle measurement (steps 8.5-8.6): modulepreload parse + main-bundle size delta vs baseline.
5. **E** — structured markdown report generation + exit-code mapping (steps 9-10).
6. **F** — `docs/DEPLOY_SCRIPT_USAGE.md` runbook + a **`--dry-run`** test execution against current prod (no mutation; verifies the script end-to-end against the live system) + a brief dogfood `--yes` run on a no-op commit to confirm the full deploy path.

**6 atomic commits.** **~280 LOC total estimated.** **1-2 days** of focused work; closer to 1 since this is orchestration + curl, no new business logic.

---

## Intermediate stop triggers (per D61, active during R5)

1. **Unexpected discovery** about `remote.ps1`'s internal structure that invalidates a wrapping assumption (e.g., an action that writes to stdin differently than expected) → STOP + ping.
2. **Scope expand** (e.g., the migration-gate request balloons into a full pre-flight schema validator) → STOP + ping.
3. **Script needs admin/sudo on the owner's box** to run (would break "Claude invokes one command" — the owner shouldn't be in the loop for every deploy) → STOP + ping.
4. The bundle baseline check surfaces a **production main-bundle that doesn't match local builds** by more than ±10 KB (a sign of a build-environment divergence that needs separate investigation) → STOP + ping at first occurrence.

Else: silent continue. Single dogfood report at Commit F.

---

## What R5 is NOT

- ❌ Not full CD with a self-hosted runner (deferred per D76 until staging+prod or team scale make it worth the maintenance cost).
- ❌ Not a replacement for `remote.ps1` — the script *wraps* + *orchestrates* it. Manual `remote.ps1` calls remain the fallback for one-off ops (`shell`, `logs-live`, `backup`, `rollback`, `rollout`).
- ❌ Not running Playwright headless visual in the deploy gate (Q4.a — owner's 2-min mobile visual stays manual; per the R7.1.x lesson about headless variance).
- ❌ Not changing app, schema, or any sub-R's code (this is pure tooling).
- ❌ Not gating on the broken `npm run typecheck` / `npm test` in CI — those are pre-existing debt (see `docs/PHASE_B_CI_DEBT_REPORT.md`); the script's smoke is **runtime deployability** (the things that must pass to know "this deploy works"), independent of the static-analysis debt.

---

## D13 in this case (acceptance for a tooling sub-R)

R5 doesn't ship a user-visible feature; the standard "8-step owner mobile smoke" doesn't fit. Adapted acceptance, two phases:

- **Phase 1 — Commit F dogfood:** Claude runs `.\scripts\deploy-and-smoke.ps1 --dry-run` on current main. Verifies the report shape + that all smoke checks pass against current prod (no deploy mutation). Claude pastes the report. Owner reads + says «R5 dogfood looks good» → memo-level R5 ack.
- **Phase 2 — operational ack (after first real R6 deploy):** the **next sub-R after R5** (whatever it is — R-CI-Cleanup, Candidate A content, Candidate C applicant UX, etc.) uses `deploy-and-smoke.ps1` as its deploy step. If that goes smoothly + the report is useful + the owner only does the final mobile visual, R5 is fully accepted in operational use. The post-R6 ping confirms this in writing → **R5 D13 PASS**.

So R5 closes in two phases. The D-decision for the dogfood ack can be logged immediately; the operational-ack supplement comes after R6.

---

## Estimated scope (recap)

| Item | LOC | Notes |
|---|---:|---|
| `scripts/deploy-and-smoke.ps1` | ~200 | orchestration + smoke + report |
| `docs/BUNDLE_BASELINE.json` | ~20 | initial baseline from R4 numbers |
| `docs/DEPLOY_SCRIPT_USAGE.md` | ~60 | runbook |
| `.gitignore` | +2 | `logs/deploy/` entry |
| **Total** | **~280** | within the "~250 LOC, 1-2 days" envelope |

---

## Status

| Item | State |
|---|---|
| Predecessor: R4 closed | ✅ D75 |
| Predecessor: R-Infra pivot decision | ✅ D76 |
| Memo (this file, refactored from old R-Infra memo) | ✅ |
| Owner ack on R5 memo + Q1–Q5 | ⏳ pending |
| Code (A–F) | ⏳ NOT STARTED |
| Dogfood test run | ⏳ post-Commit-F |
| Operational ack (after first real use in R6) | ⏳ post-R6 |

**Re-ack format:** «Q1.a Q2.a Q3.a Q4.a Q5.a شروع» (all recommended) — or pick alternatives. R5 starts immediately on ack since this is tooling with no schema-discovery dependency.

— R5 (deploy-and-smoke script) kickoff, 2026-05-28. Pivoted from the heavier R-Infra plan after R4-cycle proved Claude-from-session can deploy reliably. Sweet spot: single command + zero owner toil per deploy.
