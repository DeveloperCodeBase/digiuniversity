# Phase A R7.5 — Review (Fix chrome-level `aria-valid-attr-value`)

> Second sub-R on the R7 critical path. **100% within-scope success**: 53 of 53 `aria-valid-attr-value` violations cleared with one ARIA-attribute swap on a single button. Routes with ≥1 critical violation dropped from **54 → 6** (a 48-route improvement). The 6 residuals are exactly the R7.7 long-tail items predicted in the R7.5 memo. R6.6 + R1.1 specs both green after the assertion update. R7.9 unblocked per D17 once owner D13 acks.

## What shipped

| Commit | Files | Notes |
|---|---|---|
| `2272e20` | memo | Plan locked before code |
| `b1dfee7` | 3 files | Nav ARIA swap + AppShell prop plumb + R1.1 spec update |

## The fix

**Root cause (verified by diagnostic capture in axe-scan.json):** every workspace route's critical violation traced to a **single selector** — `#appshell-sidebar-trigger` — with **one failure** — `aria-controls="appshell-sidebar-drawer"` referencing an id not in the DOM.

Two compounding issues:
1. The Sheet's `SheetContent` carried the name as `className`, not `id`.
2. Radix Sheet lazy-mounts content; when `open={false}` (the default, scan-time state), the drawer isn't in the DOM at all.

**The swap:**

```diff
-  aria-controls="appshell-sidebar-drawer"
+  aria-expanded={workspaceMenuOpen}
+  aria-haspopup="dialog"
```

This is the canonical ARIA disclosure-widget pattern (the same one Radix's `<SheetTrigger>` wires automatically — we couldn't use it here because the trigger lives in `Nav` while the Sheet lives in `AppShell`, two different sub-trees). It's also recommended by the ARIA Authoring Practices Guide over `aria-controls`, which modern accessibility guidance considers low-value-with-high-friction.

**Defense-in-depth:** added `id="appshell-sidebar-drawer"` to `SheetContent` so any future reference resolves correctly when the drawer is open. Not strictly required by R7.5's fix, but cheap and forward-compatible.

**State plumbing:** `Nav` accepts a new optional `workspaceMenuOpen?: boolean` prop. `AppShell` passes `sidebarOpen` through. Default `false` keeps Nav backward-compatible for any non-AppShell caller.

## axe-scan delta — exactly as predicted

| Metric | Before R7.5 | After R7.5 | Δ |
|---|---|---|---|
| `routes_with_critical` | 54 | **6** | **−48** ✅ |
| `routes_with_serious` | 64 | 64 | 0 (color-contrast — R7.7's job) |
| `routes_clean` | 2 | 2 | 0 (page-disposal race, R7.8) |
| `aria-valid-attr-value` rule fires | 53 | **0** | **−53** ✅ |
| `button-name` | 2 | 2 | 0 (R7.7 long-tail) |
| `label` | 2 | 2 | 0 (R7.7 long-tail) |
| `select-name` | 2 | 2 | 0 (R7.7 long-tail) |

### Remaining 6 critical routes (R7.7 long-tail)

| Route | Critical rule | Notes |
|---|---|---|
| `/admin` | `button-name` | Icon-only button somewhere on the admin setup wizard lacks `aria-label` |
| `/research` | `button-name` | Same shape — icon button on the research library card |
| `/verify-email` | `label` | A form field on the verify-email page is missing an associated `<label>` |
| `/settings` | `label` | Same shape — a settings input is unlabeled |
| `/analytics` | `select-name` | A `<select>` element without `<label>` or `aria-label` |
| `/recordings` | `select-name` | Same shape — recordings filter select |

These 6 are **out of R7.5 scope** (not chrome bugs; per-page form/button bugs) and queued for **R7.7 long-tail** alongside the color-contrast remediation per D20.

## R6.6 + R1.1 regression — 25/25 green

R6.6 (12/12) — no R7.5-specific assertions; baseline regression confirms the ARIA swap doesn't break the layout.

R1.1 (13/13) — test #11 ("workspace hamburger ARIA") updated to assert the new pattern:
- `aria-label="منو"` ✅ (unchanged)
- `aria-haspopup="dialog"` ✅ (new)
- `aria-expanded` starts `false`, click flips to `true` ✅ (new)
- `aria-controls` is **absent** ✅ (regression guard against any future code re-adding it)

The Escape-restores-focus a11y test still passes — `onCloseAutoFocus` in AppShell uses `document.getElementById("appshell-sidebar-trigger").focus()`, which is unaffected by the ARIA changes.

## D12 regression after R7.5

| Spec | Pass |
|---|---|
| R1.1 AppShell | 13/13 (with updated test #11) |
| R5 Login | 12/12 (not re-run this round; touched only Nav workspace mode) |
| R6 Classroom | 12/12 (not re-run; same scope) |
| R6.6 Navbar RTL | 12/12 |
| **Total verified after R7.5** | **25/25 of the touched-or-adjacent specs** |

R5 and R6 weren't re-run because R7.5 touched only Nav's workspace mode + AppShell's Sheet content; the login and classroom shells are independent. The full 49/49 Phase-A baseline (R1.1 + R5 + R6 + R6.6) is presumed green from R7.6's regression sweep.

## Owner manual smoke — D13 checklist for R7.5

Per the user's R7.5 sequencing directive, before R7.9 starts:

1. **3 random workspace routes** — visit e.g. `/dashboard`, `/super`, `/settings`. Click the hamburger (top-right under RTL) at each. Drawer slides in from the right edge. Click again to close. Nothing should look different from before R7.5 — the change is invisible to sighted users.
2. **Keyboard navigation on hamburger** — load `/dashboard`. Tab from the top of the page until the hamburger gets focus (should be near the start of the tab order in workspace mode). Press Enter or Space — drawer opens. Tab through the drawer items — focus should stay inside the drawer (Radix manages focus-trap automatically). Press Escape — drawer closes, focus returns to the hamburger (verified by R1.1 test #12 + R7.5 onCloseAutoFocus).
3. **Screen reader (optional, if owner uses one)** — VoiceOver/NVDA on a workspace route, focus the hamburger. Should announce "منو, button, collapsed, has popup, dialog". Click — "expanded". Better than the pre-R7.5 announcement of "controls appshell-sidebar-drawer" (which referenced a non-existent element).
4. **Mobile + incognito** — confirm the above on a real device.

If anything looks/sounds off, screenshot + tell me. If all four pass, R7.9 starts.

## Status

- R7.5 ships ✅ within-scope target 100% cleared (53 → 0 aria-valid-attr-value violations).
- 6 residual critical routes are R7.7 long-tail (button-name × 2, label × 2, select-name × 2) — owner already approved R7.7d as audit-first per D20.
- 64 serious violations unchanged — color-contrast is R7.7a/b/c's job.
- R1.1 spec updated to match the new ARIA pattern; 13/13 green.
- R6.6 spec 12/12 green (regression baseline).
- R7.9 (apiRoleToLocal + D18 sentinel) is the next sub-R per D17 ordering, blocked on owner D13 ack of R7.5.

## Next

Awaiting owner D13 ack on R7.5. After ack:

- R7.9 starts (memo first per workflow): complete `apiRoleToLocal` (3 → 10 roles), extract to shared `apps/web/src/auth/role-map.ts`, write `gate-a-role-routing.spec.ts` with `ROLE_DISTINCTIVE` sentinel per role per D18/D21. Scope expanded ~50% from the original 0.5d → 1d to absorb the spec extension.

After R7.9 ships, the critical-path measurement re-run kicks off (§1 a11y + §2 + §5).

— Phase A author, 2026-05-23. R7.5 shipped, awaiting D13 smoke.
