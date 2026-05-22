# Phase A R1 — Memo

> Written before code. Locks the plan; commit comes before any implementation file.

## What I'm going to build

A single `AppShell` component that owns all chrome (topbar, breadcrumbs, sidebar/drawer, footer) with three discriminated render modes — `PUBLIC`, `AUTH_FLOW`, `WORKSPACE` — and adaptive responsive behavior:

- **lg+ (≥1024px):** fixed sidebar (240px) + topbar (64px) + breadcrumb row (36px) on workspace.
- **md (768–1023px):** topbar + breadcrumb + content. Single hamburger in topbar opens **either** the public nav drawer (on PUBLIC) **or** the role sidebar drawer (on WORKSPACE). Never both. Closes the tablet-collapse gap that the 150-PNG dossier flagged.
- **xs–sm (<768px):** same as md, plus breadcrumb truncation (first + … + last 2 levels with Radix Popover on …).

Spec source: user clarification dated 2026-05-22 (see `docs/PHASE_A_DECISIONS.md#R1-D1` and `#R1-D2`).

### Split decision

R1 is split into two PRs to honour the ≤300-line rule:

- **R1.1 (this PR):** shell skeleton + 3-mode discriminated render + topbar with context-aware hamburger + sidebar Sheet drawer + responsive CSS breakpoint fix. No breadcrumbs.
- **R1.2 (next PR):** Breadcrumbs row, route-label map, truncation popover, dynamic resolvers, Playwright spec.

Both ship under R1's review document and the single 60-second smoke pause occurs **after R1.2 lands**.

## Files I will touch (R1.1)

Max 15 enforced. Current count: 9.

| # | File | New / Modify | Purpose |
|---|---|---|---|
| 1 | `apps/web/src/layouts/AppShell.tsx` | NEW | Composer with 3-mode render |
| 2 | `apps/web/src/router/route-classification.ts` | NEW | Extract `RouteKind` + `getRouteKind(routeId)` from router.tsx |
| 3 | `apps/web/src/hooks/useMediaQuery.ts` | NEW | SSR-safe matchMedia hook (used by AppShell + R1.2 breadcrumbs) |
| 4 | `apps/web/src/router.tsx` | MODIFY | Replace inline `<Layout>` with `<AppShell>`; re-export classification |
| 5 | `apps/web/styles.css` | MODIFY | Update `.workspace-grid` breakpoint 980px → 1024px; add `.appshell-*` styles |
| 6 | `apps/web/src/shared.tsx` | MODIFY (minimal) | Add `mode` prop to `Nav` so it omits its own mobile drawer when in workspace mode; AppShell owns the workspace drawer |
| 7 | `apps/web/tests/visual/phase-a-r1-shell.spec.ts` | NEW | 6 viewports × {public, workspace} = 12 frames, login-as helper |
| 8 | `docs/PHASE_A_R1_MEMO.md` | NEW (this file) | Plan lock |
| 9 | `docs/PHASE_A_OUT_OF_SCOPE.md` | NEW | Running log of items deferred mid-R1 |

Doc-only files seeded in this commit (R1.1 memo): `PHASE_A_OUT_OF_SCOPE.md`, `PHASE_A_DECISIONS.md`, `DAY_1.md`. Doc lines do not count against the 300 cap by my reading of the rule; if the user disagrees I'll re-split.

## Risks I see

1. **Nav coupling**: the existing `Nav` (`shared.tsx`) owns its own hamburger + drawer for top nav links. AppShell needs to override Nav's drawer on workspace routes (so the hamburger opens the sidebar Sheet instead). I'll add a `mode?: 'public' | 'workspace' | 'auth_flow'` prop to Nav and gate the drawer render on that. **No copy** — wrap. **Min change to Nav** so it doesn't blow R1.1's line budget.
2. **CSS breakpoint change ripple**: `.workspace-grid`'s 980px breakpoint is referenced (or alluded to) by adjacent rules in styles.css. Risk: changing to 1024px causes layout shift on existing pages at 981–1023px. **Mitigation:** capture before/after screenshots at 1024px viewport; if a page breaks it goes into `PHASE_A_OUT_OF_SCOPE.md`, not into R1.
3. **Logo behavior context-aware**: user spec says logo → /dashboard on WORKSPACE, → / on PUBLIC (logged-out), → /dashboard on PUBLIC (logged-in). This is in the AppShell `Topbar` slot, but the current `Nav.brand` link uses a static `go("home")`. I'll add a `onBrandClick` prop to Nav that AppShell wires per-mode. Low risk.
4. **RTL Sheet `side="right"`**: existing Sheet primitive uses logical `start`/`end`. In RTL, `end` = left. User spec says drawer opens **from right** in RTL. I need to use `side="start"` (which = right in RTL). Verifying via Sheet.tsx (already read — `start` maps to `inset-y-0 start-0`, RTL-correct).
5. **Auth gate**: the current `Layout` redirects unauthenticated workspace visitors to `/login` via useEffect. AppShell must preserve this exactly — same pattern, same skeleton, same race-condition handling. If I drop this, that's a regression. **Mitigation:** copy the useEffect + AuthLoadingSkeleton render path verbatim into AppShell's workspace branch.

## Out of scope for R1.1 (will log if encountered)

- Breadcrumbs (deferred to R1.2)
- Role-specific dashboard widgets (R3)
- @ts-nocheck retirement (R2)
- Touching any individual page component
- Refactoring the existing `Nav` beyond adding the two new props
- New role addition or RBAC change

If I find a bug in `Classroom.tsx` mid-R1, I do **not** fix it — I log it in `docs/PHASE_A_OUT_OF_SCOPE.md` and move on.

## DoD for R1.1

- [ ] `apps/web/src/layouts/AppShell.tsx` exists, exported, replaces inline `Layout` in router.tsx
- [ ] Topbar renders identical content at lg+ (no visible regression — brand, search, theme toggle, notif, user menu)
- [ ] At md (768–1023px) on a workspace route, hamburger opens the role sidebar in a right-anchored Sheet (RTL natural)
- [ ] At md on a public route, hamburger opens the top-nav drawer (existing behavior, preserved)
- [ ] At lg+, sidebar is fixed beside content (no stack-above bug at 981–1023px)
- [ ] Auth gate still redirects unauthenticated workspace visitors to `/login` with the AuthLoadingSkeleton holding state
- [ ] Footer renders only on PUBLIC routes (existing behavior, preserved)
- [ ] No new `@ts-nocheck` anywhere
- [ ] Playwright `tests/visual/phase-a-r1-shell.spec.ts` captures 12 baseline frames
- [ ] `.\scripts\remote.ps1 up` clean boot, `.\scripts\remote.ps1 logs` no errors
- [ ] PR diff ≤ 300 code lines (docs excluded)

## After R1.1 deploys

→ proceed directly to R1.2 (breadcrumbs). Single review doc at the end of R1.2 covers both.
→ **60-second smoke pause to user** comes after R1.2, not after R1.1.
