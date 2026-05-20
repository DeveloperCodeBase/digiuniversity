# Tech debt

Living list of "we know about this but it's not Phase 10". One-line
problems with one-line directions to a fix; full ADRs land when we
pick something up.

## Backend / api

- **Vite SPA bundle is ~600 KB unsplit.** Build warns every time.
  Code-split with `manualChunks` for `react`/`react-dom` + per-page
  dynamic imports.
- **Refresh-token observability.** `RefreshToken` rows pile up; we
  never delete revoked ones. Add a Phase 10.5 retention job that
  drops rows older than `expiresAt + 30d`.
- **Per-tenant rate limit.** No throttling yet on `/auth/login` or
  `/tutor/ask`. Add an `@nestjs/throttler` guard at the global
  layer keyed on `tenantId + ip`.
- **No structured logger.** Nest's default logger writes to stdout
  unstructured. Wire `pino` so logs are JSON for downstream
  ingestion.
- **`User-Agent` truncation.** We slice at 256 chars on
  `RefreshToken.userAgent`; some genuinely long UAs end up clipped.
  Bump to 512 or hash.
- **Instructor course scoping is tenant-wide.** Instructors can read
  any course in their tenant. Add a `CoursePolicy` that requires
  membership for instructor-scoped writes.

## Schema

- **`Submission.aiGradeDraft` is denormalised.** It mirrors what's in
  `AiInteractionLog` for fast UI display. Trade-off accepted in ADR
  0007; document the staleness window.
- **`DocumentChunk.embedding` is `Json`.** Switch to `pgvector` once
  the GPU server lands (Phase 11). Migration is `ALTER COLUMN` +
  backfill, schema otherwise unchanged.
- **No `tsvector` for free-text search.** `/v1/courses?q=…` would
  need it. Lands with the OpenSearch story.

## AI gateway

- **Mock provider only.** All output is canned Persian text.
  External-provider implementations land when `AI_MODE=external_api`
  is exercised end-to-end with a real key.
- **No outbound PII redactor.** When the gateway switches to
  `external_api`, user-authored text leaves the host. Add a
  pre-forward redactor that strips emails / national IDs / phone
  numbers.

## Frontend

- **Existing 49-route mock SPA is untouched.** Catalog / MyCourses /
  CourseLive / AssessmentLive / Tutor / Progress are the live pages.
  The originals from `data.js` still hash-route alongside; migrating
  them is a per-page concern.
- **No nav update for the new live routes.** `Nav` in `shared.jsx`
  still surfaces the mock routes; add `#catalog`, `#progress`,
  `#tutor` to the role-aware nav config.
- **`fetch` client doesn't retry transient network errors.** Only
  the 401-refresh dance is implemented. Add a one-shot retry for
  502/503/504 with exponential backoff.

## DevOps

- **No CI yet.** `.\scripts\remote.ps1 test` runs on the VPS by hand.
  Wire a GitHub Action that runs the same test profile on every
  push.
- **No Sentry / error sink.** Server errors land in `docker logs`
  only. The `.env.example` has a `SENTRY_DSN` placeholder ready.
- **Single VPS, no DR.** Phase 11+ duplicates the stack to a
  different region.

## Docs

- **Phase 10 docs are written, not externally reviewed.** Schedule a
  security review with a third party before onboarding the first
  paying tenant.
- **`docs/data/DATA_DICTIONARY.md` is missing.** Each model has
  inline Prisma comments; we owe a single-page table.
- **OpenAPI ships from Swagger but no client codegen.** `packages/sdk`
  is sketched in ADR 0002 but empty. Generate a typed TS client and
  use it from the SPA instead of the hand-rolled `endpoints.js`.

## AI governance follow-ups

- **`/v1/analytics/risk-ml/me` sibling endpoint** that calls the
  gateway's `/v1/learning-risk/predict`. Sketched in ADR 0008. Lands
  when the gateway has a real model behind it.
- **Per-question rubric editor** for instructors so the AI grade-draft
  has structured criteria to score against. Currently `Question.rubric`
  doesn't exist — Phase 11.

## Frontend a11y / i18n

- **No formal a11y audit.** Persian RTL is the only locale today;
  most components inherit `dir="rtl"` from the document, but tab
  order + keyboard focus on the catalog grid haven't been audited.
- **Date formatting via `toLocaleDateString("fa-IR")`.** Works in
  modern browsers but stale older browsers fall back to Gregorian.
  Phase 10.5 picks `date-fns-jalali` or similar.

## Test coverage

- **No assessment-grading test.** `submissions.spec.ts` doesn't
  exist. Add one that creates a quiz, submits correct answers as
  the student, finalises, and asserts `grade=100`.
- **No `risk/me` test.** A snapshot-style test that seeds known
  shape and asserts the factor list would lock in the rule.
- **No frontend e2e.** Playwright planned for Phase 10.5.
