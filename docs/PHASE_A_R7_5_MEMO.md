# Phase A R7.5 — Memo (Fix chrome-level `aria-valid-attr-value`)

> Second step on the R7 critical path. Single fix in `apps/web/src/shared.tsx` (the hamburger button's ARIA setup) plus an `id` add in `apps/web/src/layouts/AppShell.tsx` (the SheetContent drawer). Diagnostic capture confirmed all 53 critical violations share **exactly one selector** (`#appshell-sidebar-trigger`) and exactly one cause (`aria-controls="appshell-sidebar-drawer"` references an id that doesn't exist in the DOM). One commit clears 53 routes' critical-count.

## Diagnostic summary (from `docs/gate-a-evidence/axe-scan.json` post-R7.6)

| Metric | Value |
|---|---|
| `aria-valid-attr-value` violations | 53 (all of `routes_with_critical` minus 1) |
| Unique offending selectors | **1** — `#appshell-sidebar-trigger` |
| Unique failure summary | "Invalid ARIA attribute value: `aria-controls=\"appshell-sidebar-drawer\"`" |
| Where the trigger lives | `apps/web/src/shared.tsx:212` (Nav component, workspace-mode hamburger added in R6.6) |
| Where the drawer "id" is currently | `apps/web/src/layouts/AppShell.tsx:154` — set as `className="appshell-sidebar-drawer"`, NOT `id` |

The R6.6 commit (Navbar RTL chrome fix) introduced the start-anchored workspace hamburger with `aria-controls="appshell-sidebar-drawer"`. The matching `id` was never set on the drawer; the drawer carries the same name only as a `className`. axe correctly flags this: aria-controls is an IDREF attribute, and the referenced id doesn't resolve.

Even if we add the `id`, there's a second wrinkle: Radix Sheet (built on Dialog primitives) **lazy-mounts** `SheetContent`. When `open={false}` — which is the default state and the state axe scans against — the content is not in the DOM, so the id is unfindable even with the right attribute. That means a naïve `id={...}` add doesn't fix the axe failure on its own; we'd need to either:

1. **Force-mount** the SheetContent and use CSS `visibility: hidden` to hide it (heavy, leaks event listeners, fights Radix's design).
2. **Remove `aria-controls`** entirely and rely on `aria-expanded` + `aria-haspopup="dialog"` to convey the trigger ↔ drawer relationship. This is the modern ARIA Authoring Practices pattern for disclosure widgets.

I picked **Option 2**. Reasons:

- aria-controls is **discouraged by recent ARIA guidance** for trigger-to-popover patterns (https://www.tpgi.com/short-note-on-aria-controls/). The behavior is inconsistently announced by screen readers anyway.
- `aria-expanded={open}` + `aria-haspopup="dialog"` are the canonical pattern Radix recommends + every major SR supports.
- Same number of attributes (2 in, 2 out) — no net surface change.
- The fix is local to the Nav component + a single state-pipe through Nav's props. No Sheet primitive change needed.

## What R7.5 ships

1. **`apps/web/src/shared.tsx`** — `Nav` component changes:
   - Remove `aria-controls="appshell-sidebar-drawer"` from the workspace hamburger button.
   - Add `aria-expanded={isWorkspaceMenuOpen}` (new prop from AppShell).
   - Add `aria-haspopup="dialog"` (static attribute, conveys "activation opens a dialog").
   - Extend `NavProps` with a new optional `workspaceMenuOpen?: boolean` so AppShell can plumb the `sidebarOpen` state down.
2. **`apps/web/src/layouts/AppShell.tsx`** — pipe `sidebarOpen` through Nav:
   - Add `workspaceMenuOpen={sidebarOpen}` to the `<Nav>` render.
   - Also add `id="appshell-sidebar-drawer"` to the `<SheetContent>` for completeness — when the drawer IS open and a screen-reader user is navigating, `aria-owns` / `aria-controls` from other potential references will still resolve. This is defense-in-depth, not the primary fix.
3. **`apps/web/tests/visual/phase-a-r6-6-navbar-rtl.spec.ts`** — the existing spec needs a small tweak: the `aria-controls` assertion (if any) needs to flip to `aria-expanded`. Let me check what R6.6 asserts.

Let me also explicitly NOT touch:
- The `aria-label="منو"` on the hamburger — that stays.
- The `onCloseAutoFocus` callback in AppShell that restores focus to the trigger — that stays (still works regardless of the aria attribute swap).
- The R6.6 layout (hamburger at start edge under RTL) — that stays.

## Why R6.6's spec might already be fine

R6.6's 12 D12 assertions check:
- DOM presence (hamburger visible)
- `html[dir=rtl]` prerequisite
- Viewport position (hamburger in right half)
- No overlap with brand / user-menu
- Click opens the drawer

None of them check `aria-controls` specifically. So removing the attribute shouldn't break the spec. Confirmed by re-reading the file.

But R1.1's existing a11y assertions explicitly check the hamburger's ARIA wiring:

```ts
// From R1.1 spec test 11: "workspace hamburger exposes aria-label + aria-controls"
await expect(hamburger).toHaveAttribute("aria-label", /منو/);
await expect(hamburger).toHaveAttribute("aria-controls", "appshell-sidebar-drawer");
```

That second line WILL fail after R7.5. I need to update the R1.1 spec to assert `aria-expanded` + `aria-haspopup` instead. Two-line change.

## Regression strategy

1. Local `npm run build` clean.
2. Re-run `phase-a-r1-1-appshell` spec — expect 12/13 with the one aria-controls assertion failing.
3. Update the R1.1 assertion (file: `apps/web/tests/visual/phase-a-r1-1-appshell.spec.ts`):
   - Replace `aria-controls="appshell-sidebar-drawer"` check with `aria-expanded` + `aria-haspopup="dialog"` checks.
4. Re-run `phase-a-r1-1-appshell` — expect 13/13 green.
5. Re-run `phase-a-r6-6-navbar-rtl` — expect 12/12 green (no R7.5-specific assertions, regression baseline).
6. Re-run `gate-a-axe-scan` — expect `aria-valid-attr-value` 53 → 0; `routes_with_critical` 54 → 1 (the residual one is `verify-email`'s `label` rule from §2's long-tail).

## Out of scope for R7.5

- **R7.7a/b/c color-contrast cleanup.** Owner-approved (D20) but deferred until after R7.5 + R7.9 measurement re-run lets us see the actual impact size.
- **R7.9 mapper fix.** Next sub-R on the critical path. Independent of R7.5; could in principle run in parallel but D17 ordering says sequential.
- **Other axe rules** (`aria-prohibited-attr`, `button-name`, `label`, `scrollable-region-focusable`, `select-name`, `aria-toggle-field-name`, `nested-interactive`). All collectively contribute ~13 occurrences across ~10 routes — long-tail for R7.7's broader sweep.
- **Touching the Sheet primitive (`apps/web/src/ui/Sheet.tsx`).** Out of scope — we don't need to force-mount or change SheetContent's semantics.
- **Radix `<SheetTrigger>` migration.** Refactoring Nav to use `<SheetTrigger>` (which would auto-wire ARIA) is heavier than the surgical fix and would require restructuring AppShell to host the trigger inside the Sheet tree. Defer to a Phase-B chrome refactor if ever needed.

## DoD for R7.5

- [ ] Memo committed first (this file)
- [ ] `shared.tsx` Nav: drop `aria-controls`, add `aria-expanded` + `aria-haspopup` (state plumbed from AppShell)
- [ ] `AppShell.tsx`: add `workspaceMenuOpen={sidebarOpen}` + `id` on SheetContent
- [ ] `phase-a-r1-1-appshell.spec.ts`: assertion update (aria-controls → aria-expanded + aria-haspopup)
- [ ] Local `npm run build` clean
- [ ] R1.1 spec 13/13 green
- [ ] R6.6 spec 12/12 green
- [ ] gate-a-axe-scan: `aria-valid-attr-value` 53 → 0, `routes_with_critical` 54 → 1 (or close)
- [ ] Review doc written with before/after axe-scan delta + the new ARIA pattern explained
- [ ] D13 manual smoke pause for owner (3 random routes + keyboard tab on hamburger)
- [ ] R7.9 does not start until owner D13 acks R7.5

## Budget

| Component | Est. lines |
|---|---|
| `apps/web/src/shared.tsx` (NavProps + button attributes) | ~10 lines |
| `apps/web/src/layouts/AppShell.tsx` (prop + id) | ~3 lines |
| `apps/web/tests/visual/phase-a-r1-1-appshell.spec.ts` (assertion update) | ~5 lines |
| `docs/PHASE_A_R7_5_MEMO.md` (this file) | ~140 lines |
| `docs/PHASE_A_R7_5_REVIEW.md` | ~80 lines |
| **Total** | **~240 lines** |

Comfortably under the 300-line target. No code/test split.
