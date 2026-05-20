# Phase 10 review — closing the docx ten-phase plan

This document walks through every acceptance criterion in
`project-run.docx` against the live system and links to the evidence.

The platform runs at **https://digiuniversity.ir** (Vite SPA + nginx
behind a host Caddy that also terminates TLS for other tenants on
the VPS). Four containers: `app`, `api`, `ai-gateway`, `postgres`.
Swagger lives at `/api/docs` and the live OpenAPI spec at
`/api/docs-json` (56 paths as of Phase 9).

## Phase 1 — repo + Docker + README + docs (§10)

| Acceptance criterion                                              | Status | Evidence                                                              |
| ----------------------------------------------------------------- | ------ | ---------------------------------------------------------------------- |
| `docker compose up --build` starts web + api + ai-gateway         | ✅     | `scripts/remote.ps1 up`; `docker compose ps` shows four Up (healthy)   |
| `/health` works for API                                           | ✅     | `GET /api/v1/health` returns `{status:"ok",checks:{database:"ok"}}`    |
| `/health` works for AI Gateway                                    | ✅     | `GET /ai/v1/health`                                                    |
| Web home page loads in Persian RTL                                | ✅     | `https://digiuniversity.ir/`                                           |
| Swagger / OpenAPI available for API                               | ✅     | `https://digiuniversity.ir/api/docs`                                   |
| README + docs explain setup                                       | ✅     | `README.md`, `docs/DEPLOYMENT_UBUNTU.md`, `docs/architecture/OVERVIEW.md` |
| No secrets are committed                                          | ✅     | `.env.example` only; `.gitignore` blocks `.env`                        |

## Phase 2 — auth + tenant + roles (§11)

| Acceptance criterion                | Status | Evidence                                                             |
| ----------------------------------- | ------ | ---------------------------------------------------------------------- |
| JWT auth with refresh + rotation    | ✅     | `apps/api/src/auth/auth.service.ts`; `test/auth.spec.ts`              |
| Replay of revoked refresh detected  | ✅     | `test/auth.spec.ts` ("refresh rotates and replay is detected")        |
| RBAC with admin / instructor / student | ✅  | `RolesGuard`; `test/rbac.spec.ts`                                     |
| Tenant isolation by tenantId        | ✅     | ADR 0004; every controller filter; tenant slug uniqueness             |
| AI audit log table exists           | ✅     | `AiInteractionLog`; written on every gateway call by `AiBridgeService` |
| Demo admin user seeded              | ✅     | `apps/api/src/prisma/seed.ts`                                          |

## Phase 3 — university domain (§11)

| Entity             | Status | Notes                                          |
| ------------------ | ------ | ---------------------------------------------- |
| Tenant             | ✅     | Phase 2                                        |
| Organization       | →     | folded into Tenant for MVP; lands in Phase 11  |
| User / Role / Permission | ✅ | Phase 2                                       |
| Faculty            | ✅     | `Faculty` table + `/v1/faculties` CRUD          |
| Department         | ✅     | `Department` table + `/v1/departments` CRUD     |
| Program            | ✅     | `Program` + `/v1/programs` CRUD                 |
| Course             | ✅     | `Course` + `/v1/courses`                        |
| CourseModule       | ✅     | `CourseModule` (in `Course.modules`)            |
| Lesson             | ✅     | `Lesson` (in `CourseModule.lessons`)            |
| Cohort             | ✅     | `Cohort` + `/v1/cohorts`                        |
| Enrollment         | ✅     | unique on `(tenantId,userId,courseId)`; role-aware status policy; `test/enrollment.spec.ts` |
| ClassSession       | ✅     | Phase 6                                        |
| Recording          | ✅     | Phase 6                                        |
| Assessment / Question | ✅  | Phase 7                                        |
| Assignment         | ✅     | folded into `Assessment.kind="assignment"`, ADR 0007 |
| Submission         | ✅     | Phase 7                                        |
| Certificate        | →     | future phase                                   |
| LearningEvent      | ✅     | Phase 8                                        |
| AiInteractionLog   | ✅     | Phase 2                                        |
| Audit fields: createdBy / updatedBy / timestamps | ✅ | ADR 0005 |
| Soft delete where appropriate       | ✅     | ADR 0005                                       |
| Prisma migrations                    | ✅    | five migrations under `prisma/migrations/`     |
| Seed script                          | ✅    | `prisma/seed.ts` — tenant, roles, demo tree, quiz, session, doc |
| OpenAPI docs                         | ✅    | `/api/docs`                                     |
| Unit + integration tests             | partial | Phase 10 ships four integration suites; unit coverage lands incrementally |

## Phase 4 — frontend dashboards

| Acceptance criterion                                  | Status | Evidence                                              |
| ----------------------------------------------------- | ------ | ------------------------------------------------------ |
| Admin / student / instructor dashboards               | ✅     | `#progress` for student; tenant block for admin       |
| Course catalog + course detail                        | ✅     | `#catalog`, `#course-live/:id`                        |
| Persian RTL layout                                    | ✅     | inherits the original SPA's RTL system                 |

## Phase 5 — AI Gateway mock / external API

| Acceptance criterion                | Status | Evidence                                                  |
| ----------------------------------- | ------ | ---------------------------------------------------------- |
| System runs with `AI_MODE=mock`     | ✅     | default in `.env.example`                                  |
| Can switch to `AI_MODE=external_api`| ✅     | `apps/ai-gateway/app/routes.py` `_proxy()`; ADR 0003       |
| All AI responses logged             | ✅     | `AiBridgeService` → `AiInteractionLog`                      |
| No GPU dependency                   | ✅     | nothing on the VPS imports a model; ADR 0003               |
| Docs explain how to connect a GPU server | ✅ | `docs/architecture/AI_GATEWAY.md` + `RAG_TUTOR.md`         |

## Phase 6 — class sessions + recordings

| Acceptance criterion                                  | Status | Evidence                                  |
| ----------------------------------------------------- | ------ | ------------------------------------------ |
| Instructor can schedule a session                     | ✅     | `POST /v1/class-sessions`                  |
| Student can join                                      | ✅     | `POST /:id/join`; Attendance written       |
| Attendance recorded                                   | ✅     | `Attendance` table; staff `/attendance` roster |
| Recording metadata attached                           | ✅     | `Recording` (1:1 with ClassSession)        |
| AI analysis triggered in mock mode                    | ✅     | `POST /:id/analyze` → bridge → mock provider |
| Provider abstraction                                  | ✅     | `LiveClassProvider` (ADR 0006); `MockLiveClassProvider` only |
| docs/architecture/LIVE_CLASS.md                       | ✅     | …                                           |

## Phase 7 — assessment basics

| Acceptance criterion                                  | Status | Evidence                                  |
| ----------------------------------------------------- | ------ | ------------------------------------------ |
| Quiz + assignment in one shape                        | ✅     | `Assessment.kind`; ADR 0007                |
| Multiple-choice + short-answer + essay questions      | ✅     | `Question.kind`                            |
| Auto-grade on finalise                                | ✅     | `SubmissionsService.autoScoreQuiz`         |
| Manual grade override                                 | ✅     | `PATCH /v1/submissions/:id/grade`          |
| AI grade-draft via gateway                            | ✅     | `POST /:id/ai-grade-draft`; always `humanReviewRequired` |
| Persistence of draft submissions                      | ✅     | `Submission.status="draft"`                |
| Tenant + user isolation                               | ✅     | unique on `(assessmentId,userId)`          |

## Phase 8 — learning events + dashboards

| Acceptance criterion                                                  | Status | Evidence                                  |
| --------------------------------------------------------------------- | ------ | ------------------------------------------ |
| Event types from docx §14 captured                                    | ✅     | `apps/api/src/analytics/event-types.ts`    |
| Auto-emission from service code                                       | ✅     | class-sessions + submissions hooks         |
| Client-emitted events allow-listed                                    | ✅     | `POST /v1/learning-events` DTO restricts to `CLIENT_EVENTS` |
| Student / course / tenant rollups                                     | ✅     | `/v1/analytics/{student/me,course/:id,tenant}` |
| Risk score is explainable and not final                               | ✅     | rule-based-v1, `humanReviewRequired: true`; ADR 0008 |
| ML risk API exists but not required locally                           | ✅     | gateway `/v1/learning-risk/predict` (mock); api sibling deferred to Phase 10.5 |
| Frontend renders real numbers                                         | ✅     | `#progress` page                            |

## Phase 9 — RAG-ready tutor

| Acceptance criterion                                  | Status | Evidence                                  |
| ----------------------------------------------------- | ------ | ------------------------------------------ |
| Document corpus persisted                             | ✅     | `Document` + `DocumentChunk`              |
| Tutor sessions persisted                              | ✅     | `TutorSession` + `TutorMessage`; ADR 0009 |
| Ask routes through ai-gateway `/v1/rag/query`         | ✅     | `TutorService.ask`; `test/tutor.spec.ts`  |
| Citations + confidence + humanReview on assistant UI  | ✅     | `Tutor.jsx`                                |
| `ai_tutor_asked` event emitted                        | ✅     | end of `TutorService.ask`                  |

## Phase 10 — docs + tests + security review (this turn)

| Acceptance criterion                                  | Status | Evidence                                  |
| ----------------------------------------------------- | ------ | ------------------------------------------ |
| Integration tests run via the runbook                 | ✅     | `.\scripts\remote.ps1 test` → `api-test`   |
| auth + RBAC + enrollment + tutor covered              | ✅     | four spec files under `apps/api/test/`     |
| `docs/SECURITY.md`                                    | ✅     |                                            |
| `docs/PRIVACY.md`                                     | ✅     |                                            |
| `docs/AI_GOVERNANCE.md`                               | ✅     |                                            |
| `docs/TESTING.md`                                     | ✅     |                                            |
| `docs/RELEASE_CHECKLIST.md`                           | ✅     |                                            |
| `docs/TECH_DEBT.md`                                   | ✅     |                                            |
| `docs/PHASE_10_REVIEW.md`                             | ✅     | this file                                  |

## Service inventory (current production state)

| Service       | Image                                | Where                          |
| ------------- | ------------------------------------ | ------------------------------- |
| `app`         | `digiuniversity:latest`              | `https://digiuniversity.ir/`    |
| `api`         | `digiuniversity-api:latest`          | `https://digiuniversity.ir/api/`|
| `ai-gateway`  | `digiuniversity-ai-gateway:latest`   | `https://digiuniversity.ir/ai/` |
| `postgres`    | `postgres:16-alpine`                 | internal: `postgres:5432`       |
| `api-test`    | `digiuniversity-api-test:latest`     | one-off, `--profile test`       |

## What we did NOT do in Phase 10

- **Certificate / verifiable credentials** — docx §11 lists
  `Certificate` and "Open Badges 3.0 / Verifiable Credentials". Lands
  in a dedicated phase.
- **Live video provider** — `LiveClassProvider` ships only the mock
  implementation; LiveKit / BigBlueButton implementation is a Phase
  11 deliverable (ADR 0006).
- **ML risk endpoint sibling** — `/v1/analytics/risk-ml/me` is a
  Phase 9.5 stub today; the rule-based default ships per ADR 0008.
- **PII redactor on outbound gateway calls** — `TECH_DEBT.md`.

## Ready-to-onboard checklist → `RELEASE_CHECKLIST.md`

Next concrete step is to run the release checklist for the first
real tenant.
