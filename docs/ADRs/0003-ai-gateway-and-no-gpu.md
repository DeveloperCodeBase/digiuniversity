# ADR 0003: All AI traffic through the gateway; no local GPU

Date: 2026-05-20

## Status

Accepted.

## Context

The current VPS has no GPU. Implementing local heavy ML (ASR, embeddings,
risk models, diarization, video analysis) is out of scope until a
dedicated GPU server is provisioned. At the same time, the product brief
treats AI as load-bearing infrastructure, not an add-on, so the platform
must already be wired to assume those features exist — just not yet
hosted here.

## Decision

1. Every AI call in the platform goes through the `ai-gateway` service.
   No app code talks directly to an AI provider SDK.
2. `ai-gateway` has two modes selected by `AI_MODE`:
   - `mock` (default): deterministic Persian stubs, no network. Used in
     local dev, CI, and demos.
   - `external_api`: forwards to `AI_SERVICES_BASE_URL` with the
     configured API key. The remote service must implement the OpenAPI
     contract published at `/openapi.json`.
3. Every response from `ai-gateway` is wrapped in an envelope carrying
   `model`, `provider`, `mode`, `confidence`, `human_review_required`,
   and `request_id`. The core API persists `request_id` in
   `AiInteractionLog` (Phase 2).
4. Endpoints whose output drives high-stakes decisions
   (`learning-risk/predict`, grading drafts) always carry
   `human_review_required=true`.

## Consequences

- Switching to a future GPU server is a config change, not a refactor.
- The gateway is a clear chokepoint for caching, rate limiting,
  observability, and policy.
- The mock provider must stay realistic enough that frontend and
  backend can be developed end-to-end without secrets. We accept the
  maintenance cost of keeping it in sync with the contract.
- Two languages in the repo (TypeScript for api + web, Python for the
  gateway). We accept that cost because Python has the better library
  story for AI providers.
