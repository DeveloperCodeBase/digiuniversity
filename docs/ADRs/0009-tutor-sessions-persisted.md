# ADR 0009: Tutor sessions are persisted, not stateless

Date: 2026-05-20

## Status

Accepted.

## Context

Phase 9 puts an AI tutor on the platform. Two storage shapes are
common:

1. **Stateless** — the SPA holds the conversation in memory, sends the
   full transcript with every request. The server is dumb to history.
2. **Persisted** — every turn becomes a `TutorMessage` row scoped to a
   `TutorSession`. The server is the source of truth.

Stateless is simpler, but our product context forces (2):

- `AGENTS.md` requires every AI response to be auditable. A stateless
  client can lose or rewrite history, and we'd have nothing to compare.
- `LearningEvent` (Phase 8) needs to attribute usage to a specific
  conversation so the analytics dashboard can say
  "this learner had 12 tutor exchanges across 3 sessions".
- A future "resume my session on another device" expectation falls out
  for free.
- A regulatory audit ("what did this student ask, and what did the AI
  say, last March?") is a row lookup, not a forensics exercise.

## Decision

Tutor conversations are persisted. The model:

- `TutorSession` — long-lived thread, optionally scoped to a course.
  Carries `title` (auto-generated, future Phase 9.5 will derive it
  from the first user turn) and `lastMessageAt` for sidebar sorting.
- `TutorMessage` — one row per turn. Role ∈ {`user`, `assistant`,
  `system`}.

Assistant turns carry the **full governance metadata** alongside the
text:

- `aiRequestId` joins back to `AiInteractionLog`,
- `confidence` and `humanReviewRequired` are copied so the UI can
  render them without an extra fetch,
- `citations` is a JSON snapshot of the gateway's returned references.

The SPA does **not** send a conversation transcript with each ask; the
gateway is responsible for any context-building it wants to do
internally. We may revisit this in Phase 9.5 if we observe degraded
answer quality from missing context.

## What we deliberately don't do

- No turn-by-turn editing or "regenerate" yet. Phase 9.5 territory.
- No automatic title summarisation yet. Sessions show their default
  title until the user renames them.
- The `system` role is reserved but not emitted today; future prompt
  templating will use it.

## Consequences

- One DB row per turn — the storage cost grows linearly with usage.
  This is acceptable: tutor exchanges are short and `TutorMessage` is
  not in any hot path (indexed by `sessionId` + `createdAt`).
- A user can scroll back through past conversations and citations
  remain reproducible.
- The Phase 8 dashboards can finally show "AI tutor usage over time"
  as a real number, not a mock.
