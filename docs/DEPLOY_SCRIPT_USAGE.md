# Deploy & Smoke Script — Operator Runbook

`scripts/deploy-and-smoke.ps1` collapses the manual 6-step `remote.ps1` deploy +
the API smoke + the bundle check into **one command**. Claude Code invokes it per
sub-R; the owner's only manual step is the final ~2-minute mobile visual.

- **Spec:** `docs/PHASE_B_R5_DEPLOY_SCRIPT_MEMO.md`
- **Baseline data:** `docs/BUNDLE_BASELINE.json`
- **Wraps (never replaces):** `scripts/remote.ps1`

---

## The one command

```powershell
# Real deploy (build -> up -> migrate -> seed -> health -> smoke -> bundle):
.\scripts\deploy-and-smoke.ps1 -Yes

# Or, when invoked headless (the canonical Claude form):
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\deploy-and-smoke.ps1 -Yes
```

Run it **from the repo root**, with `main` checked out and clean. It prints live
progress to the console, writes the markdown report to stdout, and saves a
timestamped copy under `logs/deploy/`.

---

## Flags

| Flag | Effect |
|---|---|
| `-Yes` | Bypass the migration-gate abort prompt (default for automation). The warning + 5s pause still print so they land in the report. |
| `-DryRun` | Run steps 1, 2 (warn only), and 8 (smoke + bundle against current prod) with **no deploy mutation** — no build/up/migrate/seed. Verifies the report shape end-to-end against the live system. |
| `-SkipMigrate` | Skip `remote.ps1 migrate` (step 5) when you know no migration is pending. |
| `-SkipSeed` | Skip `remote.ps1 seed` (step 6). Seed is idempotent and runs by default. |
| `-UpdateBaseline` | After measuring, record the live main-bundle size as the new `docs/BUNDLE_BASELINE.json` baseline. Explicit + reviewable (lands as a git diff); never silent. Use only after an **owner-approved** bundle bump. |
| `-Verbose` | Echo captured `remote.ps1` output to the console too (it always lands in the log-file appendix regardless). |

---

## What it does (steps)

1. `git pull --ff-only origin main` (local).
2. **Migration gate** — diffs `apps/api/prisma/migrations/` over `origin/main..HEAD`.
   New migration => prints a warning + 5s countdown (proceeds under `-Yes`; the
   post-deploy `prisma migrate status` at 8.2 is the ground-truth check).
3-7. `remote.ps1 build` -> `up` -> `migrate` -> `seed` -> `health`.
8. **Smoke + bundle** (also runs under `-DryRun`):
   - 8.1 public health: `/healthz`, `/api/v1/health`, `/ai/v1/health` all 200.
   - 8.2 `prisma migrate status` (via the read-only `migrate-status` action).
   - 8.3/8.4 auth: 401 probe by default; full login + `/auth/me` round-trip when
     `SMOKE_*` env is set (see below).
   - 8.5 modulepreload allow-list: only `react-vendor` + `radix-vendor` may be
     preloaded on the anon shell (the D66 leak guard).
   - 8.6 main-bundle size vs baseline: warn at +40 KiB, fail at +50 KiB.
9. **Markdown report** to stdout + `logs/deploy/<timestamp>.md` (with a raw-output
   appendix). Logs older than 30 days are pruned on each run.
10. **Exit code** per failure family (below).

---

## Exit codes

| Code | Meaning | Typical next step |
|---:|---|---|
| `0` | All green (warnings still exit 0) | Owner does the 2-min mobile visual. |
| `10` | A `remote.ps1` deploy step failed | Read the appendix; re-run, or `remote.ps1 logs-live`. |
| `20` | API smoke failed (incl. prod unreachable -> HTTP 0) | App up but a route/auth/ingress is broken; check Caddy + container health. |
| `30` | Bundle constraint failed (preload leak or size over +50 KiB) | A chunk leaked into modulepreload, or the main bundle grew too much. |
| `40` | Migration gate aborted by the operator | Intentional cancel; nothing deployed. |
| `99` | Unexpected exception | See the appendix's `unexpected-exception` block. |

The smoke gate **fails closed**: if prod is unreachable, the run exits `20` (never
a false green).

---

## SMOKE_* env (optional auth round-trip upgrade)

By default 8.3 only proves auth is alive (a bogus login must return 401), and 8.4
is skipped. To exercise a **real** login + authed `GET /auth/me`, set all three
(e.g. with non-admin seeded creds — same code path, no production admin secret
needed):

```powershell
$env:SMOKE_TENANT_SLUG  = 'demo'
$env:SMOKE_ADMIN_EMAIL  = 'student1@digiuniversity.ir'
$env:SMOKE_ADMIN_PASSWORD = 'StudentPass!1'
.\scripts\deploy-and-smoke.ps1 -DryRun -Yes
```

The minted token is never written to the report or the log. Leave the env unset
for routine deploys; the 401 probe is enough to confirm the auth path booted.

---

## Bundle baseline

`docs/BUNDLE_BASELINE.json` stores the main-bundle reference as exact **bytes**
(`mainBundle.sizeBytes`, the identity/uncompressed `Content-Length` of the
deployed `/assets/index-<hash>.js`). Thresholds are deltas in KiB (warn +40,
fail +50). After an intentional, owner-approved bundle increase, accept the new
size with `-UpdateBaseline` and commit the resulting one-line JSON diff.

---

## When to use `remote.ps1` directly instead

This script is the deploy path. For one-off ops it does **not** cover, call the
underlying actions directly:

- `remote.ps1 rollback` / `rollout` — hot rollback or a pinned-image rollout.
- `remote.ps1 shell` / `logs-live` / `logs` — interactive debugging.
- `remote.ps1 backup` / `restore` — DB snapshots.
- `remote.ps1 migrate-status` — the read-only schema check (added for step 8.2;
  safe to run anytime, mutates nothing).
