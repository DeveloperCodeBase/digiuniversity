# Testing

## How to run

From Windows:

```powershell
.\scripts\remote.ps1 test
```

That action, in order:

1. `git push origin main`
2. SSH to the VPS, `git pull`,
3. `docker compose --profile test build api-test` (builds the `test`
   stage of `apps/api/Dockerfile` once, then is cached),
4. `docker compose --profile test run --rm api-test` (a one-off
   container that runs `npx jest --runInBand --forceExit`).

The test image is opt-in via the compose `test` profile, so a
normal `docker compose up` never starts it.

## What's covered (Phase 10)

| Suite                    | What it proves                                             |
| ------------------------ | ---------------------------------------------------------- |
| `test/auth.spec.ts`      | `/auth/me` works; tenant enumeration is blocked; refresh   |
|                          | rotation; replay of a revoked refresh burns the family.    |
| `test/rbac.spec.ts`      | Students can't list users (`@Roles("admin")`); admins can; |
|                          | unauthenticated requests return 401.                       |
| `test/enrollment.spec.ts`| Self-enrol, duplicate→409, role-aware status transitions   |
|                          | (student withdraw, admin reactivate).                      |
| `test/tutor.spec.ts`     | Tutor `ask` round-trip through the AI bridge; both         |
|                          | turns persisted; `AiInteractionLog` row + `LearningEvent`  |
|                          | emitted; cross-user session is forbidden.                  |

## Strategy

- Tests are **integration-style** — they boot the real Nest
  application via `Test.createTestingModule(...).createNestApplication()`
  and hit it over HTTP with `supertest`. No mocks for Prisma, no
  mocks for `AiBridgeService`.
- Tests share one running Postgres + ai-gateway with the production
  workload. Isolation comes from **per-suite tenant slugs** — every
  spec creates its own tenant with a random suffix; nothing collides.
- Tests do not clean up. Tenant rows accumulate in the demo DB;
  Phase 10.5 ships a retention job that drops `test-…` slugs older
  than N days.
- `--runInBand` keeps Jest single-threaded so a single Nest
  application can be cached across specs. This shaves boot time
  from ~25s to ~3s for a four-suite run.

## What's deliberately not tested yet

- Frontend tests (`tests/data.test.js` from the original Vite app is
  still there but doesn't exercise the live API). Phase 10.5 adds
  Playwright e2e specs against `https://digiuniversity.ir`.
- The `ai-gateway` endpoints — exercised transitively through the
  bridge in `tutor.spec.ts`. A standalone Python pytest suite for
  the gateway lands when the gateway gains business logic beyond
  mock provider responses.
- LiveKit / BBB providers — Phase 6 ships only `MockLiveClassProvider`,
  which is exercised by `class-sessions.service` integration paths.
  Real-provider tests land when the real implementation does.

## Adding a new test

1. Create `apps/api/test/<feature>.spec.ts`.
2. `import { createTestTenant, getRequest, getPrisma } from "./helpers"`.
3. Inside `it(...)`, get a request + a fresh tenant + tokens, then
   call endpoints with `supertest`. Inspect side-effects via the
   prisma client when needed.
4. Run locally with `npm test` inside the `api` container (or via
   `.\scripts\remote.ps1 test`).

## Vitest (frontend)

The original Vite SPA ships `tests/data.test.js` (Vitest, jsdom).
It exercises the static mock-data layer. It does not run as part of
the api test suite. To run it on the VPS:

```powershell
.\scripts\remote.ps1 shell
# inside the VPS:
docker compose run --rm --build app sh -c "cd /app && npm test"
```

That path is unblocked by Phase 1's package-lock.json fix but is
not wired into the runbook's `test` action by default — the api
tests are the ones that catch real regressions.
