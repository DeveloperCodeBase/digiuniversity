# Assessments + submissions

Phase 7 of the platform (project-run.docx §11). Adds the graded-work
loop on top of the Phase 3 university domain.

## Data model

```
Course ──< Assessment ──< Question
                     └──< Submission >── User
```

| Table        | Purpose                                                        |
| ------------ | -------------------------------------------------------------- |
| `Assessment` | a quiz OR an assignment (one table; see ADR 0007). Carries     |
|              | `kind`, `status`, `totalPoints` (denormalised), `dueAt`,       |
|              | `allowLate`, lifecycle timestamps.                             |
| `Question`   | only used for `kind=quiz`. `kind` ∈ {multiple_choice,          |
|              | short_answer, essay}; `options` + `correctAnswer` are JSON     |
|              | so the same row covers all three shapes.                       |
| `Submission` | one row per (assessment, user). `answers` is JSON;             |
|              | `autoScore`, `grade`, `gradedBy`, `feedback`, `aiGradeDraft`   |
|              | live alongside it.                                             |

All four are tenant-scoped, audited, and soft-deletable (ADR 0005).

## HTTP surfaces

All under `/api/v1`. Auth required.

### Assessments

| Verb   | Path                              | Who                  |
| ------ | --------------------------------- | -------------------- |
| GET    | `/assessments`                    | any auth             |
| GET    | `/assessments/:id`                | any auth (students   |
|        |                                   | get questions with   |
|        |                                   | `correctAnswer:null`)|
| POST   | `/assessments`                    | admin / instructor   |
| PATCH  | `/assessments/:id`                | admin / instructor   |
| DELETE | `/assessments/:id`                | admin                |
| POST   | `/assessments/:id/questions`      | admin / instructor   |

Drafts are not visible to students until `status=published`.

### Questions

| Verb   | Path                | Who                |
| ------ | ------------------- | ------------------ |
| PATCH  | `/questions/:id`    | admin / instructor |
| DELETE | `/questions/:id`    | admin              |

`totalPoints` on the parent assessment is recomputed automatically
after every question mutation.

### Submissions

| Verb   | Path                                            | Who                     |
| ------ | ----------------------------------------------- | ----------------------- |
| POST   | `/submissions`                                  | any auth (own only)     |
| GET    | `/submissions/me`                               | any auth (own only)     |
| GET    | `/submissions/me/assessment/:assessmentId`      | any auth (own only)     |
| GET    | `/submissions`                                  | admin / instructor      |
| GET    | `/submissions/:id`                              | owner OR staff          |
| PATCH  | `/submissions/:id/grade`                        | admin / instructor      |
| POST   | `/submissions/:id/ai-grade-draft`               | admin / instructor      |

`POST /submissions` is upsert per (assessment, user). The body:

```json
{ "assessmentId": "...",
  "answers": { "<questionId>": { "selectedIndex": 0 } },
  "finalize": false }
```

- `finalize: false` saves a draft; the student can keep editing.
- `finalize: true` locks the submission. For **all-multiple-choice
  quizzes** the row is auto-scored and the grade is set immediately.
  Mixed quizzes (with essay questions) skip the grade until an
  instructor saves one.

## Auto-grading rules

| Question kind     | Auto-graded? | How                                                   |
| ----------------- | ------------ | ----------------------------------------------------- |
| `multiple_choice` | yes          | `selectedIndex` matches `correctAnswer` (or set match for multi-select) |
| `short_answer`    | yes          | case- + whitespace-insensitive equality               |
| `essay`           | no           | instructor grades manually OR uses AI grade-draft     |

`autoScore` carries the raw point total earned by auto-graded items;
`grade` carries the final percentage (0–100). Both are written by the
service, never by the client.

## AI grade-draft

`POST /v1/submissions/:id/ai-grade-draft` (instructor-only) forwards
to `ai-gateway` at `/v1/assessment/grade-draft`, persists the envelope
twice — once on the submission (`aiGradeDraft` field, for quick UI
display) and once in `AiInteractionLog` via `AiBridgeService` — and
returns it.

`humanReviewRequired` is **always** true on this endpoint per
`AGENTS.md` — AI never sets a final grade.

## SPA surfaces

- `#assessment-live/:id` — the student-facing runner: loads the
  assessment with redacted answers, accepts draft saves and finalisation,
  shows the auto-grade inline if the server returned one. Staff see an
  AI-grade-draft panel when the submission is finalised.
- The Live Catalog course page (`#course-live/:id`) shows the
  course's assessments next to its live sessions.
