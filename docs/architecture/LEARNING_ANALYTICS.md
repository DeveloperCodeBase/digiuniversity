# Learning analytics

Phase 8 of the platform (project-run.docx §14). One event table, three
sets of aggregations, one explainable risk score.

## Data model

```
LearningEvent (tenantId, userId?, type, course/lesson/assessment/classSession ids?, data?, occurredAt)
```

The table is intentionally narrow + indexed-heavy: there are far more
read patterns ("how many `quiz_submitted` this week?") than write
patterns, and Postgres handles wide indexes far better than wide rows.

Events flow in via two paths:

1. **Service-emitted (`SYSTEM_EVENTS`)** — `class_joined`, `class_left`,
   `quiz_submitted`, `assignment_submitted`, `submission_graded`,
   `quiz_started` (when implemented). Each is fire-and-forget from the
   relevant service via `LearningEventsService.emit()` — failures are
   logged, never raised.
2. **Client-emitted (`CLIENT_EVENTS`)** — `course_opened`,
   `lesson_opened`, `lesson_completed`, `video_played`, `video_paused`,
   `ai_tutor_asked`, `ai_summary_viewed`, `confusion_reported`. The SPA
   posts these to `POST /v1/learning-events`. The controller's DTO
   restricts the type field to `CLIENT_EVENTS` so a forged
   `quiz_submitted` from the browser is rejected.

## HTTP surfaces (all under `/api/v1`)

| Verb | Path                              | Who                | Notes                                |
| ---- | --------------------------------- | ------------------ | ------------------------------------ |
| POST | `/learning-events`                | any auth           | client allow-list only               |
| GET  | `/learning-events/me`             | any auth           | own events                           |
| GET  | `/learning-events`                | admin / instructor | filter by type / course / userId     |
| GET  | `/analytics/student/me`           | any auth           | "my numbers" roll-up                 |
| GET  | `/analytics/student/:userId`      | admin / instructor | same shape, any user in tenant       |
| GET  | `/analytics/course/:courseId`     | admin / instructor | per-course aggregates                |
| GET  | `/analytics/tenant`               | admin              | tenant-wide aggregates               |
| GET  | `/analytics/risk/me`              | any auth           | explainable rule-based risk          |
| GET  | `/analytics/risk/:userId`         | admin / instructor | same shape, any user in tenant       |

## What we compute

### Student summary

- Enrollments grouped by status (active / completed / withdrawn)
- Submissions grouped by status; average grade across graded ones
- Attendance count (Phase 6 `Attendance` rows)
- AI interactions (`AiInteractionLog` rows for the user)
- Last 10 `LearningEvent` rows

### Course summary

- Enrollment counts by status
- Class session count + total attendance records
- Submission counts by status + average grade
- Last 20 events on this course

### Tenant summary

- Active user count
- Course / class-session / submission counts
- Tenant-wide average grade
- Total AI interactions
- Event type histogram

### Risk score

See `docs/ADRs/0008-explainable-rule-based-risk.md`. Returns:

```jsonc
{
  "score": 0.42,
  "band": "medium",   // low (<0.3) | medium (<0.6) | high
  "source": "rule-based-v1",
  "humanReviewRequired": true,
  "factors": [
    { "key": "low_grade_average", "label": "...", "contribution": 0.4,
      "detail": "..." }
  ]
}
```

Every contribution is explained in Persian for the SPA to render
without translation. `humanReviewRequired` is **always** `true` — the
score never auto-decides anything about a learner.

## Where this connects

- The Vite SPA's `#progress` route renders the student summary + risk
  panel + recent events list. Admin users also see the tenant block.
- The Phase 6 `class-sessions.service` emits `class_joined` /
  `class_left` when attendance rows are stamped.
- The Phase 7 `submissions.service` emits `quiz_submitted` /
  `assignment_submitted` on finalise, and `submission_graded` on the
  staff grading PATCH.
- A future ML risk endpoint already lives at `ai-gateway`
  `/v1/learning-risk/predict` — Phase 9 will route the SPA's "request
  ML draft" button through the AI bridge to that endpoint, with the
  rule-based score remaining the default.
