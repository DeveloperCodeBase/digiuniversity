# AI Gateway

The AI Gateway (`apps/ai-gateway`, FastAPI + Pydantic v2) is the single
seam between the rest of the platform and any AI model. Nothing else in
the stack should talk directly to a model provider.

## Why a gateway

1. **No GPU on this VPS.** Heavy AI must run on an external server.
   Centralizing the adapter means switching providers — or moving from
   external API to a future in-house GPU server — is a config change
   (`AI_MODE` + `AI_SERVICES_BASE_URL`), not a code change.
2. **Governance.** Every AI response must carry provenance and a
   `human_review_required` flag (see `AGENTS.md`). Enforcing that in one
   place is the only sane option.
3. **Caching, rate limiting, observability.** All future cross-cutting
   policy lives here.

## Modes

`AI_MODE=mock` (default during Phase 1):
- No network. Deterministic, plausible Persian responses from `mock_provider.py`.
- Enables local development, CI, and demo flows without secrets.

`AI_MODE=external_api`:
- Forwards every request to `${AI_SERVICES_BASE_URL}${path}` with
  `Authorization: Bearer ${AI_SERVICES_API_KEY}`.
- The remote service must implement the contract below.

## Response envelope

Every endpoint (except `/v1/health`) returns this shape:

```json
{
  "request_id": "req_a1b2c3d4e5f6g7h8",
  "model": "mock-fa-1",
  "provider": "internal-mock",
  "mode": "mock",
  "confidence": 0.81,
  "human_review_required": true,
  "payload": { ... endpoint-specific ... }
}
```

- `confidence` is in `[0.0, 1.0]`.
- `human_review_required` is `true` when `confidence < 0.85` OR when the
  endpoint always demands review (`learning-risk/predict` for example).
- `request_id` is unique per call and is the join key to
  `AiInteractionLog` in the core API (Phase 2).

## Endpoint catalogue

| Method | Path                                              | Purpose                                  |
| ------ | ------------------------------------------------- | ---------------------------------------- |
| GET    | `/v1/health`                                      | Health + mode + version                  |
| POST   | `/v1/rag/query`                                   | RAG-backed answer with citations         |
| POST   | `/v1/class-sessions/{id}/summarize`               | Class session summary                    |
| POST   | `/v1/class-sessions/{id}/extract-concepts`        | Key concepts and difficulty              |
| POST   | `/v1/class-sessions/{id}/generate-quiz`           | Quiz items from a class                  |
| POST   | `/v1/class-sessions/{id}/analyze`                 | Composite: summary + concepts + quiz     |
| POST   | `/v1/learner-profile/update`                      | Apply events to a learner cognitive profile |
| POST   | `/v1/learning-risk/predict`                       | Risk score + explanations (review required) |
| POST   | `/v1/embeddings/batch`                            | Batch text → vector                      |
| POST   | `/v1/asr/jobs`                                    | Submit ASR job for media                 |
| GET    | `/v1/asr/jobs/{job_id}`                           | Poll ASR job status                      |

Live interactive docs are served at `/docs` (Swagger) and `/redoc`. The
OpenAPI JSON is at `/openapi.json` and is the contract the future GPU
server must satisfy.

## Reaching it

Through the host Caddy:

```
https://digiuniversity.ir/ai/v1/health
https://digiuniversity.ir/ai/v1/rag/query
```

The `/ai` prefix is stripped by Caddy before the request reaches the
service — internally the routes remain `/v1/...`.

From other services on the docker network:

```
http://ai-gateway:8000/v1/health
```

## Required env

| Variable                   | Required when                | Default                              |
| -------------------------- | ---------------------------- | ------------------------------------ |
| `AI_MODE`                  | always                       | `mock`                               |
| `AI_SERVICES_BASE_URL`     | `AI_MODE=external_api`       | `https://future-gpu-server.example.com` |
| `AI_SERVICES_API_KEY`      | `AI_MODE=external_api`       | `change-me`                          |
| `AI_TIMEOUT_SECONDS`       | optional                     | `120`                                |

See `.env.example` at the repo root for the full set.
