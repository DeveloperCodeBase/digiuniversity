# Privacy

What data we collect, how long we keep it, and how a user (or tenant
admin) can delete it.

## What we store

| Category                | Where                                    | Why                              |
| ----------------------- | ---------------------------------------- | -------------------------------- |
| Identity (email, name)  | `User.email`, `User.fullName`            | login, display                   |
| Password (hashed)       | `User.passwordHash` (bcrypt cost 12)     | auth                             |
| Session tokens (hashed) | `RefreshToken.tokenHash`                 | rotating refresh                 |
| Enrolments              | `Enrollment`                             | course access, grading           |
| Submissions             | `Submission.answers`, `Submission.feedback` | grading + review              |
| Class attendance        | `Attendance`                             | participation analytics          |
| Learning events         | `LearningEvent`                          | dashboards + risk scoring        |
| AI interactions         | `AiInteractionLog.request` + `.response` | governance audit                 |
| Tutor conversations     | `TutorMessage`                           | resume, history, audit           |

We do **not** store:

- Raw refresh tokens (only their SHA-256 hash).
- Card / payment info — that's Phase 11+ scope and will land in a
  dedicated processor (Stripe/Zarinpal).
- Biometrics or any image / audio not explicitly uploaded for an
  assignment.
- Browser fingerprints. `User-Agent` and IP are stored on
  `RefreshToken` rows for session hygiene; on the relevant request
  only, never aggregated across users.

## Retention

- **Active data** lives forever (or until a tenant admin deletes it).
- **Soft-deleted rows** (`deletedAt IS NOT NULL`) stay in the DB
  indefinitely today. A retention job will sweep them in Phase 10.5.
- **AI audit rows** are kept for the lifetime of the tenant. They are
  the regulatory paper trail for every model output.
- **Learning events** older than 90 days are candidates for cold
  storage in Phase 10.5 — analytics rollups will be persisted so the
  raw events can be archived.

## Tenancy + visibility

- A user's data is visible only to:
    - the user themselves (`/me` endpoints, owner-only checks),
    - their tenant's admins,
    - their tenant's instructors **for their own courses** (Phase
      11+ adds the course-scope check; today instructor RBAC is
      tenant-wide for read endpoints).
- Cross-tenant reads are physically impossible — every query is
  filtered by `tenantId` (ADR 0004) and DB-level uniques are
  tenant-scoped.

## A user wants their data

Today the supported flow is admin-mediated:

1. The user emails their tenant admin.
2. The admin runs `SELECT … FROM "User" … WHERE id = $1` joined to the
   tables above and exports the result.

Phase 10.5 ships a `GET /v1/users/me/export` endpoint that produces
the same artefact as a download.

## A user wants their data deleted

Today the supported flow is also admin-mediated. Behaviour by table:

- `User`: hard delete cascades to enrolments, submissions,
  attendance, refresh tokens, hosted sessions, learning events
  (set-null on the userId).
- `AiInteractionLog`: keeps the row but `userId` becomes `null` (the
  `ON DELETE SET NULL` FK). This preserves the audit trail without
  retaining the identity.
- `TutorMessage`: same treatment — content stays so the audit
  reproducibility holds, but the `userId` becomes null.
- `LearningEvent`: same.

Phase 10.5 adds `DELETE /v1/users/me` with the same semantics behind
a 24-hour grace window.

## Cross-border transfers

We do not transfer data outside the host country (Iran) in the
production deployment. When `AI_MODE=external_api` is enabled with a
non-domestic provider, the data sent to the AI Gateway can include
user-authored prompts; that is documented per-tenant in their data
processing agreement before the flag flips.

## Cookies

The SPA stores the access + refresh tokens in `localStorage` keyed
under `digiu_session_v1`. They are not cookies — there is no
`Set-Cookie` from any service. The persistent session survives a
browser restart on the same device but does not travel.
