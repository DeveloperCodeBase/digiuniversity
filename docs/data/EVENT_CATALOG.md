# Learning event catalogue

Source of truth for valid `LearningEvent.type` values. The DB column is
free-form so client code can emit experimental types without a
migration, but the analytics service only aggregates the names below.

`SYSTEM_EVENTS` are emitted by service code at the seam where the
underlying action happens; clients cannot forge them (the controller
DTO restricts `POST /v1/learning-events` to the `CLIENT_EVENTS` set).

## System-emitted

| Type                    | Emitted by                                              | Useful data fields                       |
| ----------------------- | ------------------------------------------------------- | ---------------------------------------- |
| `class_joined`          | `class-sessions.service.join()` after Attendance write  | `attendanceId`                           |
| `class_left`            | `class-sessions.service.leave()` after Attendance close | `attendanceId`                           |
| `quiz_submitted`        | `submissions.service.submit(finalize=true)`             | `autoScore`, `grade`, `status`           |
| `assignment_submitted`  | same path, when `assessment.kind === "assignment"`      | `status`                                 |
| `submission_graded`     | `submissions.service.grade()` (instructor PATCH)        | `grade`, `gradedBy`                      |

## Client-emitted (allow-listed at the controller)

| Type                  | Where the SPA fires it                                 | Notes                                          |
| --------------------- | ------------------------------------------------------ | ---------------------------------------------- |
| `course_opened`       | CourseLive page mount                                  | Useful for retention dashboards                |
| `lesson_opened`       | future: lesson reader                                  |                                                |
| `lesson_completed`    | future: lesson reader                                  |                                                |
| `video_played`        | future: media player integration                       |                                                |
| `video_paused`        | future: media player integration                       |                                                |
| `quiz_started`        | AssessmentLive on first interaction                    | Distinct from system `quiz_submitted`          |
| `ai_tutor_asked`      | future: AI tutor surface                               | `AiInteractionLog` is the source of truth     |
| `ai_summary_viewed`   | CourseLive when an AI summary panel renders            |                                                |
| `confusion_reported`  | future: in-class signal                                |                                                |

## Required fields by event

- `tenantId` — always.
- `userId` — required for client-emitted events (the JWT principal);
  may be null for system events that don't have an actor (none today).
- `occurredAt` — defaults to `now()`. Pass explicitly to backfill.
- One of `courseId` / `lessonId` / `assessmentId` / `classSessionId`
  is **strongly recommended** for the analytics rollups to be useful.

## Adding a new event type

1. Add the string to `apps/api/src/analytics/event-types.ts`
   (`SYSTEM_EVENTS` or `CLIENT_EVENTS`).
2. Document it in this file.
3. If aggregations should pick it up, add the case in
   `analytics.service.ts`.
4. No migration needed — the column is open-ended.
