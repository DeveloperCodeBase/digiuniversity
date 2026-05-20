# ADR 0007: One `Assessment` table for both quizzes and assignments

Date: 2026-05-20

## Status

Accepted.

## Context

`project-run.docx` §11 lists `Assessment` and `Assignment` as separate
entities. Functionally:

- **Quiz** — a list of `Question` rows, mostly multiple-choice;
  largely auto-gradable; the most common shape in MVP demos.
- **Assignment** — a single free-form `Submission.answers.text` (and
  later `fileUrls`); always manually graded.

Both share most of their lifecycle: scheduled by an instructor, made
visible (`status=published`), have a `dueAt`, accept submissions, get
graded, get archived (`status=closed`).

We considered three options:

1. **Two separate tables** (`Quiz`, `Assignment`) each with their own
   `Submission` variants.
2. **One `Assessment` table** with a `kind` discriminator + a
   single `Submission` table whose JSON `answers` field covers either
   shape.
3. **Inheritance** via Postgres table inheritance or Prisma's lack of
   it — Prisma doesn't support it cleanly, so we never seriously
   considered this.

## Decision

We chose (2): a single `Assessment` row with `kind: "quiz" |
"assignment"` and a single `Submission` row whose `answers` JSON
encodes the relevant shape.

- `Question` rows hang off `Assessment` only when `kind=quiz`.
  Assignments have zero `Question` rows; their content lives in
  `Assessment.instructions`.
- `Submission.answers` is `Record<questionId, {selectedIndex?, text?}>`
  for quizzes and `{ text, fileUrls? }` for assignments. The
  `AutoScore` service knows which shape to expect based on the
  parent assessment's `kind`.
- The lifecycle (draft → published → closed) is identical for both.

## Why this is the right call now

- The interesting product behaviour (publish, grade, AI assist,
  audit-log) is identical between quiz and assignment. Two tables
  would have meant duplicating it twice.
- The `kind` discriminator is small (1 column), and Postgres handles
  the JSON field shape difference fine.
- If a later phase splits them — say, assignments grow file uploads
  and rubric attachments — we can promote `kind=assignment` rows
  into a dedicated table without renaming or losing audit history.

## Consequences

- TypeScript surfaces never enforce "questions only on quizzes" — we
  enforce it at the service layer (returning 400 if a question is
  added to an assignment).
- The auto-grade routine has to inspect `kind` to know whether to
  iterate questions or fall through to the manual flow.
- Single tab in Swagger / single set of controllers — less to keep
  in sync with the SPA.
