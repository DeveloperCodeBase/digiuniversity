# Phase A R1.2 — Memo (Breadcrumbs)

> Written before code. Locks the plan. Commits before any implementation file.

## What I'm going to build

A 36px breadcrumb row injected by AppShell directly below the topbar, visible only on WORKSPACE routes. Adaptive truncation: at `<md` (<768px) the trail collapses to `first › … › last-2` with a Radix Popover showing the hidden hops.

Spec source: user-chat-2026-05-22, AskUserQuestion R1-D1 (see `PHASE_A_DECISIONS.md`).

## Files I will touch

Max 15 enforced. Current count: 7.

| # | File | New / Modify | Purpose |
|---|---|---|---|
| 1 | `apps/web/src/router/breadcrumb-map.ts` | NEW | route-id → Persian label dictionary + `breadcrumbLabel(id)` helper + `useBreadcrumbResolver` extension point for future dynamic labels |
| 2 | `apps/web/src/layouts/Breadcrumbs.tsx` | NEW | Component: builds the crumb list from useCurrentRoute, renders `<nav aria-label="مسیر صفحه"><ol>`, applies `<md` truncation via Radix Popover |
| 3 | `apps/web/src/layouts/AppShell.tsx` | MODIFY (+~5 lines) | Inject `<Breadcrumbs />` slot below topbar, workspace-only render |
| 4 | `apps/web/styles.css` | MODIFY (+~25 lines) | `.breadcrumb-row`, `ol`, `breadcrumb-sep` (›), `.breadcrumb-popover` shell, `.breadcrumb-ellipsis` button |
| 5 | `apps/web/tests/visual/phase-a-r1-2-breadcrumbs.spec.ts` | NEW | Assertions: hidden on PUBLIC + AUTH_FLOW, visible on WORKSPACE, truncation at <md, › separator, Popover opens, a11y |
| 6 | `docs/PHASE_A_R1_2_MEMO.md` | NEW (this file) | Plan lock |
| 7 | `docs/PHASE_A_R1_REVIEW.md` | NEW (after R1.2 deploys) | Combined R1.1 + R1.2 review per the new rule |

## Scope clarifications (not deferring silently — documenting now)

- **Static labels only** in R1.2. The dictionary in `breadcrumb-map.ts` returns a fixed Persian label per route-id. Dynamic context-aware labels (e.g., `/course/abc-123` showing the actual course title fetched from the API) require pages to push label overrides via a future `useBreadcrumbResolver` hook. The hook **interface** ships in R1.2 (so pages can adopt it in Phase B), but no page implements it in R1.2.
- **Param segment**: when a route has a URL param (e.g., `/course/:courseId`), R1.2 renders the param verbatim as the trailing crumb (encoded as-is). Phase B pages will override this with the resolved name (e.g., course title) via the resolver hook.
- **Edge cases per user spec**:
  - `/` (home): single crumb "خانه", non-link, `aria-current="page"`
  - 404: trail = "خانه › صفحه پیدا نشد" — but R1.2 catch-all already routes to Home, so 404 not actually reachable; revisit if a real `NotFoundPage` is added
  - role-aware dashboard label: "خانه › داشبورد {role.label}" — extends `dashboard` mapping by reading `useRole().role.label`

## Risks I see

1. **Popover focus management at RTL**: Radix Popover's `side` defaults to bottom; under RTL the start/end positioning matters. Test will assert that clicking … opens the popover and Escape closes it returning focus to the … button.
2. **Truncation breakage with single-segment routes**: if the workspace home is `/dashboard` (2 crumbs), truncation should not kick in. Logic: `truncated = !isMd && crumbs.length > 3`.
3. **Layout shift**: a 36px row appearing between topbar and content could push content down on first paint. Mitigation: the row exists in DOM at all workspace renders (even when crumbs.length === 1); CSS reserves the height; no conditional mount.
4. **AppShell modification re-touches a file from R1.1**: per the ≤15-file rule, this is fine, but the diff to AppShell.tsx must be additive only (insert `<Breadcrumbs />` slot, no logic change).

## Out of scope for R1.2

- Dynamic context-aware labels (e.g., fetch course title) — interface only, no consumer
- Role-aware dashboard label override — deferred to R3 (10 role dashboards) where each role's dashboard knows its own label
- Truncation popover hover preview — `<md` only, popover triggered by click; no hover preview to keep mobile UX simple

## DoD for R1.2

- [ ] `apps/web/src/layouts/Breadcrumbs.tsx` exists, exported
- [ ] AppShell renders Breadcrumbs only on WORKSPACE routes
- [ ] At lg+ (≥1024), full trail visible
- [ ] At md (768–1023), full trail visible (no truncation — width still fits)
- [ ] At <md (<768), trail truncates to `first › … › last-2` when total > 3 crumbs
- [ ] Clicking … opens a Radix Popover showing the hidden crumbs as clickable links
- [ ] Separator is U+203A (›), not `/` or `\`
- [ ] `aria-label="مسیر صفحه"` on the nav, `aria-current="page"` on the trailing crumb
- [ ] Hidden entirely on PUBLIC and AUTH_FLOW routes
- [ ] Test spec asserts each of the above + Escape closes Popover + focus returns
- [ ] No new `@ts-nocheck`
- [ ] PR diff (R1.2 alone) ≤ 300 lines

## After R1.2 deploys

→ Write `docs/PHASE_A_R1_REVIEW.md` covering R1.1 + R1.2 together.
→ Capture 60-second smoke evidence via `.\scripts\remote.ps1 visual -Service phase-a-r1-1-appshell` and `.\scripts\remote.ps1 visual -Service phase-a-r1-2-breadcrumbs`.
→ **Pause for user 60-second smoke** with links to evidence.
→ Then start R2 (retire `@ts-nocheck`).
