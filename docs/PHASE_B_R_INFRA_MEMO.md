# R-Infra — Automated Deploy + Smoke (CD pipeline) — Memo

**Author:** Phase B (R4 held, infra pivot)
**Date:** 2026-05-28
**Status:** ⏳ DRAFT — awaiting owner direction (pick deploy architecture Q1) before any code
**Workflow:** THIS planning memo → owner picks architecture + Q-answers → scoped impl → ack → code (D61 Constraint #1)
**Goal (owner):** Claude Code pushes → CI auto-deploys to VPS → automated smoke → owner only does a final ~2-min mobile visual check. No more manual `remote.ps1` per deploy.
**Context:** R4 is on hold pending owner final smoke. This memo is infra, not data — but it required infra discovery (below).

---

## Infra discovery (done)

| Surface | Current state |
|---|---|
| `.github/workflows/ci.yml` | **EXISTS.** On push→main + PR: `web` job (npm ci → typecheck → vitest → vite build → upload dist artifact) + `api` job (npm install → prisma generate → `prisma migrate deploy` against ephemeral pg → tsc build → jest). **Build + test only — NO deploy step.** |
| `.github/workflows/security.yml` | **EXISTS.** gitleaks secret scan (+ likely trivy/codeql) on push/PR/daily-cron. |
| `.github/dependabot.yml` | EXISTS. |
| `deploy.yml` (CD) | **DOES NOT EXIST.** Explicitly noted as "future deploy.yml" in `remote.ps1` (line 631). This is the gap R-Infra fills. |
| CI secrets configured | Only the built-in `secrets.GITHUB_TOKEN`. **No SSH key / VPS host / deploy secrets exist yet.** |
| Deploy mechanism (`remote.ps1`) | `Remote($cmd)` = `ssh my-vps "cd /var/www/digiuniversity && $cmd"`. SSH alias `my-vps` → host `193.163.201.141:22`, **key-based auth in the owner's local `~/.ssh/config`** (NOT in the repo). |
| VPS layout | Ubuntu, `/var/www/digiuniversity` git checkout, Docker + compose, `docker-rollout` plugin (zero-downtime), nightly pg_dump backup cron (`bootstrap-vps.sh`). |
| Deploy steps (the remote.ps1 sequence to replicate) | `pull` (git checkout docs/ + clean + `git pull origin main`) → `build`/`up` (`docker compose up -d --build`) → `migrate` (`docker compose exec -T api npx prisma migrate deploy`) → `seed` (`docker compose exec -T api npm run seed`) → `health` (docker exec curl on 4 services: nginx app, api, ai-gateway, postgres) |
| Rollback mechanisms | `remote.ps1 rollback` (git-revert HEAD + redeploy, OR image-tag `IMAGE_TAG=$sha` rollback if `pin-image` ran). `pin-image` tags running images with git short-SHA. |
| Migration safety | `prisma migrate deploy` is the production-safe command (idempotent, applies only pending migrations, never resets — unlike `migrate dev`). |

**Critical finding — the SSH reachability question.** The Claude Code session couldn't SSH to the VPS (`193.163.201.141:22` timed out). Two possible causes, with very different implications for the CD architecture:
1. The Claude **sandbox** blocks outbound SSH (likely) — in which case GitHub-hosted runners (real internet egress) would reach the VPS fine.
2. The **VPS firewall** allowlists only the owner's IP for port 22 (good security hygiene) — in which case **GitHub-hosted runners (dynamic IPs) would ALSO be blocked**, and we'd need a self-hosted runner or webhook-pull.

→ **We must confirm which before committing to Q1.a (GitHub-hosted SSH).** The owner can check: `sudo ufw status` / cloud-provider firewall rules on the VPS. If port 22 is owner-IP-locked, Q1.b or Q1.c is mandatory. This is the gating unknown.

---

## ❓ Q1 — Deploy architecture (the primary decision)

| | Approach | How it works | Firewall-robust? | Trade-off |
|---|---|---|---|---|
| **Q1.a** | GitHub-hosted runner + SSH | `deploy.yml` job SSHes to the VPS (deploy key in GitHub Secrets) + runs the pull/build/migrate/health sequence | ❌ Needs VPS:22 reachable from GitHub's (large, rotating) IP ranges | Simplest workflow; brittle if VPS firewall is IP-locked |
| **Q1.b (Recommended)** | Self-hosted runner on the VPS | A GitHub Actions runner process runs ON the VPS; polls GitHub over **outbound HTTPS** (no inbound SSH); runs the deploy locally (it's already on the box — no `ssh` at all) | ✅ Outbound-only; no firewall change | A long-running runner process to install + keep updated; must scope to this repo + main branch only (runner executes workflow code) |
| **Q1.c** | Webhook-pull / poll | A tiny listener (or systemd timer) on the VPS pulls + redeploys on a GitHub webhook (or polls `git fetch` every N min) | ✅ Outbound or single inbound webhook port | Build + secure the listener; webhook secret; less "native CI" feel |

**Recommendation: Q1.b (self-hosted runner on the VPS).** Reasons:
1. **Sidesteps the SSH reachability unknown entirely** — outbound HTTPS only; works regardless of whether VPS:22 is IP-locked.
2. **No SSH key in GitHub Secrets** — smaller attack surface; the runner is already authenticated on the box.
3. **Reuses the exact bash the `remote.ps1` actions run** — the deploy job is just `cd /var/www/digiuniversity && git pull && docker compose up -d --build && ... migrate ... health`, executed locally by the runner.
4. Standard pattern for single-VPS solo deploys.

Security note for Q1.b: a self-hosted runner runs any workflow code from the repo. Mitigations: restrict the runner to the `deploy` workflow triggered only by push-to-main (not PRs from forks — this is a private repo so fork-PR risk is nil), pin the runner to a dedicated low-priv user, and never run untrusted PR code on it.

Q1.a is viable IF the owner confirms VPS:22 accepts GitHub IPs (or is willing to allowlist them). It's the least new infrastructure if the firewall cooperates.

---

## ❓ Q2 — Deploy trigger

- **Q2.a (Recommended)** — Auto-deploy on every push to `main` **after** `ci.yml` + `security.yml` pass (via `workflow_run` dependency or a combined pipeline). Matches the owner's "Claude pushes → auto-deploy" goal. Claude only pushes vetted work, so every main push is deploy-intended.
- **Q2.b** — Deploy only on tagged releases (`v*` tags). Safer (explicit release gate) but adds a tagging step to every ship — friction against the "just push" goal.
- **Q2.c** — `workflow_dispatch` (manual button in GitHub UI) + auto on tags. Owner clicks deploy. Half-automated.

### ❓ Q2-dep — gate on CI passing?
- **Q2-dep.a (Recommended)** — Deploy job `needs:` the CI build+test jobs (or `workflow_run` after CI succeeds). Never deploy a red build. This is the safety spine.

---

## ❓ Q3 — Migration gate (sensitive — prod data)

- **Q3.a (Recommended)** — Auto-run `prisma migrate deploy` in the pipeline, BUT wrapped in safety: (1) **pre-deploy pg_dump backup** (the `backup` action already exists), (2) run migrate, (3) **post-migrate health check**, (4) **auto-rollback on health-fail** (image-tag rollback if pinned, else alert). `migrate deploy` is idempotent + only applies pending migrations + never resets — the production-safe command. The R2/R4 migration-failure lessons are mitigated by backup + health-gate.
- **Q3.b** — **Manual approval gate** via GitHub Environments: the deploy pauses before `migrate deploy` and waits for the owner to click "approve" in the GitHub UI. Maximum safety for the sensitive step; small friction. Good if the owner wants eyes on every schema change hitting prod.
- **Q3.c** — Split: auto-deploy code (compose up) on every push, but migrations only on manual `workflow_dispatch`. Decouples risky migrations from routine code deploys.

**Lean:** Q3.a (auto with backup + health-gate) for velocity, OR Q3.b (manual gate) if the owner wants a human checkpoint on every migration given the D74 lesson. Owner's call — this is the one place "fully automated" trades against "human eyes on prod schema changes".

---

## ❓ Q4 — Automated smoke depth

- **Q4.a (Recommended)** — **API-level smoke** post-deploy: (1) `health` action (4 services respond), (2) migration-applied check (`prisma migrate status` shows no pending), (3) a handful of endpoint probes (login → 200, a couple of authed GETs → 200, an anon route → 200), (4) bundle modulepreload check (curl `/` → only vendor chunks — the D66 guard). Fast (~30s), reliable, no browser. The owner's final 2-min mobile visual covers the rest.
- **Q4.b** — Q4.a **+ Playwright headless** visual regression (the existing `apps/web/tests/visual/*.spec.ts` against the deployed URL). Catches UI regressions automatically but is heavier (~3-5 min) + flakier (headless Chrome variance — the R7.1.1/R7.1.5.b lesson: single-run Lighthouse/headless is unreliable on this stack).
- **Q4.c** — API smoke + a single Playwright "does the app paint + login work" happy-path (one test, not the full visual suite). Middle ground.

**Recommendation: Q4.a.** The owner explicitly wants to keep the final visual manual ("owner فقط final 2-min visual موبایل"). Automated smoke should be the fast, reliable API gate; the existing visual specs stay as a separate manual/CI-on-demand suite (they already run in `ci.yml`'s build context for unit-level, and as D13 owner smoke for real-device). Don't put flaky headless visual in the deploy gate.

---

## ❓ Q5 — Rollback automation on smoke-fail

- **Q5.a (Recommended)** — **Alert-first, no auto-revert.** On smoke-fail: halt the pipeline, leave the (possibly half-broken) deploy as-is, and notify the owner (GitHub Actions failure notification + optional push/email). Owner decides: `remote.ps1 rollback` or fix-forward. Rationale: auto-revert on a transient health blip could revert a good deploy; a human should judge.
- **Q5.b** — **Auto image-tag rollback** on smoke-fail: if `pin-image` tagged the previous good images, the pipeline auto-runs `IMAGE_TAG=<prev> docker compose up -d --no-build` to restore the last-known-good, then alerts. Safer than git-revert (no history rewrite), fast. Requires the pin-image step to run on every successful deploy.
- **Q5.c** — Auto git-revert on smoke-fail. Most aggressive; rewrites main history via a revert commit. Not recommended (the transient-blip risk + the revert-commit noise).

**Lean:** Q5.a (alert-first) for the first iteration — get the pipeline working + trusted before adding auto-rollback. Q5.b is a good fast-follow once `pin-image`-on-deploy is wired.

---

## Secret management

Regardless of Q1:
- **Q1.a**: VPS SSH **private key** + host + user go in GitHub Secrets (`secrets.VPS_SSH_KEY`, `VPS_HOST`, `VPS_USER`). Use a **dedicated deploy key** (not the owner's personal key), scoped to the deploy user on the VPS with the minimum sudo needed (ideally none — docker group membership covers compose).
- **Q1.b**: **no SSH secret needed** — the runner registers with a GitHub runner token (one-time, during setup) + thereafter authenticates over its own channel. The deploy uses the runner's local VPS user.
- **Q1.c**: a **webhook secret** (`secrets.DEPLOY_WEBHOOK_SECRET`) shared between GitHub + the VPS listener.
- Never plaintext. `security.yml`'s gitleaks already guards against committed secrets — that stays the backstop.

---

## Proposed pipeline shape (assuming Q1.b + Q2.a + Q3.a + Q4.a + Q5.a)

```
push to main
  └─ ci.yml (web + api build/test)         [existing]
  └─ security.yml (gitleaks etc.)          [existing]
        │ (both green)
        ▼
  deploy.yml  [NEW]  — runs on self-hosted runner on the VPS
     1. checkout (fetch the pushed sha)
     2. pre-deploy backup    (pg_dump, 14-day rotation — existing backup action logic)
     3. git pull + docker compose up -d --build
     4. prisma migrate deploy
     5. (optional) seed       [Q: auto-seed or skip on prod? see note]
     6. pin-image (tag good images for fast rollback)
     7. smoke (API-level: health + migrate status + endpoint probes + modulepreload check)
        ├─ pass → done; notify "deployed <sha> ✓"
        └─ fail → halt + notify owner (Q5.a)  [or auto image-tag rollback if Q5.b]
```

**Seed-on-prod note:** `remote.ps1 seed` re-runs the seeder (idempotent upserts). On every auto-deploy, re-seeding is *usually* a no-op but does run upserts against prod. Q-decision sub-point: **auto-seed every deploy (idempotent, keeps demo data fresh) vs seed only on first deploy / manual**. Recommend auto-seed only when a new migration adds seedable demo data, else skip — or make seed a separate manual action. Flag for owner.

---

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| VPS:22 firewall blocks GitHub runners (Q1.a) | Q1.b/Q1.c sidestep it; confirm firewall before choosing Q1.a |
| Self-hosted runner executes malicious workflow code (Q1.b) | Private repo (no fork PRs); restrict runner to push-to-main; dedicated low-priv user |
| Migration fails on prod data mid-deploy | Pre-deploy backup (Q3.a) + `migrate deploy` is non-destructive + health-gate + rollback |
| Auto-deploy ships a bad commit | CI+security must pass first (Q2-dep.a); smoke gate catches runtime breakage; pin-image enables fast rollback |
| Smoke false-negative reverts a good deploy | Q5.a alert-first (no auto-revert) for v1 |
| Secret leakage | Dedicated deploy key (Q1.a) or no-SSH (Q1.b); gitleaks backstop |
| Concurrent deploys (two quick pushes) | `concurrency: deploy-${{ github.ref }}` cancel-in-progress (same pattern ci.yml uses) |

---

## What R-Infra is NOT (scope guard)
- ❌ Not a Kubernetes / multi-node migration — single VPS stays.
- ❌ Not replacing `remote.ps1` — it stays as the manual escape hatch + for one-off ops (backup, rollback, shell, logs).
- ❌ Not auto-running the full Playwright visual suite in the deploy gate (Q4.a keeps it API-level; visual stays owner-manual).
- ❌ Not changing the app, schema, or R4 (R4 stays held; this is orthogonal infra).

---

## Estimated scope (assuming Q1.b)
| Item | Effort |
|---|---|
| `scripts/runner-bootstrap.sh` (install + register self-hosted runner on VPS, idempotent) | ~80 LOC |
| `.github/workflows/deploy.yml` (the CD job: backup → pull → up → migrate → pin → smoke → notify) | ~120 LOC |
| `scripts/smoke.sh` (API-level smoke: health + migrate status + endpoint probes + modulepreload) | ~120 LOC |
| `docs/DEPLOY_AUTOMATION.md` (runbook: how it works, how to pause, how to roll back, how to re-register the runner) | ~150 LOC |
| `remote.ps1` — optional: a `runner-status` action to check the runner from Windows | ~20 LOC |

**Total: ~490 LOC**, 3-5 days. Q1.a is similar; Q1.c adds a small listener service (~+100 LOC).

**No D13 in the usual sense** — verification is: trigger a no-op deploy (push a trivial change) → watch the pipeline run green end-to-end → confirm the deployed sha matches + smoke passed + owner's 2-min visual. The first real deploy through the pipeline IS the acceptance test.

---

## Status
| Item | Status |
|---|---|
| Infra discovery | ✅ (existing ci.yml/security.yml, no deploy.yml, SSH-alias mechanism, VPS layout) |
| **Q1 deploy architecture** | ⏳ owner picks (gated on the VPS-firewall confirmation) |
| Q2–Q5 + seed-on-prod sub-Q | ⏳ owner ack |
| `deploy.yml` + runner + smoke + runbook | ⏳ NOT STARTED |
| R4 | ⏸️ HELD (orthogonal; resumes after owner final smoke) |

**Re-ack format:** «Q1.b Q2.a Q3.a Q4.a Q5.a شروع» (all recommended) — or pick alternatives. **Please also confirm the VPS firewall reachability** (`sudo ufw status` / cloud firewall on port 22) so Q1.a viability is settled. If Q1.b, the scoped impl memo + runner-bootstrap come next.

— R-Infra planning, 2026-05-28. Recommendation: self-hosted runner (Q1.b) to sidestep the SSH-reachability unknown; API-level smoke (Q4.a) keeping the owner's final visual manual. Owner decides architecture.
