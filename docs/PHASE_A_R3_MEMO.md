# Phase A R3 — Memo (Ten role dashboard differentiation)

> Written before code. Memo commits before any implementation file.

## What I'm going to build

Six **new** role-specific dashboards (per Master Runbook §5) plus a thin role-router in `Dashboard.tsx` that picks the right one based on `useAuth().user.roles[0]`. The existing 4 polished pages (Dashboard.tsx student, Instructor.tsx, Roles.tsx AdminPage / ParentPage) stay — they're already good and have direct routes (`/dashboard`, `/instructor`, `/admin`, `/parent`).

The 6 NEW dashboards (currently missing per the role catalogue):

| Role | Route | Master Runbook §5 widgets |
|---|---|---|
| **Super Admin** | `/super` | tenants table, system health gauges, feature flags grid, cross-tenant analytics, impersonate button (audited) |
| **Content Manager** | `/content` | course approval queue with split-view (preview / rubric+checklist), quality criteria, comments thread |
| **TA** | `/ta` | assigned offerings list, grading queue scoped to TA permissions, NO authoring access |
| **Support** | `/support` | tickets queue, impersonation with mandatory reason+audit, refund processing shortcut |
| **Moderator** | `/moderate` | flagged content queue, forum reports, auto-moderation rules table |
| **Org Manager** | `/org` | cohort dashboard, bulk enroll CSV button, seat utilization, invoicing summary |

All mock data carries a visible "نمونه" / source-mock badge per the Phase-A stub policy.

## Files I will touch (max 15)

| # | File | New / Modify | Purpose |
|---|---|---|---|
| 1 | `apps/web/src/pages/dashboards/SuperAdminDashboard.tsx` | NEW | Super Admin role home |
| 2 | `apps/web/src/pages/dashboards/ContentManagerDashboard.tsx` | NEW | Content Manager role home |
| 3 | `apps/web/src/pages/dashboards/TADashboard.tsx` | NEW | TA role home |
| 4 | `apps/web/src/pages/dashboards/SupportDashboard.tsx` | NEW | Support role home |
| 5 | `apps/web/src/pages/dashboards/ModeratorDashboard.tsx` | NEW | Moderator role home |
| 6 | `apps/web/src/pages/dashboards/OrgDashboard.tsx` | NEW | Org Manager role home |
| 7 | `apps/web/src/pages/dashboards/MockBadge.tsx` | NEW | Reused "نمونه" pill — visible on every mock widget |
| 8 | `apps/web/src/pages/dashboards/DashboardShell.tsx` | NEW | Shared wrapper: greeting + KPI strip slot + content slot |
| 9 | `apps/web/src/pages/Dashboard.tsx` | MODIFY | Thin role router — reads `useRole().role.id`, delegates to the right `Dashboards/*` or keeps the student layout |
| 10 | `apps/web/src/router.tsx` | MODIFY | Register `/super`, `/content`, `/ta`, `/support`, `/moderate`, `/org` routes |
| 11 | `apps/web/src/role.tsx` | MODIFY | Update `homeRoute` for the 6 new roles to point to their new routes (was all `"admin"` / `"messages"` / `"community"` placeholders) |
| 12 | `apps/web/tests/visual/phase-a-r3-dashboards.spec.ts` | NEW | D12 spec: 10 role assertions at 1280 + 375 viewports |
| 13 | `docs/PHASE_A_R3_MEMO.md` | NEW (this file) | Plan lock |
| 14 | `docs/PHASE_A_R3_REVIEW.md` | NEW (after deploy) | Review + manual smoke checklist |

11 source-code files + 2 docs + 1 spec = 14 files. Under the 15-file cap.

## Design constraints (carried over from prior R memos)

- **No new `@ts-nocheck`.** Every new file ships typed.
- **No fresh `any`.** Mock data shapes get explicit interfaces.
- **No `as any` casts.** Period.
- **D12 5-point visual contract** on each new dashboard's spec assertion.
- **D13 manual-smoke gate** before R3 is claimed shipped.
- **`source: "mock"` discipline** per Phase-A external-dependency policy: every widget that renders mock data shows the `<MockBadge />` so the visitor sees "نمونه".
- **Responsive at every viewport.** Each dashboard tested at 375 + 1280 minimum.

## What R3 deliberately does NOT do

- Wire to real APIs. Phase B introduces the real api endpoints (tenants, applications, etc.); R3 ships mock-only with the `source: "mock"` discipline. Pages are ready to swap implementations without prop changes.
- Build polish for /dashboard, /instructor, /admin, /parent (the existing 4 surfaces). Those already render and aren't part of R3's "add the missing 6" scope.
- Add CASL granular per-action checks on dashboard widgets. R3 dashboards use role-based render gating; CASL per-action is Phase B's CASL frontend pickup.

## DoD for R3

- [ ] All 6 new dashboard files exist + are typed (no @ts-nocheck)
- [ ] `/dashboard` correctly routes to the role's home content (student stays default; others delegate or redirect)
- [ ] 6 new routes registered in router.tsx
- [ ] role.tsx homeRoute fields updated for the 6 roles
- [ ] Every widget that uses mock data has a visible `<MockBadge />`
- [ ] D12 spec: 12 assertions (2 per role × 6 new roles), each ≥3 D12 points satisfied
- [ ] No regression on R1.1 / R1.4 / R5 specs
- [ ] Visit each `/super`, `/content`, `/ta`, `/support`, `/moderate`, `/org` route — renders without console errors
- [ ] **Owner manual smoke on real device** — 10-step checklist (one per role)

## Verification flow

```powershell
git add -A
git commit -m "Phase A R3: <slug>"
.\scripts\remote.ps1 up
.\scripts\remote.ps1 logs                    # clean boot
.\scripts\remote.ps1 visual -Service phase-a-r3-dashboards
.\scripts\remote.ps1 visual -Service phase-a-r5-login       # regression
.\scripts\remote.ps1 visual -Service phase-a-r1-1-appshell  # regression
# write PHASE_A_R3_REVIEW.md
# pause for owner manual smoke per D13
```

## Batching plan

Each batch is one commit, ≤300 line target (10–15% grace per R1.1-D7).

| Batch | Files | Est. lines |
|---|---|---|
| **R3.1 Foundation** | MockBadge + DashboardShell + Dashboard.tsx routing + role.tsx homeRoute updates + router.tsx new routes | ~250 |
| **R3.2 SuperAdmin + ContentManager** | 2 dashboards | ~300 |
| **R3.3 TA + Support** | 2 dashboards | ~300 |
| **R3.4 Moderator + Org** | 2 dashboards | ~300 |
| **R3.5 Spec + review** | phase-a-r3-dashboards.spec.ts + PHASE_A_R3_REVIEW.md | ~200 |
