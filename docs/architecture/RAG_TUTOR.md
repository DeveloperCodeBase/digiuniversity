# RAG-ready tutor

Phase 9 of the platform (project-run.docx §13). Persistent chat
conversations against the `ai-gateway` `/v1/rag/query` endpoint, plus
a Document corpus the future GPU server will index.

## Data model

```
Course ──< Document ──< DocumentChunk
            (RAG corpus; vectors live in `embedding` JSON for now)

User ──< TutorSession ──< TutorMessage
                          (role: user | assistant | system)
```

| Table          | Purpose                                                       |
| -------------- | ------------------------------------------------------------- |
| `Document`     | reference material (lesson text, PDFs as text, external doc). |
|                | Tenant-scoped, course-linked, soft-deletable.                  |
| `DocumentChunk`| overlapping slices of `content` (1200 chars / 200 overlap).   |
|                | `embedding` is JSON today; future migration switches to       |
|                | pgvector with no data loss.                                    |
| `TutorSession` | one chat thread, optionally scoped to a course.               |
| `TutorMessage` | one turn. Assistant turns carry `aiRequestId` (joins to       |
|                | `AiInteractionLog`), `confidence`, `humanReviewRequired`,     |
|                | and the `citations` JSON the AI gateway returned.              |

Every row is tenant-scoped, audited, and (where it makes sense)
soft-deletable per ADR 0005.

## HTTP surfaces

All under `/api/v1`. Auth required.

### Tutor

| Verb   | Path                              | Who               | Notes                                                |
| ------ | --------------------------------- | ----------------- | ---------------------------------------------------- |
| POST   | `/tutor/sessions`                 | any auth          | new chat thread; optional `courseId` scopes it       |
| GET    | `/tutor/sessions`                 | any auth          | own threads, newest first                            |
| GET    | `/tutor/sessions/:id`             | owner OR admin    | full message history                                 |
| POST   | `/tutor/sessions/:id/ask`         | owner OR admin    | persists user turn → calls ai-gateway → persists     |
|        |                                   |                   | assistant turn → emits `ai_tutor_asked` learning     |
|        |                                   |                   | event. Returns the AI envelope verbatim.             |
| DELETE | `/tutor/sessions/:id`             | owner OR admin    | soft delete                                          |

### Documents (RAG corpus)

| Verb   | Path                       | Who                | Notes                                                |
| ------ | -------------------------- | ------------------ | ---------------------------------------------------- |
| GET    | `/documents`               | any auth           | filter by `courseId`                                 |
| GET    | `/documents/:id`           | any auth           | includes chunks                                      |
| POST   | `/documents`               | admin / instructor | server slices `content` into overlapping chunks      |
| PATCH  | `/documents/:id`           | admin / instructor | content change re-chunks the document                |
| DELETE | `/documents/:id`           | admin              | soft delete                                          |

## How `ask` works end-to-end

1. SPA `POST /tutor/sessions/:id/ask` with the question text.
2. Service inserts the **user turn** first (so a downstream failure
   doesn't lose the question).
3. Service calls `AiBridgeService.post("/v1/rag/query", …)` — the
   bridge persists the full envelope to `AiInteractionLog` with
   `latencyMs`, `model`, `provider`, `mode`, `confidence`,
   `humanReviewRequired`, and the request/response JSON.
4. Service inserts the **assistant turn**, copying `aiRequestId`,
   `confidence`, `humanReviewRequired`, and `citations[]` onto the row
   so the SPA can render them without re-fetching the audit log.
5. Service updates `TutorSession.lastMessageAt` so the sidebar sorts
   right.
6. Service emits a `ai_tutor_asked` `LearningEvent` (Phase 8) carrying
   `sessionId`, `questionLength`, `confidence`, and
   `humanReviewRequired`. The Phase 8 analytics dashboard picks it up
   immediately.

Failure modes:

- AI gateway unreachable → the bridge throws; the assistant turn is
  not written; the user turn stays so the next retry shows the
  question.
- AI gateway returns 5xx → same as above.
- Audit log write failures are swallowed by `LearningEventsService`
  (logged, not raised) so user-facing requests never fail because of
  observability.

## Citations + governance

Every assistant turn carries:

- `confidence` (0..1) — copied from the gateway envelope.
- `humanReviewRequired` — copied from the envelope (`true` when
  confidence < 0.85; the gateway is in mock mode in Phase 9, so this
  is essentially always true today).
- `aiRequestId` — the same `req_…` string in `AiInteractionLog.requestId`.
  Admin can pull the full request/response by joining on it.

The SPA chat surface renders all three under each assistant bubble per
AGENTS.md ("Every AI response must include source/context, confidence,
model/provider, humanReviewRequired"). The "نیاز به بازبینی انسانی"
warning is the literal in-Persian rendering of that flag.

## Future vector indexing

When the GPU server lands:

1. Add a `pgvector` column to `DocumentChunk.embedding_vec`.
2. Run a backfill that embeds existing chunks and writes vectors.
3. Add `/v1/embeddings/batch` calls on chunk insert/update (the
   gateway endpoint exists since Phase 1).
4. The gateway's `/v1/rag/query` switches from returning canned
   citations to doing a real `pgvector <->` cosine search.
5. Nothing on the api or SPA changes.

The Phase 9 schema makes that migration purely additive.
