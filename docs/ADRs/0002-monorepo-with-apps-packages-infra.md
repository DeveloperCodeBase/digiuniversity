# ADR 0002: Monorepo with `apps/`, `packages/`, `infra/`

Date: 2026-05-20

## Status

Accepted.

## Context

The platform needs at minimum:

- a Persian/RTL web frontend (today: Vite + React; future: Next.js per §4 of project-run.docx),
- a backend API (NestJS),
- an AI Gateway (FastAPI),
- a worker for async jobs (BullMQ, Phase 5+),
- shared types between frontend and backend,
- shared UI primitives,
- a single deployment artefact path.

We considered three layouts:

1. **One repo per service.** Maximum isolation, painful for shared
   types and cross-cutting changes; doesn't match a small team.
2. **Monorepo with a flat layout.** All services as siblings at the
   repo root. Works but mixes service code with infra and docs.
3. **Monorepo with `apps/`, `packages/`, `infra/`, `docs/`.** Apps are
   deployable units; packages are libraries consumed by apps; infra is
   the operational glue (Dockerfiles, Caddy snippets, scripts); docs is
   the human entry point.

## Decision

We adopt layout (3).

- `apps/web` — Persian/RTL frontend (Vite today; Next.js migration is a future phase).
- `apps/api` — NestJS core backend.
- `apps/ai-gateway` — FastAPI AI Gateway.
- `apps/worker` — BullMQ worker (future).
- `packages/types` — shared TypeScript types (future).
- `packages/ui` — shared UI primitives (future).
- `packages/sdk` — generated API client (future).
- `infra/` — Caddyfile snippets, deployment helpers, ops glue.
- `docs/` — product brief, architecture, ADRs, deployment.

In Phase 1, only `apps/api` and `apps/ai-gateway` have been added.
The Vite frontend stays at the repo root for one more phase to avoid
breaking the running deployment; ADR 000X will record the relocation.

## Consequences

- One `docker-compose.yml` at the repo root composes every service.
- One `package-lock.json` / one `requirements.txt` per app (no shared
  install at the repo root yet — pnpm workspace will land with the
  Next.js migration).
- Build context for each container is the app's own folder; that keeps
  images small and decoupled.
- New apps need a Dockerfile + a compose entry + (if HTTP-exposed) a
  reverse-proxy rule in `infra/Caddyfile.snippet`.
