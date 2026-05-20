# Live class + recordings

Phase 6 of the platform (project-run.docx §13). It owns three database
tables, one provider abstraction, and four HTTP surfaces. Everything in
this layer is multi-tenant + audited + soft-deleted just like the rest
of `apps/api`.

## Data model

```
Course ──< ClassSession ──< Attendance
                       └──── Recording   (1 : 0..1)
```

| Table          | Purpose                                                       |
| -------------- | ------------------------------------------------------------- |
| `ClassSession` | one scheduled meeting of a course; carries scheduling,        |
|                | status, join policy, provider key + meeting id + join URL     |
| `Recording`    | metadata for the captured media; status ∈ none / processing / |
|                | ready / failed; mediaUrl + transcriptUrl are storage URIs     |
| `Attendance`   | one row per join event; closed by `leftAt` on leave           |

Every row carries `tenantId`, `createdAt`, `updatedAt`, `deletedAt` (and
where appropriate `createdBy` / `updatedBy`) — see ADR 0005.

## Provider abstraction (ADR 0006)

`apps/api/src/live-class/live-class.provider.ts` declares
`LiveClassProvider`. Today only `MockLiveClassProvider` is wired up,
behind the DI token `LIVE_CLASS_PROVIDER`. When LiveKit (or BBB) lands,
the only change is one line in `LiveClassModule`:

```ts
{ provide: LIVE_CLASS_PROVIDER, useClass: LiveKitProvider }
```

The provider is the only thing in this codebase that ever calls a real
video/SFU service. Controllers know nothing about it.

## HTTP surfaces

All under `/api/v1`. Auth required (Phase 2 JWT + RBAC).

| Verb   | Path                                            | Who                   | Notes                                              |
| ------ | ----------------------------------------------- | --------------------- | -------------------------------------------------- |
| GET    | `/class-sessions`                               | any auth              | filter by `courseId`, `status`                     |
| GET    | `/class-sessions/:id`                           | any auth              | with course, host, recording, attendance count     |
| POST   | `/class-sessions`                               | admin / instructor    | creates the row + asks the provider for a meeting  |
| PATCH  | `/class-sessions/:id`                           | admin / instructor    | edit schedule, status (auto-stamps actualStart/End)|
| DELETE | `/class-sessions/:id`                           | admin                 | soft delete + flips status to `cancelled`          |
| POST   | `/class-sessions/:id/join`                      | any auth              | enforces join policy, stamps Attendance, returns   |
|        |                                                 |                       | the provider join URL                              |
| POST   | `/class-sessions/:id/leave`                     | any auth              | closes the open Attendance row                     |
| GET    | `/class-sessions/:id/attendance`                | admin / instructor    | staff-only roster                                  |
| POST   | `/class-sessions/:id/analyze`                   | admin / instructor    | calls ai-gateway and persists the envelope to      |
|        |                                                 |                       | AiInteractionLog (see ADR 0003 + AGENTS.md)        |
| GET    | `/recordings`                                   | any auth              | filter by `classSessionId`, `status`               |
| GET    | `/recordings/:id`                               | any auth              |                                                    |
| POST   | `/recordings`                                   | admin / instructor    | upsert by `classSessionId`                         |
| PATCH  | `/recordings/:id`                               | admin / instructor    |                                                    |
| DELETE | `/recordings/:id`                               | admin                 | soft delete                                        |

### Join policy

`ClassSession.joinPolicy` is one of:

- `enrolled` (default) — must hold an active `Enrollment` in the course
- `public` — any authenticated user in the tenant
- `invite` — same as enrolled until Phase 6.5 ships invitations

Staff (admin / instructor) bypass policy.

### AI analyze contract

`POST /v1/class-sessions/:id/analyze` body:

```json
{ "task": "analyze" | "summarize" | "extract-concepts" | "generate-quiz",
  "language": "fa" }
```

The api forwards to `ai-gateway` at the matching path (e.g.
`/v1/class-sessions/:id/summarize`) and **always** persists the response
envelope to `AiInteractionLog` before returning. The SPA never talks to
ai-gateway directly — that's the bridge's job.

## Mock provider behaviour

- `createMeeting()` → returns a deterministic `mock_<sha256(...)[:12]>`
  id + a `https://digiuniversity.ir/#classroom/<id>` deep link.
- `getJoinUrl()` → adds `?u=<userId>` so test runs are individually
  identifiable.
- `endMeeting()` → no-op.

The deep link lands on the existing mock `#classroom` route (the
`Classroom.jsx` page from the original SPA), which works without any
real WebRTC infrastructure — perfect for demo flows.

## Future providers

LiveKit and BigBlueButton are the planned implementations.

**LiveKit** (preferred — modern SFU):
- `createMeeting()` → POST to LiveKit Cloud or self-hosted API.
- `getJoinUrl()` → mint a participant JWT signed with `LIVEKIT_API_SECRET`.
- We'd add `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` to
  `.env.example` (already present, currently empty).

**BigBlueButton** (alt — open source, classroom-oriented):
- Uses checksummed query params instead of JWT.
- Same interface; different implementation file.

Either lands as a new file under `apps/api/src/live-class/` and a one-line
swap in `LiveClassModule`.
