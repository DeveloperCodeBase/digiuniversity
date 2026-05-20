# Security model

How the platform protects user data + sessions. Sibling to
`docs/PRIVACY.md` (what data we keep) and `docs/AI_GOVERNANCE.md` (how
we govern model outputs).

## Identity (Phase 2)

- Passwords are hashed with **bcryptjs** at cost factor `12` (cheap-er
  rounds are used only in the test harness; see `apps/api/test/helpers.ts`).
- Access JWTs are signed with HS256, default TTL `15m`. Refresh JWTs
  use a separate token type and a `30d` TTL.
- Refresh tokens are persisted as the **SHA-256 of the token**, never
  the raw value (`RefreshToken.tokenHash`) — a DB leak cannot mint
  sessions.
- Refresh tokens **rotate** on every `/v1/auth/refresh`; the consumed
  row is marked `revokedAt` and `replacedBy` references the new hash.
  Presenting an already-revoked token burns the whole family for that
  user (replay defence). See `auth.service.ts:refresh()` for the code
  and `test/auth.spec.ts` for the proof.
- A password change invalidates every active refresh for that user
  (`UsersController.changePassword`).

## RBAC (Phase 2)

- Global guards run for every request: `JwtAuthGuard` then `RolesGuard`.
  `@Public()` opts out of auth (used only on `/auth/{login,register,
  refresh,logout}` and `/health`).
- `@Roles("admin", …)` is applied at the controller-method level.
  Missing roles return `403` with the *required* and *actual* role
  lists in the message — explicit on purpose, see the rationale below.
- The `@CurrentUser()` decorator hands the resolved principal
  (`userId, tenantId, tenantSlug, email, roles[]`) to controllers.

### Why we leak the role list in 403 messages

Browse the existing tests — `RBAC dies with: "role required: one of
[admin] (got [student])"`. A common security convention is to return
opaque 403s. We chose the explicit form because:

- The frontend already knows the user's roles (from `/auth/me`); a
  401/403 message that omits the required role doesn't deny
  information the client doesn't already have.
- Operability — when ops triages a permission ticket, the role
  mismatch is on the response, not buried in a log.
- The protected resource itself is never returned, so the *data*
  sensitivity is preserved.

## Tenant isolation (Phase 2 + every phase after)

- Every domain row carries `tenantId`. Every read in services filters
  by `user.tenantId` resolved from the JWT principal.
- Composite uniques (`@@unique([tenantId, …])`) make accidental
  cross-tenant collisions impossible at the DB level.
- ADR 0004 records the explicit-filter-over-middleware decision and
  why we made that trade-off.

## Login enumeration

- `POST /v1/auth/login` returns the same 401 message for "tenant
  doesn't exist", "user doesn't exist", and "wrong password". A
  `test/auth.spec.ts` case locks this in.
- Registration returns `409 ConflictException` only when the calling
  client could already verify the email is in use (by attempting a
  login). It's deliberate.

## Audit trail

| Action                  | Audit table          | Joinable by             |
| ----------------------- | -------------------- | ----------------------- |
| Every AI gateway call   | `AiInteractionLog`   | `requestId`             |
| Every learner action    | `LearningEvent`      | `userId` + `occurredAt` |
| Every domain row change | `createdBy`/`updatedBy` + `updatedAt` | `userId` |
| Soft deletes            | `deletedAt`          | row id                  |

`AiInteractionLog` row writes never fail the user-facing call (logged
on failure). Same for `LearningEvent`.

## Transport + ingress

- The host Caddy (`hooshgate_caddy` on the VPS) is the single ingress
  on `:80`/`:443`. TLS is Caddy's automatic Let's Encrypt.
- `api` and `ai-gateway` are `expose: 4000 / 8000` only — never bound
  to a host port. The only public surface is `https://digiuniversity.ir`.
- nginx in the `app` container trusts forwarded headers from the
  docker bridge range so the real client IP / scheme reach the
  backend.

## Secrets handling

- `JWT_SECRET`, `POSTGRES_PASSWORD`, `AI_SERVICES_API_KEY` are env
  vars. `.env.example` ships placeholders only; real `.env` is
  gitignored.
- Bcrypt cost = `12` for real users; tests use `4` because Jest runs
  every login serially and `12` would dominate the suite runtime.
- We never log secret values. The audit log persists the *body of an
  AI request* (which may include user-authored text), but never the
  bearer token used to make it.

## Open questions tracked in `TECH_DEBT.md`

- Field-level encryption for PII at rest (Phase 10.5).
- Hardware-backed key for JWT signing instead of env var.
- Per-tenant rate limiting at Caddy.
