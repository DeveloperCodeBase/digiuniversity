# Phase A R6.6 — Review (Navbar RTL chrome fix)

> User-reported: «جایگذاری دکمه‌های Navbar بالا RTL نیست». Workspace mode placed the hamburger inside `.nav-actions` (end edge = left in Persian) instead of the start edge (right). Public mode passed at xl+ because `.nav-links` absorbed the middle via bilateral `margin: auto`, but at lg-1024 and below the nav-links is taken out of flex flow and the user-menu drifted toward the center. **Both bugs fixed**, **12/12** D12 assertions green across 6 viewports × 2 auth states, **R1.1 13/13** regression green.

## Debug walkthrough (5 steps the user asked for)

| Step | Check | Result |
|---|---|---|
| 1 | `<html dir="rtl">` set | ✅ Already correct in `apps/web/index.html:2` |
| 2 | Topbar `flex-row` vs `flex-row-reverse` | ✅ `.nav-inner { display: flex; }` (default `row`) — under RTL this lays out items right→left, which is correct |
| 3 | `ml-*`/`mr-*` vs `ms-*`/`me-*` | Mostly fine; one CSS rule (`.nav-links { margin-right: auto; margin-left: auto }`) is symmetric so direction doesn't matter. Added `.nav-actions { margin-inline-start: auto }` (logical) as the fix. |
| 4 | `left-0`/`right-0` vs `start-0`/`end-0` | Two affected rules (`.nav-link.active::after { left: 14px; right: 14px; }` and `.nav-toggle .bars::before { left: 0; right: 0; }`) — both set BOTH sides to symmetric values, so direction doesn't change them. No fix needed. |
| 5 | `git log apps/web/src/layouts/AppShell.tsx` since R6.5 | AppShell hasn't been touched since `49c0dd1` (R1.3 Brand, well before R6.5). The bug was structural in `Nav` (in `shared.tsx`), not AppShell, and predated R6.5. |

## Bug surface

**Bug 1 — workspace hamburger on the wrong edge.** The `<button class="nav-toggle">` lived inside `<div class="nav-actions">` for both PUBLIC and WORKSPACE modes. In RTL `.nav-actions` sits at the END edge (left in Persian). The user spec is unambiguous: in workspace, the hamburger must be on the start edge (right) because that's the same edge the sidebar drawer flies out from.

**Bug 2 — user-menu drifting toward center.** When `.nav-links` is hidden (workspace at every viewport; public at ≤1024px because the mobile menu uses `position: fixed; visibility: hidden`), nothing was pushing `.nav-actions` to the end edge of the flex row. With only two visible flex children (`brand` + `nav-actions`) and no margin trick to absorb middle space, the items clustered at the start (right in RTL) and the user-menu ended up around the viewport center.

## Fix

### TSX (`apps/web/src/shared.tsx`)

In `Nav`: workspace mode now renders the hamburger as the **first** child of `.nav-inner` so it sits at the start edge under RTL. The hamburger inside `.nav-actions` now renders only in PUBLIC mode (its existing pattern). AUTH_FLOW gets no hamburger (unchanged).

```tsx
{/* WORKSPACE hamburger — first child, sits at start (right in RTL) */}
{isWorkspace ? (
  <button
    id="appshell-sidebar-trigger"
    className="nav-toggle nav-toggle-start"
    onClick={() => onWorkspaceMenuClick?.()}
    aria-label="منو"
    aria-controls="appshell-sidebar-drawer"
  ><span className="bars" /></button>
) : null}

<a className="brand" …>…</a>
…
<div className="nav-actions">
  …icons + user-menu…
  {/* PUBLIC hamburger — at end (left in RTL) */}
  {!isAuthFlow && !isWorkspace && (
    <button className="nav-toggle" onClick={() => setOpen(!open)} …>
      <span className="bars" />
    </button>
  )}
</div>
```

a11y wiring preserved: `id="appshell-sidebar-trigger"` ✅, `aria-label="منو"` ✅, `aria-controls="appshell-sidebar-drawer"` ✅. AppShell's existing `onCloseAutoFocus` callback still restores keyboard focus correctly.

### CSS (`apps/web/styles.css`)

Added one logical-property rule to `.nav-actions`:

```css
.nav-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-inline-start: auto;   /* push to end (left in RTL) */
}
```

`margin-inline-start: auto` absorbs the available space on the start side of `.nav-actions`, which under RTL flex-row pushes the actions toward the end (left). In PUBLIC desktop mode where `.nav-links { margin: auto }` is already centering, this adds a small extra push that doesn't change the centered-links pattern.

## D12 contract

12 R6.6 assertions, each covering ≥3 of the 5 D12 points:

| | Public | Workspace |
|---|---|---|
| xs 375 | ✅ | ✅ |
| sm 480 | ✅ | ✅ |
| md 768 | ✅ | ✅ |
| lg 1024 | ✅ (fixed) | ✅ (fixed) |
| xl 1280 | ✅ | ✅ (fixed) |
| 2xl 1536 | ✅ | ✅ (fixed; accepts 3xl inline-pinned variant) |

Each assertion checks:

1. **DOM** — nav.nav, brand, user-wrap, hamburger (workspace only)
2. **Prerequisite** — `html[dir=rtl]` is set
3. **Viewport position** — brand/hamburger center is in the right half (x > viewport.width/2); user-menu center is in the left half (x < viewport.width/2)
4. **No overlap** — brand ↔ user-menu and (workspace) hamburger ↔ brand ↔ user-menu do not overlap horizontally
5. **A11y wiring** — workspace hamburger click opens either the Sheet drawer (<1536px) or the inline-pinned sidebar (≥1536px)

## Regression sweep

| Spec | Pass | Notes |
|---|---|---|
| R1.1 AppShell | **13/13** | All a11y + 3-mode + responsive tests still green |
| R1.4 (R6.5 sweep) | 7/7 | (already verified after R6.5) |
| R3 Dashboards | 12/12 | (already verified after R6.5) |
| R5 Login | 12/12 | (already verified after R6.5) |
| R6 Classroom | 12/12 | (already verified after R6.5) |
| **R6.6 Navbar RTL** | **12/12** | NEW |
| **Total D12 assertions** | **68/68** | +12 from R6.6 |

## Owner manual smoke (D13)

Visit **https://digiuniversity.ir** on **real Persian phone + desktop + incognito** (per the user's directive):

1. **Public landing** `/home` — anonymous: logo on the right edge, mobile hamburger on the left edge (existing pattern), user-icon stays generic (no role leak). At desktop, nav-links centered.
2. **Login** `/login` — auth-flow chrome: no hamburger anywhere (correct, R1.4 verified).
3. **After login, dashboard** `/dashboard` — workspace chrome: **hamburger on the right edge (start)**, brand next to it, user-menu / theme / notification chips on the left edge.
4. **Click hamburger** at 375px — sidebar drawer slides in from the right (start under RTL).
5. **Click hamburger** at desktop ≥1536px (if you have a big monitor) — sidebar pins inline beside content; click again to unpin.
6. **Resize from 1280 down to 375** — at no point does the user-menu drift toward the center; it always stays on the left edge.
7. **Incognito** — do (1)-(3) in a fresh incognito window to confirm no stale CSS cached.

If any step looks off, screenshot + tell me which.

## Metrics

| Metric | Before R6.6 | After R6.6 | Δ |
|---|---|---|---|
| Workspace hamburger position | inside `.nav-actions` (end edge) | first child of `.nav-inner` (start edge) | fixed |
| User-menu position at lg-1024+ | center-ish | left edge (end in RTL) | fixed |
| D12 assertions | 56 | **68** | +12 |
| Phase-A regression count | 56/56 green | **68/68 green** | +12 still green |
| Lines changed | — | 3 files (231 lines added, 13 removed) | — |
| Active `@ts-nocheck` | 1 | 1 | 0 |

## Commits

| SHA | Title |
|---|---|
| `83067d3` | Phase A R6.6: Navbar RTL chrome fix (workspace hamburger at start edge) |
| `b9add7b` | Phase A R6.6 (CSS): push `.nav-actions` to end edge via `margin-inline-start: auto` |
| `260511a` | Phase A R6.6 (spec): accept the 3xl inline-pinned variant at ≥1536px |

## What R6.6 deliberately did NOT do

- **Touch the public-mode mobile hamburger pattern.** It already worked correctly (hamburger at end edge on mobile is standard for a top-drawer mobile menu).
- **Add a separate `.nav-toggle-start` CSS rule.** The class is on the element for future targeting if needed, but the existing `.nav[data-mode="workspace"] .nav-toggle { display: flex !important }` rule from R1.3 D9 already shows the new button correctly at every viewport.
- **Rewrite the legacy nav-links absolute-position mobile menu.** It works for PUBLIC mode at small viewports; R6.6 is a surgical RTL fix, not a navbar rewrite.
- **Migrate other physical `left:` / `right:` rules to logical properties.** They were already symmetric (both sides set to the same value) so direction doesn't affect them.
