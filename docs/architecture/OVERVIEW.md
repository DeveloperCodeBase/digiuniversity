# Architecture Overview

This document captures the high-level system shape. Detailed contracts live
under `docs/architecture/*` and `docs/api/`.

## Runtime topology

```
        ┌─────────────┐
client ─► CDN ──► VPS:443 ─► host Caddy ──┬─►  digiuniversity-app   (nginx + SPA)
                                          ├─►  api                  (NestJS, /api → :4000)
                                          └─►  ai-gateway           (FastAPI, /ai  → :8000)
```

- TLS terminates on the host Caddy. All app traffic between Caddy and the
  three services is plain HTTP on the `digiuniversity_web` docker network.
- The host Caddy is the single ingress for `digiuniversity.ir` and
  `www.digiuniversity.ir`; subdomain-per-service is intentionally avoided
  in Phase 1 to keep CDN/DNS work to one record.

## Apps

| App                        | Stack                          | Port (internal) | Role                                          |
| -------------------------- | ------------------------------ | --------------- | --------------------------------------------- |
| `apps/web` *(at repo root today)* | Vite + React + Tailwind  | 80              | Persian/RTL SPA, PWA                          |
| `apps/api`                 | NestJS 10 + TypeScript         | 4000            | Core university domain, RBAC, multi-tenancy    |
| `apps/ai-gateway`          | FastAPI + Pydantic v2          | 8000            | Single adapter for all AI providers           |

The Vite frontend currently lives at the repo root; moving it to
`apps/web/` is tracked as a follow-up and will not change the public URL.

## Cross-cutting

- **No GPU dependency in runtime.** Heavy ML is delegated to an external
  provider via `AI_SERVICES_BASE_URL` (`AI_MODE=external_api`). Until that
  provider exists, `AI_MODE=mock` returns deterministic stubs so the rest
  of the platform can run locally.
- **Multi-tenant isolation** is enforced at every API layer. Tenant id
  is part of every entity and every query (Phase 2).
- **AI output governance.** Every response from `ai-gateway` is wrapped in
  an envelope (`model`, `provider`, `mode`, `confidence`,
  `human_review_required`). The API persists this in `AiInteractionLog`
  (Phase 2). Risk predictions always carry `human_review_required=true`.

## Future scale

The repo is monorepo-ready (apps/, packages/, infra/, docs/) so the
following can land without disrupting today's deployment:

- `packages/types` — shared TypeScript types between `apps/web` and `apps/api`
- `packages/sdk` — generated API client (from `apps/api` OpenAPI)
- `packages/ui` — shared UI primitives
- `apps/worker` — BullMQ worker for async jobs (transcription pipeline,
  AI batches)

## Where to read next

- `docs/architecture/AI_GATEWAY.md` — endpoint contracts and envelope shape
- `docs/DEPLOYMENT_UBUNTU.md` — VPS prep, runbook actions, domain wiring
- `docs/product/PRODUCT_BRIEF.md` — what we're building and why
- `AGENTS.md` — engineering rules every agent contributing to this repo follows
- `docs/ADRs/` — architecture decision records
