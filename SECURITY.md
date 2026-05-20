# Security policy

This document describes how secrets are managed for digiuniversity and
how to report vulnerabilities. It is intentionally brief — the source
of truth for *what* secrets exist is [`.env.example`](.env.example);
the source of truth for *how to rotate them* is this file plus the
implementation in [`scripts/remote.ps1`](scripts/remote.ps1).

## Reporting a vulnerability

If you find a security issue, please email **masoud.main@gmail.com**
with a description and reproduction steps. Do not open a public GitHub
issue. We aim to acknowledge within 72 hours and patch within 14 days
for high-severity issues.

## Where secrets live

```
.env.example          tracked in git, contains key NAMES only (no values)
.env                  on the VPS only, mode 0600, never committed
                      auto-loaded by `docker compose` from the project dir
```

The `.env` file on the VPS is the only place where production secret
*values* exist. It is excluded from git via `.gitignore`:

```
.env
.env.*
!.env.example
```

`.env.production`, `.env.production.*`, `*.env.local`, `*.env.backup`,
`*.sql`, `*.sql.gz` are also explicitly listed in `.gitignore` so that
no future `git add -A` can sweep them in.

## How to provision secrets on a new VPS

```powershell
# First time:
.\scripts\remote.ps1 provision-env
# Rotation (existing .env):
.\scripts\remote.ps1 provision-env -Force
# Inspect metadata (never prints contents):
.\scripts\remote.ps1 show-env
```

`provision-env` writes `/var/www/digiuniversity/.env` on the VPS with:

- `JWT_SECRET` — 64-char base64-safe random, ~384 bits of entropy.
- `ENCRYPTION_KEY` — 32-char base64-safe random for field-level encryption.
- `SEED_ADMIN_PASSWORD` — 24-char random; only used if `RUN_SEED=true`.
- `AI_SERVICES_API_KEY` — 64-char hex random; only relevant when
  `AI_MODE=external_api` is enabled (currently mock).
- `POSTGRES_PASSWORD` — preserved from the existing `.env` on rotation;
  for a brand-new VPS, defaulted to the value the existing
  `postgres-data` volume was initialised with. Genuine rotation of the
  Postgres password requires `ALTER USER` inside the running container,
  not just an `.env` edit — see [`docs/runbooks/db-rotate.md`](docs/runbooks/db-rotate.md)
  (TODO, Phase 21).

Secrets are NEVER printed back to stdout by `provision-env`. Only the
file's mode and var-count metadata are printed.

## When to rotate

| Trigger | Action |
| --- | --- |
| Suspected leak (e.g. logs leaked, laptop lost) | `provision-env -Force` immediately; restart api. |
| Routine | Every 90 days. Document in `docs/runbooks/quarterly-rotation.md` (TODO). |
| After a Phase X upgrade that changes the secret format (e.g. HS256 → RS256 JWT in P20) | Follow that phase's migration runbook. |

Rotation does NOT affect refresh tokens issued before the rotation —
they will fail signature verification on next use, forcing users to
re-login. That is the intended behaviour. If you need a soft rotation
that keeps existing sessions, dual-sign for one TTL window
(`JWT_SECRET_PREVIOUS` env) — that variant is not yet implemented.

## What's deferred

Subsequent phases will harden security further (per
[`C:\Users\98912\.claude\plans\c-users-98912-downloads-compass-artifac-memoized-harp.md`](file:///C:/Users/98912/.claude/plans/c-users-98912-downloads-compass-artifac-memoized-harp.md)):

- **Phase 13 R6**: Content-Security-Policy header (deferred from R1
  because too-strict CSP would break the SPA + Sentry + future
  Stripe iframes). Will land as report-only first, then enforce.
- **Phase 13 R7**: image-SHA-immutable tags (`digiuniversity:${IMAGE_TAG}`),
  cosign-signed images in `ghcr.io`.
- **Phase 13 R5**: remove the host-side `8090:80` port. The SPA will
  only be reachable via the `digiuniversity_web` docker network
  (Caddy already joins via `caddy-install`).
- **Phase 20**: Argon2id password hashing (migrate from bcrypt), RS256
  JWT, 2FA TOTP for elevated roles, HIBP password breach check,
  nginx-level rate limit on `/v1/auth/*`, `@nestjs/throttler` global,
  GDPR/PDPL data export + account deletion endpoints.

## Out of scope for this repo

The host Caddy (`hooshgate_caddy`) terminates TLS for digiuniversity
*and* other tenants. Its TLS certificate management, ACME account, and
listener bindings are not in this repo — they are in the hooshgate
ops repository. We assume the host Caddy is correctly configured per
[`infra/Caddyfile.snippet`](infra/Caddyfile.snippet) and joined to the
`digiuniversity_web` docker network via
`.\scripts\remote.ps1 caddy-install`.
