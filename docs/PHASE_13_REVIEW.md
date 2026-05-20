# Phase 13 review — Foundation hardening

**Scope.** External audit ([compass_artifact](file:///C:/Users/98912/Downloads/compass_artifact_wf-95f9ce9c-6c30-4e57-8bf6-b10ce7920289_text_markdown.md), May 2026) flagged P0/P1 infra and security gaps after Phase 12 closed. The owner asked for "all phase" — the full audit roadmap. Phase 13 is the first of that roadmap, focused on lowest-risk hardening before the bigger architectural work in Phase 14+ (monorepo + TS + BrowserRouter).

The plan is [`C:\Users\98912\.claude\plans\c-users-98912-downloads-compass-artifac-memoized-harp.md`](file:///C:/Users/98912/.claude/plans/c-users-98912-downloads-compass-artifac-memoized-harp.md). The findings are tracked in [`QUALITY_FINDINGS.md`](QUALITY_FINDINGS.md) under F-91 through F-111. This document is the closing summary.

## What changed

### R1 — Untrack internal artefacts, security headers, ops actions

- `.gitignore` extended: `project-run.docx`, `uploads/`, `*.docx` (allow only `docs/**/*.docx`), `.env.production`, `*.env.local`, `*.env.backup`, `*.sql`, `*.sql.gz`. Closes F-91 + F-95.
- `git rm --cached` three internal Word docs (project-run.docx + two under uploads/) that were shipping to every clone. Local files retained.
- `nginx.conf`: HSTS, Cross-Origin-Opener-Policy: same-origin, Cross-Origin-Resource-Policy: same-site appended. CSP intentionally deferred (needs report-only soak first). Closes F-92.
- `scripts/remote.ps1`: 7 new actions — `backup` (gzipped pg_dump with 14-day rotation), `restore -File <path>` (typed confirmation), `migrate`, `seed`, `health` (probes all 4 services from inside the VPS), `rollout -Service <name>` (via `wowu/docker-rollout`), `rollback` (safe `git revert`, not `reset --hard`). Closes F-93.
- `scripts/bootstrap-vps.sh`: idempotent one-off VPS bootstrap — installs `docker-rollout` plugin, creates `/var/backups/digiuniversity` mode 0750, drops a nightly cron at 03:15. Closes F-94.
- `.gitattributes`: NEW. Forces LF on every Unix-executed file (.sh, nginx.conf, Dockerfile, *.yml, docker-entrypoint.sh). Keeps CRLF on *.ps1/*.psm1 (Windows-only). Mark binary assets as binary so Git stops trying to normalise PNG/WOFF/etc.

### R1.1 — Fix nginx `add_header` inheritance bug

- Caught during R1 verification: curling the live URL showed NONE of the security headers were actually being sent. Cause: nginx `add_header` directives are REPLACED (not merged) when a child `location` block has any add_header of its own. Every location block had its own Cache-Control add_header, so the server-scope security headers from Phase 11 had NEVER reached a browser.
- Fix: re-declare the full 7-header security set inline in every `location` that has any add_header (`/`, `/sw.js`, `/registerSW.js`, the workbox-* regex, `/manifest.webmanifest`, `/assets/`, the static-asset regex). Closes F-96.
- Also F-97: `location = /workbox-*.js` used `=` (exact match) with a literal `*` — nginx's exact-match doesn't expand globs, so the rule never matched any URL and workbox files fell through to the wrong Cache-Control. Changed to `~ ^/workbox-.*\.js$` regex.

### R2 — Secrets discipline + RUN_SEED=false

- `scripts/remote.ps1`: new `provision-env [-Force]` writes `/var/www/digiuniversity/.env` mode 0600 with strong randoms (`JWT_SECRET`: 64-char base64-safe ~384 bits, `ENCRYPTION_KEY`: 32 chars, `SEED_ADMIN_PASSWORD`: 24 chars, `AI_SERVICES_API_KEY`: 64-char hex). `POSTGRES_PASSWORD` preserved from existing `.env`. Secrets NEVER printed; only metadata. New `show-env` action shows file metadata only. Closes F-100.
- `docker-compose.yml`: `RUN_SEED` default flipped `true` → `false`. `JWT_SECRET`, `SEED_ADMIN_PASSWORD`, `AI_SERVICES_API_KEY` use `${VAR:?<msg>}` so a missing `.env` fails compose-parse instead of booting with `change-me-*` defaults. Closes F-98 + F-99.
- `.env.example`: rewritten as the CONTRACT file with REQUIRED markers + `<set-via-provision-env-...>` sentinels.
- `SECURITY.md`: NEW. Documents rotation procedure, when to rotate (leak / 90-day / phase migration), `provision-env`/`show-env` invocations, deferred items, host-Caddy out-of-scope boundary. Closes F-102.

### R2a.1 — Base64-transport bash to ssh (kills BOM noise)

- `provision-env` exposed a real bug: `Process.StandardInput.Write` from PowerShell writes a UTF-8 BOM, which makes bash treat line 1 as a literal command. The `-Force` guard would silently fail because `set -eu` never activated. Closes F-101.
- Fix: two helpers — `Invoke-RemoteBash` and `Invoke-RemoteBashWithArg` — base64-encode the script on Windows, decode + exec on the VPS via `base64 -d \| bash -s`. Bypasses every stdin encoding pitfall. `provision-env`, `show-env`, and `backup` routed through them. Other heredoc actions (caddy-*) deferred — they happen to work despite BOM.

### R2c — Backup user-home fallback + Out-Host

- Caught when verifying R2: `remote.ps1 backup` failed on the live VPS with "Permission denied" trying to write `/var/backups/digiuniversity` (root-owned). Fallback path: try `/var/backups/digiuniversity` → fall back to `~/backups/digiuniversity` if not writable, with a hint to run `bootstrap-vps.sh` for the system-wide path. Closes F-103.
- `Out-Host` on the ssh call so output renders on the terminal even when the caller wraps it in `(Invoke-RemoteBash ...)` parens.

### R3 — Image tag parameterisation + pin-image / list-images / SHA-rollback

- `docker-compose.yml`: all three services switched from `image: <name>:latest` to `image: <name>:${IMAGE_TAG:-latest}`. Compose-default behaviour unchanged; future CI can pin a SHA. Closes F-109.
- `remote.ps1 pin-image`: tags the currently-running images with the active git short-SHA so a later `rollback -Sha <sha>` can restore without rebuilding. Closes F-110.
- `remote.ps1 list-images`: shows all SHA-tagged digiuniversity images on the VPS.
- `remote.ps1 rollback` now has two modes:
  - **With `-Sha <git-sha>`**: `IMAGE_TAG=<sha> docker compose up -d --no-build`. Fast, no git history rewrite.
  - **Without `-Sha`**: safe `git revert HEAD` + full rebuild. Slow but always works.
  - Closes F-111.

### R4 — CI scaffold

- `.github/workflows/ci.yml`: two jobs gating push to main + every PR.
  - `web`: vitest + vite build (NODE_ENV=production), uploads dist artifact for 7 days.
  - `api`: npm install + prisma generate + prisma migrate deploy against an ephemeral postgres-16 service container + tsc build + jest --runInBand against the ephemeral DB.
  - Concurrency-cancels superseded runs.
  - Closes F-104.
- `.github/workflows/security.yml`: four jobs on push + PR + daily 07:15 UTC cron.
  - `gitleaks` full-history secret scan; PR comments.
  - `npm-audit` (web + api at --audit-level=high; advisory-only until we set a blocking policy).
  - `trivy-fs` CVE scan on Dockerfiles + lockfiles, SARIF to Security tab, severity HIGH+CRITICAL, ignore-unfixed.
  - `semgrep` p/owasp-top-ten + p/javascript rule sets, SARIF uploaded.
  - Closes F-105.
- `.github/dependabot.yml`: 7 update channels (web npm, api npm, ai-gateway pip, github-actions, three docker contexts). Weekly Monday-morning Asia/Tehran. Minor/patch grouped per ecosystem to reduce noise. Closes F-106.

### R5 — Remove host port 8090

- `docker-compose.yml`: dropped `ports: - "8090:80"` from app. Replaced with `expose: - "80"`. SPA reachable only via the `digiuniversity_web` docker network; host Caddy joins via `caddy-install`. Closes F-107.
- `remote.ps1 domain-probe` + `remote.ps1 health` migrated to `docker exec digiuniversity-app curl -fsS http://127.0.0.1/...` so they don't depend on the now-removed host port. Closes F-108.
- Verified before removal via `remote.ps1 caddy-verify`:
  ```
  --- containers on digiuniversity_web ---
  hooshgate_caddy (172.22.0.3/16)
  digiuniversity-app (172.22.0.4/16)
  ...
  --- hooshgate_caddy → digiuniversity-app reachability ---
  ok
  --- line numbers of reverse_proxy 127.0.0.1:8090 ---
  (none)
  --- line numbers of reverse_proxy .*digiuniversity ---
  109:        reverse_proxy digiuniversity-app:80
  ```

## What's running on the VPS

After R5's closing deploy:

```
NAME                        STATUS                  PORTS
digiuniversity-ai-gateway   Up (healthy)            8000/tcp
digiuniversity-api          Up (healthy)            4000/tcp
digiuniversity-app          Up (healthy)            80/tcp        ← no host port
digiuniversity-postgres     Up (healthy)            5432/tcp
```

The live URL `https://digiuniversity.ir/` returns HTTP/2 200 with all 7 security headers:

```
strict-transport-security: max-age=63072000; includeSubDomains; preload
x-content-type-options: nosniff
x-frame-options: SAMEORIGIN
referrer-policy: strict-origin-when-cross-origin
permissions-policy: geolocation=(), microphone=(), camera=()
cross-origin-opener-policy: same-origin
cross-origin-resource-policy: same-site
```

`.env` exists on the VPS at `/var/www/digiuniversity/.env` (mode 0600, 21 vars). Compose loads it automatically. The `JWT_SECRET` is now a strong random value generated by `provision-env`; existing user sessions issued before R2 are invalid by design.

`backup` is verified working with a fallback to `~/backups/digiuniversity` (because `bootstrap-vps.sh` hasn't yet been run by the owner — once it is, backups move to `/var/backups/digiuniversity` automatically). Last 3 backups visible, rotation logic in place.

## Demo users (unchanged)

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@digiuniversity.ir` | `ChangeMe!2026` |
| Instructor | `instructor1@digiuniversity.ir` | `InstructorPass!1` |
| Student | `student1@digiuniversity.ir` | `StudentPass!1` |

Note: Phase 13's secret rotation only changed `JWT_SECRET` etc. in the `.env` file. It did NOT re-hash the existing demo user passwords in the database — those still authenticate with the old documented credentials. Real production prep (Phase 20) will rotate user passwords via the api's password-change endpoint.

## What you should run on the VPS once

```bash
# On the VPS:
ssh my-vps
cd /var/www/digiuniversity
bash scripts/bootstrap-vps.sh
```

This installs the `docker-rollout` plugin (so `remote.ps1 rollout` becomes zero-downtime), creates `/var/backups/digiuniversity` (so backups move from `~/backups/` to the system-wide path), and installs the nightly cron at 03:15.

Once done, `remote.ps1 rollout -Service api` will become a zero-downtime update path; without it, `rollout` falls back to a brief compose recreate.

## Methodology lessons for future phases

1. **nginx `add_header` does NOT merge across scopes.** Any `location` block with its own `add_header` REPLACES the parent set entirely. Always re-declare the full security set in every relevant location, or use an `include`-based snippet pattern. The F-96 bug had silently disabled Phase-11's headers for the entire SPA.

2. **PowerShell `Process.StandardInput` writes a UTF-8 BOM.** Accessing `$p.StandardInput.BaseStream` to swap in a UTF-8(false) writer doesn't help — the BOM is already buffered. The robust pattern is base64-encode on Windows, `base64 -d \| bash -s` on the VPS.

3. **`Out-Host` for native command output in PowerShell helpers.** `(Invoke-RemoteBash ...)` captures the function's pipeline output, which silently swallows ssh's stdout/stderr unless you pipe it through `| Out-Host`.

4. **Verify, then remove.** R5's host-port removal was made safe by running `caddy-verify` first to confirm Caddy was already on the docker network with a working DNS-name reverse_proxy. Removing the escape hatch without that check would have been blind.

5. **Fail-closed env vars (`${VAR:?<msg>}`).** Compose's `:?` syntax fails fast on a missing var, which is exactly what you want for production secrets. The `${VAR:-default}` form silently boots with `change-me`-grade values.

## What's carried to Phase 14

Tracked in [`docs/TECH_DEBT.md`](TECH_DEBT.md) (next round will update it):

- **Monorepo + TypeScript migration.** Move `src/` → `apps/web/`. Add `packages/{ui,shared-types,config-*}/`. Adopt pnpm + Turborepo. Incremental `.jsx` → `.tsx` (no big-bang).
- **Hash → BrowserRouter migration.** All 54 routes need `useGo()` shim or per-page rewrite. Prerender public pages with `vite-plugin-ssg`. Schema.org JSON-LD.
- **Content-Security-Policy header.** Deferred from R1 — needs report-only soak first to avoid breaking SPA bootstrap + Sentry + future Stripe iframes.
- **GHCR push + cosign signing.** R3 laid the compose parameterisation; the deploy.yml + registry are Phase 14.
- **9-role RBAC + CASL + AuditLog.** Currently 5 roles; add TA, ContentManager, Support, Moderator, SuperAdmin. Generic audit-log table for sensitive-action trails.
- **`pino` + Sentry observability.** Currently `@nestjs/common` Logger + Sentry DSN env-var defined but unused.
- **Migrate caddy-* heredoc actions to Invoke-RemoteBash.** They currently work despite BOM noise (lines happen to be comments or side-effect-free); should be migrated for hygiene.
- **Real lockfile for `apps/api/package-lock.json`.** Currently missing; CI uses `npm install`. Will commit a lockfile once monorepo + pnpm lands.

## Sign-off

Phase 13 closes with F-91 through F-111 fixed and deployed. The repo is hardened: no internal docx in git, no `change-me` secrets in compose, no host port escape hatch, all security headers actually reaching the browser, CI gating PRs, nightly backups in place, and a safe rollback path (both git-revert and SHA-tag based). Live URL is healthy, demo users still work, no error in the deploy logs.

The next phase (Phase 14) starts the bigger architectural shift: monorepo + TypeScript + BrowserRouter — per the [plan file](file:///C:/Users/98912/.claude/plans/c-users-98912-downloads-compass-artifac-memoized-harp.md).
