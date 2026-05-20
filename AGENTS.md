# Agent Rules for AI-Native Online University

These rules apply to every automated agent — Claude Code, CI bots, or future
copilots — making changes to this repository. They are derived from
`project-run.docx` § 19 and the product brief.

## Product principle

This is an **AI-Native Online University**, not a simple LMS. AI is the
learning infrastructure, cognitive support layer, decision-support engine, and
adaptive learning coordinator. Treat AI features as load-bearing, not as
add-ons.

## Workflow boundaries

- Read `AGENT_RUNBOOK.md` first, every session.
- Runtime, Docker, tests, logs, and deployment **always** go through
  `scripts/remote.ps1` on the Ubuntu VPS. Never run production Docker on
  Windows. Never use Remote-SSH for agent execution on the VPS.
- When you change code: commit and push, then run the relevant remote action,
  then inspect logs, then fix.

## Language

- Persian-first UX with RTL by default.
- English technical naming in code is allowed and expected.
- All UI labels must support i18n (no hardcoded user-facing strings outside the
  translation layer).

## Architecture

- Modular monorepo layout once the rebuild starts (`apps/`, `packages/`,
  `infra/`, `docs/`).
- Keep domain logic in backend services. Never put business logic only in the
  frontend.
- All AI traffic flows through the **AI Gateway** service. Heavy AI is
  **external API only** while the current VPS has no GPU.
- No local GPU dependency anywhere in the runtime path.

## Security

- Never hardcode secrets. `.env.example` is the contract; real `.env` files
  stay out of git.
- Enforce multi-tenant isolation in every query.
- Enforce RBAC at the API layer. Never trust frontend role checks alone.
- Log sensitive actions with actor, tenant, resource, and outcome.
- AI output must be auditable (request, response, model, confidence, latency).

## AI governance

Every AI response must carry:

- `source` / context references when available (RAG citations)
- `confidence` score
- `model` / `provider` identifier
- `humanReviewRequired` boolean

Automated systems must **not** make final grading or disciplinary decisions.
They surface recommendations; humans decide.

## Documentation

Every new module must update, in the same change:

- `README.md` if setup changes
- `docs/architecture/` if architecture changes
- `docs/api/` (OpenAPI) if API surface changes
- `docs/data/DATA_DICTIONARY.md` if schema changes
- `docs/TESTING.md` if test strategy changes

## Testing

- Unit tests for services.
- Integration tests for APIs.
- E2E tests for critical user flows (enrollment, class join, AI tutor, grading).
- Tests run on the VPS via `.\scripts\remote.ps1 test`, never directly on
  Windows.

## Implementation order

Do not try to build everything at once. The expected sequence:

| Phase | Output                                                   |
| ----- | -------------------------------------------------------- |
| 1     | repo + Docker + README + docs                            |
| 2     | auth + tenant + roles                                    |
| 3     | university / course / enrollment                         |
| 4     | frontend dashboards                                      |
| 5     | AI Gateway (mock + external API)                         |
| 6     | class session + recording metadata                       |
| 7     | assessment basics                                        |
| 8     | learning events + dashboards                             |
| 9     | RAG-ready tutor                                          |
| 10    | docs + tests + security review                           |

If a request would skip phases, surface that and propose a smaller increment.
