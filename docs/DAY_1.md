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
- R1.1 code: `apps/web/src/layouts/AppShell.tsx` (101 lines, 3-mode shell), `apps/web/src/router/route-classification.ts` (40 lines, extracted), `apps/web/src/hooks/useMediaQuery.ts` (26 lines, SSR-safe matchMedia), router.tsx refactored (Layout deleted, LayoutWithChrome wraps UIRoot+AppShell), shared.tsx Nav extended with `mode` + `onWorkspaceMenuClick` props + context-aware brand target, styles.css workspace-grid breakpoint 980 → 1023 + sidebar-drawer + nav-mode rules — commit pending push
- Diff size: +296 / -164 (net +132). Under the 300-line cap.

## Self-critique

_(populated end of day)_

## Blocked

_(none yet)_

## Tomorrow's plan

_(set end-of-day; if R1 not done, continue; if R1 done, start R2)_
