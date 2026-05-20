# ADR 0005: Audit fields + soft delete on every domain row

Date: 2026-05-20

## Status

Accepted.

## Context

Phase 3 lands the university domain (Faculty → Department → Program →
Course / Cohort / Enrollment). These rows drive grading, transcripts,
and certificates downstream, so we need:

- **Provenance** — who created this row, who last edited it
- **Reversibility** — instructors and admins delete things by mistake;
  hard deletes orphan FKs and lose history
- **Auditability** — regulators (and our own QUALITY review in Phase 8)
  expect to see what changed and when

## Decision

Every domain row (everything under `apps/api/prisma/schema.prisma` past
the auth/RBAC core) carries five fields:

| Field       | Type       | Meaning                                              |
| ----------- | ---------- | ---------------------------------------------------- |
| `createdAt` | timestamp  | row insert time (`@default(now())`)                  |
| `updatedAt` | timestamp  | row last-update time (`@updatedAt`)                  |
| `createdBy` | text/null  | userId that created the row (resolved from `req.user`) |
| `updatedBy` | text/null  | userId that last updated the row                       |
| `deletedAt` | timestamp? | non-null → soft-deleted; default queries filter it out |

### Conventions

- `createdBy` / `updatedBy` are plain strings — **not** FKs to `User`.
  Audit data must survive user deletion (per AGENTS.md), so a hard FK
  cascade would be wrong, and a `SET NULL` here would lose the most
  important field on the row.
- Every list / get endpoint includes `deletedAt: null` in its
  `where` clause. Re-enabling a soft-deleted row is an explicit
  operation (not implemented yet — Phase 3.5).
- Composite uniques on tenant-scoped slugs (e.g.
  `@@unique([tenantId, slug])`) are NOT scoped to `deletedAt = null`.
  Reusing a slug from a soft-deleted row requires either restoring
  that row or hard-deleting it. This is deliberate: it makes accidental
  collisions impossible.
- Every controller resolves `tenantId` and `userId` from
  `@CurrentUser()` and writes them into the row — DTOs never accept
  these values from the client.

### What this does NOT do

- It does **not** store a per-field change log. That belongs in a
  separate `EntityAuditLog` table (Phase 6) keyed by `(entity, entityId,
  fieldName, oldValue, newValue, actorId, at)`. We'll add it before we
  ship grading.
- It does **not** automatically purge soft-deleted rows. We accept the
  ongoing storage cost; a Phase 6 retention job can sweep rows older
  than N days when policy demands it.

## Consequences

- Every CRUD service has the same shape: filter by `tenantId +
  deletedAt: null`, stamp `createdBy/updatedBy` on writes, set
  `deletedAt` instead of `DELETE`.
- The DB stays referentially consistent forever (no orphans from soft
  deletes).
- Restoring a "deleted" row is `UPDATE … SET deletedAt = NULL` — no
  data has to be rebuilt.
- Slug collisions with a tombstoned row need a human decision, which
  is the right default.
