# AI governance

How we make AI use auditable and accountable. Implements the rules in
`AGENTS.md` and the constraints in `docs/product/PRODUCT_BRIEF.md`.

## Single seam

All AI traffic flows through `apps/ai-gateway`. No other service —
not the api, not the SPA — talks to a model provider directly. The
`AiBridgeService` in `apps/api/src/ai-bridge/` is the only piece of
the api that knows how to call the gateway.

This means there is exactly one place to:

- audit (every call writes `AiInteractionLog`),
- rate-limit (Phase 10.5),
- swap providers (`AI_MODE=mock` ↔ `AI_MODE=external_api`),
- enforce the response envelope contract below.

ADR 0003 records the decision in full; ADR 0001 records the no-GPU
rule that motivated it.

## Response envelope

Every endpoint on `ai-gateway` returns this shape (`AiResponseEnvelope`
in `apps/ai-gateway/app/schemas.py`):

```json
{
  "request_id": "req_2457c3fe9c214ce7",
  "model": "mock-fa-1",
  "provider": "internal-mock",
  "mode": "mock",
  "confidence": 0.74,
  "human_review_required": true,
  "payload": { ... }
}
```

| Field                  | Required | Meaning                                            |
| ---------------------- | -------- | -------------------------------------------------- |
| `request_id`           | yes      | join key into `AiInteractionLog.requestId`         |
| `model`                | yes      | identifier of the model that produced this        |
| `provider`             | yes      | who ran the model (mock / openai / anthropic / …) |
| `mode`                 | yes      | `mock` or `external_api` — current runtime mode   |
| `confidence`           | yes      | float `0..1`                                       |
| `human_review_required`| yes      | boolean — see below                                |
| `payload`              | yes      | endpoint-specific result                           |

### `human_review_required` policy

`true` whenever **any** of the following hold:

- `confidence < 0.85`
- The endpoint is high-stakes by category. Endpoints we mark
  always-review:
    - `/v1/learning-risk/predict`
    - `/v1/assessment/grade-draft`
- The endpoint feeds a UI surface that displays final-feeling output
  (course summary, learner profile delta).

The gateway sets it via the `_envelope(..., force_review=True)` knob
where appropriate. The api never *clears* it — it can only be
flipped on, never off, by downstream consumers.

## Audit log (`AiInteractionLog`, Phase 2 schema)

One row per call, written by `AiBridgeService.post()`:

| Column                | Source                                  |
| --------------------- | --------------------------------------- |
| `requestId`           | envelope `request_id`                   |
| `endpoint`            | gateway path (e.g. `/v1/rag/query`)     |
| `model` / `provider` / `mode` | envelope                          |
| `confidence`          | envelope                                |
| `humanReviewRequired` | envelope                                |
| `request`             | the JSON body the api forwarded         |
| `response`            | the full envelope (for replay)          |
| `latencyMs`           | measured by the bridge                  |
| `tenantId` / `userId` | from the JWT principal of the caller    |

Failure modes:

- Gateway returns 5xx → the call throws; **no audit row** is written
  (we don't fabricate one). The originating user-facing request also
  fails.
- Audit write itself fails → logged at `error`, but the user-facing
  call still succeeds. We pick availability over completeness for the
  audit, on purpose.

## Where AI products surface

| Endpoint on api                                                          | Gateway endpoint                       | Audit row | Persisted besides AiInteractionLog                  |
| ------------------------------------------------------------------------ | -------------------------------------- | --------- | --------------------------------------------------- |
| `POST /v1/class-sessions/:id/analyze`                                    | `/v1/class-sessions/:id/analyze`       | yes       | —                                                    |
| `POST /v1/submissions/:id/ai-grade-draft`                                | `/v1/assessment/grade-draft`           | yes       | `Submission.aiGradeDraft` snapshot                   |
| `POST /v1/tutor/sessions/:id/ask`                                        | `/v1/rag/query`                        | yes       | `TutorMessage` (assistant turn) carries the metadata |

The `TutorMessage` + `Submission.aiGradeDraft` snapshots are there so
the SPA can render confidence + `humanReviewRequired` without an extra
audit-log fetch — they are NOT a substitute for the audit log.

## What we never do

- We never auto-make a final decision about a learner. Risk scores,
  grade drafts, AI tutor answers, learner-profile updates are
  surfaced for human review, never as commitments.
- We never put PII in the *prompt* of an external provider call when
  it can be redacted at the api layer. Today the redaction surface
  is minimal because the gateway is in `mock` mode. Production
  cut-over will add an outbound redactor (Phase 10.5).
- We never send secrets through the gateway. Tokens, signing keys,
  and DB URLs stay on the api side.

## Rule-based vs ML — Phase 8 risk score

The student-risk endpoint (`/v1/analytics/risk/me`) returns a
**rule-based** score with explainable factors. The ML alternative
behind `ai-gateway` `/v1/learning-risk/predict` is documented and
available, but is **not** silently mixed in. ADR 0008 records that
decision; the ML sibling endpoint lands when there is a real model
to back it.

## What an auditor can ask, and how to answer

> "What did this student see when they used the AI tutor on
> 2026-05-20?"

```sql
SELECT m.role, m.content, m.aiRequestId, m.confidence, m.humanReviewRequired
FROM "TutorMessage" m
JOIN "TutorSession" s ON s.id = m."sessionId"
WHERE s."userId" = $1 AND m."createdAt" >= '2026-05-20'
ORDER BY m."createdAt";
```

> "Show me the full request + response for `req_2457c3fe9c214ce7`."

```sql
SELECT * FROM "AiInteractionLog" WHERE "requestId" = 'req_2457c3fe9c214ce7';
```

> "How many AI calls did this tenant make this week, by endpoint?"

```sql
SELECT endpoint, COUNT(*) FROM "AiInteractionLog"
WHERE "tenantId" = $1 AND "createdAt" >= now() - interval '7 days'
GROUP BY endpoint ORDER BY COUNT(*) DESC;
```

`/v1/analytics/tenant` returns a smaller, public-facing version of
that query.
