# Phase B R0.5 — Migration Policy Doc — Memo

**Author:** Phase B (post-Gate-A, pre-R1)
**Date:** 2026-05-26
**Status:** ⏳ DRAFT — awaiting owner ack before doc-write begins
**Workflow:** memo → owner ack → doc-write → owner doc-ack → close (per D61)
**Why R0.5:** per Q1.a (locked D60), `docs/MIGRATION_POLICY.md` ships as a separate pre-R1 task — clean sub-R boundary + owner-reviewable independent of R1 code.
**Reference:** owner directive 2026-05-26 + Compass Roadmap §Cross-cutting policies.

---

## Goal

Author `docs/MIGRATION_POLICY.md` as the **single source of truth** for how Prisma schema changes ship across Phase B. Every Phase B sub-R that touches the schema (R1 starts; R2 dual-write Cohort → CourseOffering; later models) follows this doc.

The doc is reference-only for R0.5. It informs R1+, doesn't itself execute migrations.

---

## Scope — sections planned

Per owner directive, the doc covers **11 topics**:

| # | Section | Estimated LOC |
|---|---|---:|
| 1 | Dual-write strategy explanation (when needed, when not) | ~20 |
| 2 | New model addition (greenfield — e.g., R1 School/Faculty/Department/Program — no dual-write needed) | ~12 |
| 3 | Modification of existing model (e.g., Cohort → CourseOffering — dual-write required) | ~18 |
| 4 | Field addition (additive, usually safe) | ~10 |
| 5 | Field rename (read-old-write-both → read-new-write-both → read-new-only pattern) | ~22 |
| 6 | Field removal (deprecation period: Sunset header, ≥4 sprints) | ~14 |
| 7 | Cascade strategy (CASCADE vs SET NULL vs RESTRICT vs soft-delete) | ~15 |
| 8 | Soft-delete pattern (Phase B R1 uses it — document the `deletedAt` + `deletedBy` shape + index hygiene) | ~18 |
| 9 | Migration testing approach (Prisma `migrate dev` + test seed + e2e cascade verification) | ~14 |
| 10 | Rollback strategy (`prisma migrate resolve` + revert commit pattern + dormant-table caveat per D44) | ~12 |
| 11 | Reference links (Prisma docs + Phase A R4 audit-on-mutation enforcement + Compass cross-cutting policies) | ~5 |

**Total target: ~160 LOC** (matches owner estimate). If the actual write trends materially higher (say > 200 LOC), I'll note it in the R0.5 close, not silently bloat.

---

## What the doc explicitly INCLUDES

- **Concrete examples from Phase A.** Reference the dormant `University`/`Semester` tables (D44 — applied to live DB but reverted in source) to illustrate the rollback caveat in section 10.
- **Concrete examples from R1.** The 4-level Academic Hierarchy (School/Faculty/Department/Program) is the working illustration in sections 2, 7, 8 (greenfield + cascade + soft-delete).
- **Code-shaped pseudo-snippets.** Not full TypeScript files, but ~5-10 line illustrations per pattern: a Prisma field-rename migration, a NestJS dual-write interceptor skeleton, a `Sunset` header response shape.
- **Phase A R4 enforcement note.** Every mutation in any model touched by a migration must carry `@AuditAction()` per the lint rule — the doc reminds readers this is mandatory, not optional.
- **Migration testing checklist.** A 5-point checklist any future migration commit must satisfy (per Compass §Cross-cutting): additive-only, dual-write if non-additive, Sunset+Deprecation headers, MigrationSyncLog row, old+new endpoints both green.

## What the doc explicitly EXCLUDES (out of scope)

- ❌ **Specific migration files.** This is policy, not the actual migrations. R1's own migration ships under R1, governed by this policy.
- ❌ **Tooling implementation.** No script-writing for "automated migration deploy" — Phase A `remote.ps1 up` already runs `prisma migrate deploy` on container start (per `apps/api/docker-entrypoint.sh` line 10). The doc references this, doesn't replace it.
- ❌ **API versioning strategy.** That's its own document (lives in `docs/ARCHITECTURE_V2_NOTES.md` per Phase A TASK 1). MIGRATION_POLICY references it but doesn't re-author.
- ❌ **Data backfill scripts.** R1 doesn't need any; later sub-Rs (e.g., R2 Cohort→CourseOffering dual-write) will write their own. Policy gives the SHAPE of backfill commits but no scripts.

---

## Why this is R0.5 and not R1.A

Q1.a (locked D60) decided this is a **separate** pre-R1 task. The reasons that still apply:

- The doc is owner-reviewable in isolation — no schema/code waiting on the same review cycle.
- If owner wants changes to the policy, those changes don't block R1 schema work being drafted in parallel mentally.
- Clean sub-R boundary means D-numbered decisions stay legible (R0.5 close = D62; R1 start = D63).
- Workflow discipline (D61 Reminder 1) is easier to enforce with smaller sub-R atoms.

---

## Verification plan (R0.5)

R0.5 has no code, no spec, no Lighthouse. Verification is:

1. **Owner reads the doc.** 5-10 min read on a desktop.
2. **Owner ack format:** «MIGRATION_POLICY OK، شروع R1» or «MIGRATION_POLICY needs edits: [list]».
3. **If edits requested:** I update, owner re-reviews, repeat.
4. **R0.5 close:** D-number entry in decisions log marking the policy as locked + R1 unblocked.

No Chrome Extension pre-smoke needed (no code).

---

## Status

| Item | Status |
|---|---|
| R0.5 memo (this file) | ✅ |
| **Owner memo ack** | ⏳ pending |
| `docs/MIGRATION_POLICY.md` doc-write | ⏳ post-memo-ack |
| Owner doc-ack | ⏳ post-doc-write |
| R0.5 close + R1 unblock | ⏳ post-doc-ack |

**One-line ack format:** «R0.5 memo OK، doc بنویس» (or any explicit affirmative; if memo needs changes, list them).

— Phase B R0.5 kickoff, 2026-05-26. R1 code blocked until R0.5 closes.
