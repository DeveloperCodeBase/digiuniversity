# Phase B — DEFERRED (per D44, 2026-05-25)

This directory holds Phase B planning docs that were drafted **before** Gate A formally closed. Per D11 sequencing («هیچ Phase B work قبل از Gate A pass»), they have been moved here as evidence rather than acted on.

## Files

- `PHASE_B_MEMO.md` — original Phase B program memo (B.1a + B.1b + B.2 outline)
- `PHASE_B_R1_REVIEW.md` — B.1 review (University+Semester end-to-end verified)
- `PHASE_B_R2_MEMO.md` — B.2 memo (CourseOffering + dual-write from Cohort)

## Status

**Frozen.** No Phase B work until Gate A closes formally. Per D44:
- B.1a (commit `106c725`) reverted — University + Semester models + endpoints + migration removed from source
- B.1b (commit `e939a4a`) reverted — Academic Hierarchy admin page + academicsApi removed
- B.2 (planning only, commit `7dcf0f4`) — docs only, never coded

## DB-state note

The B.1a migration `20260524000000_b1a_university_semester` was applied to the production database **before** the revert. The revert removes the migration file from source but **does NOT drop the tables on the live DB**. Those tables (`University`, `Semester`) remain on the live DB as dormant additive structures with no code references. They are safe and harmless until Phase B properly restarts post-Gate-A — at which point either:

1. The same migration file is reinstated and `prisma migrate deploy` is a no-op (DB already has it); or
2. The dormant tables are dropped manually before Phase B re-introduces them.

Owner decision required at Phase B restart on which path to take.

## Restart condition

Phase B may restart **only after** Gate A closes formally per the DoD in `docs/GATE_A_DOSSIER.md` (Lighthouse ≥ 90, axe-core 0 critical/0 serious documented exceptions, 10/10 role routing, ≤5 deferred `@ts-nocheck`, owner D13 ack on all sub-Rs).

— Phase A author, 2026-05-25. D44 logged in `docs/PHASE_A_DECISIONS.md`.
