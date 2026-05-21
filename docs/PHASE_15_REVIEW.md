# Phase 15 review — RBAC depth + audit log + rate limit + CSP

**Scope.** First half of the plan-file Phase 15. Backend gets a generic audit table behind a global interceptor, the role catalogue extends from 5 to 10 entries, every mutating endpoint declares its action explicitly, the front door of every endpoint gets a per-IP rate-limit bucket, and the web tier ships a Content-Security-Policy in Report-Only soak.

Plan: [`C:\Users\98912\.claude\plans\c-users-98912-downloads-compass-artifac-memoized-harp.md`](file:///C:/Users/98912/.claude/plans/c-users-98912-downloads-compass-artifac-memoized-harp.md).

Open items deferred to Phase 15 R6+ (CASL ability layer, CASL `<Can>` on the SPA, 9-role frontend nav extension) are tracked under their own plan-file headings — they need their own deploy + soak cycle and don't share infra with this round.

## What changed

### R1 — `AuditLog` model + 5 new role seeds

- `apps/api/prisma/schema.prisma`: new `AuditLog` model with `tenantId` / `actorId` (nullable for system + anonymous actions) / `action` / `subject` / `before` / `after` / `ip` / `userAgent` / `requestId` / `createdAt`. Two foreign keys: `tenantId` cascade-deletes, `actorId` set-null. Five indexes: `(tenantId, createdAt)`, `(actorId, createdAt)`, `subject`, `action`, `requestId`. `User.auditedActions` and `Tenant.auditLogs` back-relations added.
- `apps/api/prisma/migrations/20260521000000_audit_log/migration.sql`: hand-written raw SQL with `CREATE TABLE` + indexes + FK constraints. `*.sql` is gitignored from Phase 13 R1 — added a `!apps/api/prisma/migrations/**/migration.sql` negation so Prisma migrations stay tracked. Closes F-120.
- `apps/api/src/prisma/seed.ts`: default role array extended from 5 to 10 — `admin`, `instructor`, `student`, `parent`, `org` plus `ta`, `content_manager`, `support`, `moderator`, `super_admin`. Demo user array extended with `parent1@…` / `org1@…` (two roles that had no demo user before, blocking the "log in as every role" smoke walk). Closes F-121.

### R2 — `AuditLogService` + `AuditInterceptor` + admin viewer

- `apps/api/src/audit/audit.service.ts`: `AuditLogService.log()` writes one row, best-effort. Errors swallowed and stderr-logged so a bad audit write can never break the underlying request.
- `apps/api/src/audit/audit-action.decorator.ts`: two `SetMetadata` decorators — `@AuditAction(name)` to declare a clean dotted action name, `@AuditSkip()` to opt a high-volume / self-logging endpoint out of the interceptor entirely.
- `apps/api/src/audit/audit.interceptor.ts`: registered as `APP_INTERCEPTOR`, so it wraps every controller method without being declared per-controller. For non-GET handlers it captures `actor` (`req.user`), `ip` (`req.ip`, real client through trust-proxy), `userAgent`, a `subject` of the form `<resource>:<id>` (using the route `:id` param or the response's `id` field), and `before`/`after` snapshots when present. Action falls back to `<method>.<first-path-segment>` so even an endpoint that forgets `@AuditAction` still produces a row — just an uglier one.
- `apps/api/src/audit/audit.controller.ts`: `GET /v1/audit-logs` for admins, with `tenantId`-scoped filter on `actor`/`action`/`subject` and `limit`/`offset` paging. R2.1 then merged the per-param `ParseIntPipe` extraction back into the DTO with `@Type(() => Number)` after the original double-extraction caused 400 "limit must be an integer" on every call — DTOs and pipes were both reading `Query()`, and the DTO's `@IsInt` rejected the un-transformed string. Closes F-122 + F-123.
- `apps/api/src/audit/audit.module.ts`: `@Global()` so `AuditLogService` is injectable everywhere without each consumer re-importing.

### R3 — `@AuditAction` naming sweep across all mutating controllers

Every `@Post` / `@Patch` / `@Delete` handler in every controller now declares its audit action explicitly. Patterns are `<resource>.<verb>` (`course.create`, `enrollment.status.change`, `submission.grade`, `tutor.session.delete`, `class-session.analyze`, etc.). The interceptor's auto-fallback (`<method>.<first-segment>`) still exists but never fires under steady state, so the `/v1/audit-logs` viewer stays operator-friendly.

Two endpoints carry `@AuditSkip` instead, by design:

- `POST /v1/learning-events` — pings fire every ~15 s during a video session; the `LearningEvent` table IS the audit trail for those.
- `POST /v1/ai-logs` — `AiInteractionLog` is itself the audit table for AI interactions.

`auth.controller`'s `login` / `register` / `refresh` are `@Public` and intentionally NOT decorated: those flows have no useful `before`/`after` (they mint sessions; the JWT payload is the audit trail elsewhere). Only `auth.logout` is `@AuditAction("auth.logout")`.

Coverage is 1:1 — `N(@Post|@Patch|@Delete handlers) == N(@AuditAction|@AuditSkip|@Public)` per controller. Verified by grep, not manually. Closes F-124.

### R4 — Per-IP rate limit via `@nestjs/throttler`

- `apps/api/package.json`: `@nestjs/throttler@^6.4.0` (Nest 10 compatible).
- `apps/api/src/app.module.ts`: `ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 600 }])` + `ThrottlerGuard` as `APP_GUARD`. Guard order is now `ThrottlerGuard → JwtAuthGuard → RolesGuard` — the throttle fires BEFORE any DB / bcrypt work, so a flood of unauthenticated `POST /v1/auth/login` cannot pin the CPU regardless of credentials.
- `apps/api/src/auth/auth.controller.ts`: `register` / `login` / `refresh` get `@Throttle({ default: { limit: 10, ttl: 60_000 } })` — 10 attempts per minute per IP, generous for typo recovery, painful for credential-stuffing from a single source.
- `apps/api/src/analytics/learning-events.controller.ts` `POST /v1/learning-events`: `@SkipThrottle()`. Progress pings + page-views from an honest active learner would hit the 600/min ceiling otherwise; the endpoint is still gated by `JwtAuthGuard`.
- `apps/api/src/health/health.controller.ts`: `@SkipThrottle()` — Caddy upstream-check and `remote.ps1 health` probes must not rate-limit themselves out of monitoring.
- Storage stays in-memory because we run a single api replica. The comment in `app.module.ts` notes the path to `ThrottlerStorageRedisService` when we go horizontal in Phase 17. Closes F-125.

### R5 — Content-Security-Policy (Report-Only) + nginx snippet refactor

The Phase 14.8 PWA recovery bootstrap was inline `<script>` in `index.html`. CSP `script-src 'self'` blocks every inline script; allowing `'unsafe-inline'` would defeat most of the policy. Externalised the script verbatim to `apps/web/public/sw-recovery.js`, referenced from `<head>` as `<script src="/sw-recovery.js"></script>`. Synchronous + parser-blocking + same origin → still runs pre-paint, controllerchange listener + one-time kill-switch behaviour unchanged. Dedicated `location = /sw-recovery.js` block in nginx with `Cache-Control: no-cache, no-store, must-revalidate` so each deploy lands fresh logic. Closes F-126.

Replaced the 8 copies of the 7-header security set in `nginx.conf` with a single `snippets/security-headers.conf` `include`d from every location. Adds an 8th header — `Content-Security-Policy-Report-Only` — with this policy:

```
default-src 'self';
script-src 'self' 'wasm-unsafe-eval';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: https:;
connect-src 'self';
worker-src 'self';
manifest-src 'self';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
object-src 'none';
```

Notes on the choices:

- `script-src 'self'` is the strict half — no `'unsafe-inline'`, no `'unsafe-eval'`, no `'strict-dynamic'`. `'wasm-unsafe-eval'` covers KaTeX / pdf.js / TipTap-math without the legacy `'unsafe-eval'` keyword re-enabling JS `eval()`.
- `style-src` allows `'unsafe-inline'` because React's `style={{}}` compiles to inline style attributes — without a nonce-injection pipeline this is the industry default for React apps; CSS injection rarely escalates.
- `connect-src 'self'` is enough because the SPA talks to `/v1/*` on the same origin through the host Caddy that fronts both web and api containers; the SPA never sees a separate API origin in production.
- `frame-ancestors 'none'` is the modern replacement for `X-Frame-Options: SAMEORIGIN` — both are sent for browsers that haven't caught up.
- The header name is `-Report-Only` for one round so a regression doesn't break the SPA for every user. Round 6 will rename to `Content-Security-Policy` once the browser console shows zero violations under steady real-user traffic.

`apps/web/Dockerfile`: `COPY snippets/ /etc/nginx/snippets/` so the runtime image carries the included file. Closes F-127 + F-128.

### Caddy upstream collision (production-impacting)

While verifying R5 with the new `security-probe`, the front-door `POST /api/v1/auth/login` 502'd from a stale upstream IP. Root cause: `hooshgate_caddy` is on several stack networks (ainu, algal-blooms, animal-husbandry, …) and the canonical Caddyfile snippet used the SHORT service alias `api:4000`. Docker's embedded DNS returns the first match across Caddy's joined networks, so `api` resolved to **ainu-api** (172.25.0.4) instead of **digiuniversity-api** (172.22.0.6) and 502 was the inevitable result for the entire production site's auth flow.

Fix: `infra/Caddyfile.snippet` now uses the full container names — `digiuniversity-api:4000`, `digiuniversity-ai-gateway:8000`, `digiuniversity-app:80`. No more cross-stack collisions. Closes F-129.

Secondary fix in `scripts/remote.ps1`: the original `caddy-reload` action called `caddy reload --config /etc/caddy/Caddyfile`, which reads the CONTAINER-side Caddyfile. If the bind mount got orphaned by a previous in-place edit (Caddyfile inode in container != inode on host), that reload reverted to the stale config. New behaviour streams the host file into Caddy via stdin (`sudo cat $HOST_CADDYFILE | docker exec -i hooshgate_caddy caddy reload --config /dev/stdin`), bypassing the orphaned bind mount and also forcing full upstream DNS re-resolution. Closes F-130.

### Operator verification harness — `remote.ps1 security-probe`

Single command. Asserts in this order:

1. `Content-Security-Policy-Report-Only` header present on `GET https://digiuniversity.ir/`.
2. `GET /sw-recovery.js` returns 200 with a `Cache-Control` header.
3. 12 × `POST /api/v1/auth/login` from inside the VPS — expects 10× 400/401 + at least 1× 429. If any 502 fires, prints the hint to run `remote.ps1 caddy-reload`.
4. Internal sanity: `GET http://<api-container-ip>:4000/v1/health` returns 200.

Failure exits non-zero so the script can gate CI later.

## Verification — full live run after R7

```
> .\scripts\remote.ps1 security-probe

--- (1) CSP header on / ---
content-security-policy-report-only: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; …

--- (2) /sw-recovery.js cache + existence ---
HTTP/2 200
cache-control: no-cache, no-store, must-revalidate

--- (3) /api/v1/auth/login rate limit via Caddy (front-door) ---
summary: 10 x 400|401 (rejected creds), 2 x 429 (rate-limited), 0 x 502 (caddy upstream stale)
PASS: rate limit fired after the configured bucket size

--- (4) sanity: api container reachable on internal network ---
direct GET http://172.22.0.6:4000/v1/health -> 200

--- (5) Phase-15 R6: CASL gate + /v1/auth/me ships abilities ---
  student GET /v1/audit-logs -> 403 (expect 403 from CASL/Roles)
  student GET /v1/auth/me     -> abilities field present? yes
PASS: CASL gate denies non-admin AND /v1/auth/me ships role-shaped ability rules

--- (6) Phase-15 R7: support + super_admin can read /v1/audit-logs ---
  support     GET /v1/audit-logs -> 200 (expect 200)
  super_admin GET /v1/audit-logs -> 200  (expect 200)
PASS: support + super_admin can read AuditLog via the CASL positive path
```

### R6 — CASL AbilityFactory + PoliciesGuard backend (commit [`c264c94`](https://github.com/DeveloperCodeBase/digiuniversity/commit/c264c94))

Replaces nothing — drops a second authorization layer beside `@Roles`. The two cooperate: `RolesGuard` is the coarse gate (route is admin-only), `PoliciesGuard` is the fine gate (this admin can read AuditLog but cannot delete Tenant). Migration-safe: endpoints without `@CheckPolicies` pass through PoliciesGuard unaffected.

What shipped:

- `apps/api/src/authz/ability.types.ts` — `Actions × Subjects` union; `AppAbility` alias over CASL's `PureAbility`. Verbs include CRUD primitives plus `publish`, `enroll`, `grade`, `moderate` so policies read like English in controllers.
- `apps/api/src/authz/ability.factory.ts` — per-role rule builder modeled role-first from the audit fase-2 matrix. `super_admin` manages all but cannot `delete AuditLog` (forensic continuity even for break-glass). `admin` is full-control within tenant. `instructor` / `ta` / `content_manager` / `support` / `moderator` / `parent` / `org` / `student` each get scoped verb+subject grants.
- `apps/api/src/authz/policies.guard.ts` — `APP_GUARD` after `RolesGuard`. Reads `@CheckPolicies` metadata, builds the user's ability, calls each policy handler, throws `ForbiddenException` on denial. Empty `@CheckPolicies` ≡ pass.
- `apps/api/src/authz/check-policies.decorator.ts` — `@CheckPolicies(...handlers)` decorator + `PolicyHandler` type.
- `apps/api/src/authz/authz.module.ts` — `@Global()` so `AbilityFactory` injects anywhere.

First adopter: `audit-logs` viewer now declares `@CheckPolicies((ab) => ab.can("read", "AuditLog"))` alongside the existing `@Roles("admin", "super_admin", "support")`. Both must agree today; the value is that we can later split admin into "admin reads own-tenant only, super_admin reads any-tenant" via AbilityFactory without touching the controller.

`/v1/auth/me` now returns `abilities` — the user's CASL rule set packed with `@casl/ability/extra` `packRules()`. The SPA rehydrates in R7. Backward-compat: the rest of `/me` is unchanged; pre-R7 clients ignore the new field.

### R7 — CASL on the SPA + 5 new roles in nav + live `/audit` page (commit [`2ff8f96`](https://github.com/DeveloperCodeBase/digiuniversity/commit/2ff8f96))

Brings the CASL layer to the browser, surfaces the 10-role catalogue end-to-end, and ships the first production-quality audit-log viewer.

`apps/web/src/auth/`:
- `ability.ts` — `AppAbility` alias, `buildAbility()` rehydration via `@casl/ability/extra unpackRules`. Empty-ability fallback returns a CASL instance where every `can(...)` is false, so callers never need a null check.
- `Can.tsx` — `<Can I="action" a="Subject">` wrapper around `@casl/react createContextualCan`; also exports `useAbility()` for non-JSX checks.
- `AuthContext.tsx` — fetches `/v1/auth/me` on mount + after `login` + after `register` so `abilities` is always fresh. Persisted via `sessionStore` so a hard reload doesn't briefly drop the ability set. Published via `AbilityContext` alongside the existing `AuthContext`.

`apps/web/src/pages/Audit.tsx` (new) — production AuditLog viewer at `/audit`. Calls `useAbility()` at the top to render a denial state when the user cannot read AuditLog; the api enforces the same gate via R6's `@CheckPolicies`. Table view with action filter, pagination counter, Persian datetime, and 8-char request-id snippet for forensic joins to the api logs.

`apps/web/src/role.tsx` — `RoleId` union widened from 5 to 10. The 5 original entries (`student` / `instructor` / `admin` / `parent` / `org`) are byte-identical; the 5 new entries (`ta` / `content_manager` / `support` / `moderator` / `super_admin`) each get a Persian label, an avatar string, a `homeRoute`, and a tailored `nav` list. `RolePermission` union extended with `tutor-students`, `publish-content`, `audit-read`, `reset-passwords`, `moderate-discussions`, `cross-tenant`.

`apps/web/src/shared.tsx` + `apps/web/src/sidenav.tsx` — `NAV_ITEMS_BY_ROLE`, `ROLE_WORKSPACE_LINK`, and `SIDEBAR_BY_ROLE` each gained 5 entries shaped to what the new role can actually do. Support's sidebar centers on audit + inbox; super_admin gets cross-cutting overview + audit + analytics; TA mirrors instructor but trimmed; content manager owns the authoring studio; moderator centers on community.

`apps/api/src/prisma/seed.ts` — 5 new demo users (`ta1@`, `cm1@`, `support1@`, `moderator1@`, `superadmin@`). Each has a `SEED_*_PASSWORD` env override. Idempotent on `(tenantId, email)`.

`apps/web/src/pages/Auth.tsx` `DEMO_CREDS` and `docs/DEMO_USERS.md` — refreshed canonical list of all 10 demo logins so the LoginPage one-click "پر کردن خودکار" panel works for every role on the demo tenant.

## What did NOT change

- No 2FA TOTP — Phase 20 work.
- No Argon2id — Phase 20 work (the auth.service Argon2id path is gated on the password-hash field in the User schema, which we'll add then).
- No CSP report-uri / report-to endpoint — collecting violation reports needs Sentry (Phase 17). For now the browser console + DevTools is the soak channel.
- No `X-Forwarded-For` whitelist on the throttler — the express `trust proxy: true` setting already lets it resolve the real client IP through Caddy + nginx. We don't need a custom getTracker.
- No record-level CASL scoping yet (e.g. "instructor can update courseX but not courseY"). CASL supports it via `subject("Course", row)`; the sweep across 17 controllers is its own follow-up so the diff stays reviewable. The verb+subject layer that R6+R7 ship is what the UI needs to render `<Can>` correctly for every common case.

## Risk + follow-ups

- **CSP soak.** If a violation report surfaces a legitimate use (e.g. a third-party widget the SPA mounts late), update `snippets/security-headers.conf` BEFORE flipping to enforcing. The `Report-Only` mode is the safety net.
- **Throttler memory.** A single-IP attacker dies at 10/min for auth + 600/min global. A distributed attack from N different IPs each at 10/min still works against bcrypt — that's a Phase 17 concern (CDN / WAF in front, plus Argon2id which is more memory-bound).
- **Caddy upstream collision discipline.** Any future container-named service that lands on `hooshgate_caddy`'s network must avoid colliding with existing aliases. The full-name pattern in `Caddyfile.snippet` is the rule; documented inline.
- **Audit log size.** No partitioning / archival policy yet. Defer to Phase 17 with retention windows + cold storage.

## Files touched

Backend:
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/20260521000000_audit_log/migration.sql`
- `apps/api/src/prisma/seed.ts` (+ 5 new demo users for R7 roles)
- `apps/api/src/audit/*` (new)
- `apps/api/src/authz/*` (new — R6 CASL backend)
- `apps/api/src/app.module.ts`
- `apps/api/src/auth/auth.controller.ts` (R6: /me ships packed abilities)
- `apps/api/src/audit/audit.controller.ts` (R6: @CheckPolicies adopter)
- `apps/api/package.json` (+ `@nestjs/throttler`, `@casl/ability`)
- 17 controllers gained `@AuditAction` / `@AuditSkip` / `@Throttle` / `@SkipThrottle` decorators (no behaviour change beyond declared metadata).

Web:
- `apps/web/index.html` (inline → external script)
- `apps/web/public/sw-recovery.js` (new)
- `apps/web/snippets/security-headers.conf` (new)
- `apps/web/nginx.conf` (8 location blocks switched to `include`)
- `apps/web/Dockerfile` (`COPY snippets/`)
- `apps/web/src/auth/ability.ts` (new — R7 SPA ability rehydration)
- `apps/web/src/auth/Can.tsx` (new — R7 `<Can>` + `useAbility()`)
- `apps/web/src/auth/AuthContext.tsx` (R7: fetches /me, ships abilities)
- `apps/web/src/role.tsx` (R7: 5 → 10 RoleId entries)
- `apps/web/src/shared.tsx` + `apps/web/src/sidenav.tsx` (R7: nav for 5 new roles)
- `apps/web/src/pages/Audit.tsx` (new — live audit-log viewer at `/audit`)
- `apps/web/src/pages/Auth.tsx` (R7: DEMO_CREDS extended)
- `apps/web/src/router.tsx` (R7: `/audit` route)
- `apps/web/package.json` (+ `@casl/ability`, `@casl/react`)

Infra + ops:
- `infra/Caddyfile.snippet` (`api:4000` → `digiuniversity-api:4000`)
- `scripts/remote.ps1` (`caddy-reload` via stdin; `security-probe` action with CASL positive + negative paths)
- `.gitignore` (negation for Prisma migration.sql)

Docs:
- `docs/DEMO_USERS.md` (R7: 10 demo logins, 10 SEED_* env vars)
- `docs/PHASE_15_REVIEW.md` (this file)
