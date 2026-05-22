# Day 1 — Phase A kickoff

Date: 2026-05-22 (1405-03-01 شمسی)
Working on: Phase A Foundation Repair

## Plan for today

1. R1.1: AppShell skeleton + 3-mode + sidebar Sheet drawer + CSS breakpoint fix
2. Deploy R1.1, capture Playwright evidence
3. R1.2: Breadcrumbs row + truncation popover + route-label map
4. Deploy R1.2, capture evidence
5. Write `docs/PHASE_A_R1_REVIEW.md`
6. Pause for user 60-second smoke

## Shipped

- R1.1 memo + Phase A running logs (`docs/PHASE_A_R1_MEMO.md`, `PHASE_A_OUT_OF_SCOPE.md`, `PHASE_A_DECISIONS.md`, `DAY_1.md`) — commit pending push
- R1.1 code (commit `de3cde5`): `apps/web/src/layouts/AppShell.tsx` (101 lines, 3-mode shell), `apps/web/src/router/route-classification.ts` (40 lines, extracted), `apps/web/src/hooks/useMediaQuery.ts` (26 lines, SSR-safe matchMedia), router.tsx refactored (Layout deleted, LayoutWithChrome wraps UIRoot+AppShell), shared.tsx Nav extended with `mode` + `onWorkspaceMenuClick` props + context-aware brand target, styles.css workspace-grid breakpoint 980 → 1023 + sidebar-drawer + nav-mode rules.
- R1.1 test (commit `3942656`): `apps/web/tests/visual/phase-a-r1-1-appshell.spec.ts` (121 lines, 13 assertions across 4 groups: 3-mode topology, logo target, responsive, a11y).
- Total R1.1 PR size: +443 / -165 added/removed (296 code + 147 test+docs). Over the 300 target — explained in R1.1-D7: code+test must ship together; cannot horizontally split per the new memory rule.

## Blockers (resolved during day)

- VPS deploy blocked on `git pull` because the audit PNG dir was untracked but conflicted with origin's tracked PNGs. `remote.ps1`'s docs sweep silently failed (Playwright container UID owned the files; VPS user couldn't unlink). Logged the underlying `remote.ps1` flaw in `PHASE_A_OUT_OF_SCOPE.md` (infra PR after Gate A). User ran a permanent fix and confirmed git status clean; deploy retried successfully.

## Drafted (committed after R1.1 deploys)

- R1.2 memo + code drafted in working tree: `docs/PHASE_A_R1_2_MEMO.md`, `apps/web/src/router/breadcrumb-map.ts` (26 lines, label dictionary + `breadcrumbLabel` helper), `apps/web/src/layouts/Breadcrumbs.tsx` (77 lines, 3-row chrome with Radix Popover truncation at <md), AppShell injection (5 lines), styles.css breadcrumb styles (~85 lines), test spec `phase-a-r1-2-breadcrumbs.spec.ts` (103 lines, 11 assertions). Total R1.2 draft: 297 added — under the 300 target.

## Self-critique

_(populated end of day)_

## Blocked

_(none yet)_

## Tomorrow's plan

_(set end-of-day; if R1 not done, continue; if R1 done, start R2)_
