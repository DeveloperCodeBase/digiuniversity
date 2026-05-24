# Phase A R7.12 — Memo (Mini-variant persistent sidebar)

> Per D23 (owner scope addition) + D25 (sequential ordering acked, 3 risks ack'd). Replaces the workspace Sheet-drawer pattern with a Material Design Mini-variant Drawer: persistent rail at ≥1024px that toggles between a 72px icon-only "mini" mode and a 280px expanded mode. <1024px keeps the R6.6 Sheet drawer overlay (mobile pattern unchanged). The R1.3-D9 "hamburger drawer everywhere" rule is **partially superseded** — superseded only on ≥1024px; <1024px stays.
>
> **No code yet.** This memo is the contract. Owner reviews + acks before R7.12 code starts.

## Owner reference

Material Design Mini-variant Drawer pattern: https://mui.com/material-ui/react-drawer/#mini-variant-drawer

Owner specifications (D23, verbatim):
- ≥1024px: persistent navigation that changes its width
- Resting state: mini-drawer at same elevation as content, clipped by app bar
- When expanded: standard persistent navigation drawer
- Default state: collapsed (mini) — user sees icons first, then expands
- Per-user persistence: localStorage `digiu_sidebar_pref` extended from `"open" | "closed"` to `{ mode: "mini" | "expanded" }`
- Clipped by app bar: navbar (app bar) stays full-width; sidebar begins below it
- Same elevation as content: no shadow, `z-index = content`

## Risks acknowledged by owner per D25

Recorded here in the memo (per owner directive) so any future contributor reading R7.12 understands what was on the table before code started:

### Risk 1 — Architecture rewrite (Sheet drawer → persistent rail). ✅ Acknowledged.

The current sidebar architecture (R6.6 final state) uses Radix Sheet:
- **Lazy-mounted** — `SheetContent` is added to the DOM only when `open={true}`.
- **Overlay** — when open, sits above content with z-index above the topbar; backdrop blurs underlying content.
- **Dismiss on outside-click** — Radix Dialog primitive's default behavior.
- **Width = fixed** — no animation between size variants; either 320px (mobile drawer) or fully unmounted.

R7.12 replaces this with a persistent rail (at ≥1024px):
- **Always in DOM** — the rail is always mounted; visibility is controlled by width animation, not mount/unmount.
- **In-flow** — sits in the workspace grid layout, not as an overlay. Content area resizes when sidebar resizes.
- **No dismiss** — outside-click does nothing; the toggle is the only way to switch between mini and expanded.
- **Width animated** — `transition: inline-size 200ms cubic-bezier(0.16, 1, 0.3, 1)` between 72px (mini) ↔ 280px (expanded).

This is **not a tweak** — it's a structural change to how AppShell wires the workspace. The current `Sheet` import in AppShell is replaced with a custom `MiniRail` component that manages its own width state. R1.3-D9 (hamburger toggle on every viewport) becomes a viewport-conditional rule: the hamburger is the toggle on <1024px (unchanged); on ≥1024px the toggle moves to within the rail or to a chevron button on the rail's start-edge boundary.

### Risk 2 — Content margin audit per workspace route. ✅ Acknowledged.

Today, workspace route content runs full-viewport-width below the topbar (the Sheet drawer overlays on top when open; content doesn't reflow). After R7.12, content must respect the rail's footprint:

- At ≥1024px when rail is **mini**: content gets `margin-inline-start: 72px` (or sits in a CSS grid column that's `1fr` next to the rail's 72px column).
- At ≥1024px when rail is **expanded**: content gets `margin-inline-start: 280px`.
- At <1024px (Sheet drawer mode): content runs full-width as today (no margin reservation; the Sheet overlays).

**Audit work needed:** every workspace route's top-level content container needs to check it can shrink gracefully when the rail goes from 72px to 280px and back. Cases that could break:
- Pages with `width: 100vw` somewhere (uncommon but check Catalog / Library / any landing-page-flavored workspace surface).
- Pages with fixed-width hero canvases (the R6 classroom slide is the most visually-rich; needs verification at all 4 width-states: <1024 + ≥1024 × mini + ≥1024 × expanded).
- Pages with horizontal-overflow tables (Audit log, Analytics) — they need to scroll inside their column, not break out.
- Pages with `position: fixed` overlays (the AI Tutor FAB exists per Master Runbook §AI Tutor; verify it stays inside the content column or moves with the rail).

R7.12 ships **content-margin reservation at the AppShell level** (the workspace `<main>` gets `margin-inline-start: var(--rail-width)`) so individual pages don't each carry the responsibility. The audit is to confirm no page breaks under that constraint.

### Risk 3 — Baseline reset for R1.1 / R3 / R6 / R6.6 specs. ✅ Acknowledged.

R1.1 (13) / R3 (12) / R6 (12) / R6.6 (12) = 49 D12 assertions tested against the current workspace chrome. R7.12 changes:
- **R1.1** — workspace `<lg`: hamburger visible (unchanged). Workspace `≥lg`: rail visible inline (NEW — was hamburger). 9 of 13 assertions still pass (the auth-flow + public + a11y + skip-link ones); 4 are affected (the workspace responsive ones).
- **R3** — 10 role dashboards' KPI strips render in the content column instead of full-viewport. Layouts likely fine, but every dashboard's bounding box shifts horizontally. Snapshot diff > 1% expected.
- **R6** — classroom workspace has its own scoped shell (`.r6-classroom-shell`) but mounts inside AppShell's workspace area. The slide canvas + AI panel layout WILL change because the available width is now `viewport - rail-width`. Snapshot diff > 1% expected.
- **R6.6** — hamburger at start-edge under RTL. At <1024px (Sheet drawer mode) this stays; at ≥1024px the hamburger relocates (into the rail or onto a chevron). Spec needs new assertions for the rail variant.

**Baseline update plan:** every affected D12 spec re-runs with `UPDATE_BASELINES=1` set in the visual docker. The R7.12 review doc gets an explicit **"baseline reset" section** listing per-spec:
- Number of snapshots updated
- Diff percentage per snapshot (computed via the existing playwright snapshot comparator)
- Reason: "chrome architecture change per D23 + D25; mini-rail replaces Sheet overlay at ≥1024px"

If any non-architectural visual regression appears in a baseline diff (e.g., a color token shift, a font drift, a positional bug), it gets a separate R7.12-fix sub-commit BEFORE the new baselines are accepted.

## Architecture diagram (before / after)

### Before (current state, post-R6.6 + R7.5 + R7.6 + R7.9)

```
┌────────────────────────────────────────────────────────────────┐
│  topbar (sticky, full-width)                                   │
│  [≡ hamburger] [brand]              [user-menu, theme, search] │
└────────────────────────────────────────────────────────────────┘
                                                                  
┌────────────────────────────────────────────────────────────────┐
│  workspace content (full width below topbar)                   │
│  e.g. /dashboard, /super, /classroom, …                        │
│                                                                │
│  Sheet drawer (when open, overlays from start edge):           │
│  ┌──────────────────┐                                          │
│  │ side-nav (320px) │  ← LAZY-MOUNTED, OVERLAY, BACKDROP       │
│  │ — role items —    │     dismiss on outside-click             │
│  │ — group headers — │     z-index above content + topbar      │
│  └──────────────────┘                                          │
└────────────────────────────────────────────────────────────────┘
```

### After (R7.12, ≥1024px)

```
┌────────────────────────────────────────────────────────────────┐
│  topbar (sticky, full-width — APP BAR, "clips" the rail)       │
│  [brand]                            [user-menu, theme, search] │
│                                                                │
│  (no hamburger in workspace at ≥1024px; toggle lives in rail)  │
└────────────────────────────────────────────────────────────────┘

┌──────┬─────────────────────────────────────────────────────────┐
│ rail │  workspace content                                      │
│ 72px │  (margin-inline-start: 72px in mini, 280px in expanded) │
│      │                                                         │
│ ─── │  e.g. /dashboard, /super, /classroom, …                 │
│ [≡]  │                                                         │
│      │  Always-in-DOM rail. Width animates via                 │
│ ─── │  `inline-size 200ms` between 72px ↔ 280px.              │
│ icon │                                                         │
│ icon │  Same z-index as content (sits in workspace grid).     │
│ icon │  No shadow, no overlay, no dismiss.                    │
│ icon │                                                         │
└──────┴─────────────────────────────────────────────────────────┘
```

### After (R7.12, <1024px — UNCHANGED from R6.6)

```
┌────────────────────────────────────────────────────────────────┐
│  topbar (sticky, full-width)                                   │
│  [≡ hamburger] [brand]              [user-menu, theme, search] │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  workspace content (full width below topbar)                   │
│  Sheet drawer overlay when hamburger tapped (R6.6 behavior).   │
└────────────────────────────────────────────────────────────────┘
```

## Viewport behavior matrix

| Viewport | Chrome | Default state | Toggle | Notes |
|---|---|---|---|---|
| <1024px (mobile / small tablet) | Sheet drawer overlay | closed | hamburger in topbar (start edge under RTL, per R6.6) | Unchanged from R6.6. R1.3-D9 still holds here. |
| ≥1024px (desktop / large tablet) | Persistent rail | mini (72px) | chevron in rail top (or rail bottom — see implementation outline d) | NEW. R1.3-D9 superseded HERE only. |

The 1024px breakpoint matches existing R1.1 / R6.6 conventions (workspace-grid threshold) so no new media-query boundaries are introduced.

## State mechanism

`localStorage` key `digiu_sidebar_pref` is extended:

```ts
// BEFORE (R1.3-D9 + R7.5):
type SidebarPref = "open" | "closed";   // boolean-y

// AFTER (R7.12):
interface SidebarPref {
  mode: "mini" | "expanded";
  // mobile drawer state (<1024px) stays ephemeral; we don't persist
  // it because users expect mobile drawers to default-close on every
  // page entry, not remember.
}

// Migration: existing values map:
//   "open"    → { mode: "expanded" }
//   "closed"  → { mode: "mini" }
//   <invalid> → { mode: "mini" }   (the R7.12 default)
```

Read on AppShell mount:
```ts
const initial: SidebarPref = (() => {
  try {
    const raw = localStorage.getItem("digiu_sidebar_pref");
    if (!raw) return { mode: "mini" };
    if (raw === "open") return { mode: "expanded" };
    if (raw === "closed") return { mode: "mini" };
    const parsed = JSON.parse(raw);
    return parsed?.mode === "expanded" ? { mode: "expanded" } : { mode: "mini" };
  } catch {
    return { mode: "mini" };
  }
})();
```

Write on toggle:
```ts
React.useEffect(() => {
  try {
    localStorage.setItem("digiu_sidebar_pref", JSON.stringify(sidebarPref));
  } catch {
    /* private browsing / quota — non-fatal */
  }
}, [sidebarPref]);
```

`useEffect` runs whenever the user toggles between mini ↔ expanded. Next visit, the rail starts in the same mode.

## Elevation contract

| Surface | z-index | Shadow | Position |
|---|---|---|---|
| topbar (`.nav`) | 1000 (existing) | scroll-shadow only (R1.3 B1) | sticky top |
| **rail (R7.12)** | matches content (5 or unset; sticky position) | **none** | sticky top below topbar, in-flow |
| Sheet drawer (<1024px mobile) | 51 (Radix-managed) | drop-shadow per Radix default | fixed overlay |
| AI FAB | 25 (existing) | drop-shadow | fixed bottom-end |
| dropdown / popover | 1100 (existing) | drop-shadow | floating |
| scroll-progress | 1200 (existing) | none | fixed top |

The rail is the only "chrome-like" surface that sits **at the same elevation as content** rather than above it. This matches MUI's Mini-variant Drawer reference per D23.

Implementation: rail uses `z-index: auto` (or 5 if a specific stacking-context bug emerges) + `box-shadow: none`. The clip-by-app-bar effect is purely CSS positioning — rail's `top` is set to `var(--topbar-h, 64px)` so it sits below the topbar's bottom edge.

## Implementation outline

### a) AppShell layout change

`apps/web/src/layouts/AppShell.tsx`:
- Workspace mode at ≥1024px renders a CSS grid: `grid-template-columns: var(--rail-width) 1fr` instead of the current single-column layout.
- `--rail-width` CSS variable on the workspace root: `72px` (mini) / `280px` (expanded). Driven by a `data-rail-mode` attribute on the `<div>`.
- `<MiniRail>` component (new) replaces the `<Sheet><SheetContent>` block at ≥1024px.
- At <1024px the Sheet remains; `<MiniRail>` is hidden via media query.

```tsx
// Pseudo-shape
<div
  className="appshell-workspace"
  data-rail-mode={sidebarPref.mode}
  style={{ "--rail-width": sidebarPref.mode === "expanded" ? "280px" : "72px" } as React.CSSProperties}
>
  {isWideViewport && (
    <MiniRail
      mode={sidebarPref.mode}
      onToggle={() => setSidebarPref({ mode: sidebarPref.mode === "mini" ? "expanded" : "mini" })}
      go={go}
      active={routeId}
    />
  )}
  <main className="appshell-content">{children}</main>
</div>

{!isWideViewport && (
  <Sheet open={sidebarOpen} onOpenChange={setSidebarOpenWithPersist}>
    <SheetContent id="appshell-sidebar-drawer" /* …existing R7.5 props… */>
      <RoleSideNav active={routeId} go={go} />
    </SheetContent>
  </Sheet>
)}
```

`isWideViewport` comes from a `useMediaQuery("(min-width: 1024px)")` hook (already exists in the codebase per R1.1's `useMediaQuery.ts`).

### b) RoleSideNav: dual-mode rendering

`apps/web/src/sidenav.tsx`:
- Accept a new optional `mode?: "mini" | "expanded"` prop. Default `expanded` (so existing non-AppShell callers don't break — Sheet drawer always uses expanded).
- In **mini** mode: render only icon + a `<span className="visually-hidden">{t}</span>` for screen readers. `<a>` element gets `title={t}` so a hover tooltip fires (native browser tooltip — no extra JS for the simple variant; if owner wants Radix Tooltip later, that's a follow-up).
- In **expanded** mode: render icon + label as today.
- Group headers (`{ h: "..." }`) hidden in mini (would clutter a 72px column); shown in expanded.

```tsx
// In RoleSideNav body
{groups.map((g, gi) => (
  <React.Fragment key={gi}>
    {g.h && mode === "expanded" && <h6>{g.h}</h6>}
    <ul>
      {g.items.map((it) => (
        <li key={it.id}>
          <a
            href={"/" + it.id}
            className={active === it.id ? "active" : ""}
            aria-current={active === it.id ? "page" : undefined}
            title={mode === "mini" ? it.t : undefined}  // tooltip in mini
            onClick={(e) => { e.preventDefault(); go(it.id); }}
          >
            <Icon name={it.ic} size={14} />
            {mode === "expanded" ? it.t : <span className="visually-hidden">{it.t}</span>}
          </a>
        </li>
      ))}
    </ul>
  </React.Fragment>
))}
```

### c) Toggle button placement

Two reasonable positions for the mini ↔ expanded toggle:
1. **Top of rail** — chevron icon button anchored to rail's top, just below topbar.
2. **Within rail** — a row at the top with `aria-label="باز/بستن منو"` and a chevron icon.

MUI's reference puts the toggle at the rail's bottom (above the user/account section), but our design doesn't have a bottom account section in the rail itself (user-menu lives in topbar). **Choosing position 1 (top)** for simplicity and to match the "first thing visible in the rail" UX expectation.

In expanded mode the chevron points start-ward (toward closing); in mini mode it points end-ward (toward opening). RTL-aware: under `dir="rtl"` the chevron-end-ward visual = left arrow, chevron-start-ward = right arrow.

### d) Persistence wiring

In AppShell:
```tsx
const [sidebarPref, setSidebarPrefState] = React.useState<SidebarPref>(initial);

const setSidebarPref = React.useCallback((next: SidebarPref) => {
  setSidebarPrefState(next);
  try {
    localStorage.setItem("digiu_sidebar_pref", JSON.stringify(next));
  } catch {}
}, []);
```

### e) Mobile (<1024px) fallback

Unchanged from R6.6. At <1024px:
- `<MiniRail>` not rendered (display:none via media query and/or conditional mount via `isWideViewport`).
- `<Sheet>` + hamburger trigger render exactly as today.
- localStorage `digiu_sidebar_pref` is still read/written but only affects ≥1024px behavior.

## D12 spec — `tests/visual/phase-a-r7-12-mini-rail.spec.ts`

6 viewports × 3 states = 18 frame assertions:

| Viewport | State |
|---|---|
| xs-375  | mobile drawer (closed) |
| sm-768  | mobile drawer (closed) |
| md-1023 | **mobile drawer** (BREAKPOINT — must NOT show rail at 1023) |
| lg-1024 | **rail (mini)** (BREAKPOINT — must show rail at 1024) |
| xl-1280 | rail (mini) |
| xl-1280 + expanded | rail (expanded) |
| 2xl-1536 | rail (mini) |

Plus tests for state transitions:
- localStorage `{ mode: "mini" }` → loads in mini at ≥1024
- localStorage `{ mode: "expanded" }` → loads in expanded at ≥1024
- Toggle: starting mini, click chevron → width animates to 280px; click again → back to 72px
- Content margin: at ≥1024, `<main>` has `margin-inline-start` matching the rail width (computed via getComputedStyle).
- a11y: in mini mode, sidebar items have `title={role-item-label}` AND `<span className="visually-hidden">{label}</span>` (screen reader still gets the label).
- Persistence: toggle to expanded → reload page → still expanded.

D12 5-point coverage per frame:
1. **DOM**: rail / sheet / hamburger present per viewport
2. **Computed style**: `--rail-width` resolves to 72 or 280; `margin-inline-start` on `<main>` matches
3. **Viewport position**: rail's `x` at the start edge under RTL; `<main>` shifted accordingly
4. **No overlap**: rail and content do not horizontally overlap; rail and topbar do not vertically overlap (topbar clips rail from above)
5. **Baseline**: snapshot diff < 0.1% AFTER baseline reset (a one-time accepted reset; subsequent runs gate on the new baseline)

## Regression strategy (per D25 Risk 3)

Before R7.12 lands, every existing visual spec that runs on workspace routes will diff against current baselines. After R7.12 lands, those diffs WILL exceed the 1% threshold because the chrome restructures the workspace layout. The plan:

1. R7.12 code lands on a branch (or on main, if owner prefers — owner's call).
2. Run each affected spec **without** `UPDATE_BASELINES=1` first — capture the diff percentages per snapshot.
3. **Inspect the diffs.** Goal: confirm all diff content is "the chrome moved as expected", not "something colored / overflowed / mis-aligned unexpectedly".
4. If diffs are clean (only the architectural shift visible), set `UPDATE_BASELINES=1` and re-run to capture new baselines.
5. If diffs show an unexpected secondary regression (e.g., a color bug, an overflow), STOP and ship a R7.12-fix sub-commit BEFORE accepting the new baselines.
6. Review doc documents per spec: `frame count updated`, `diff % range`, `reason: chrome architecture change per D23 + D25`.

Affected specs:
- `phase-a-r1-1-appshell.spec.ts` — 13 assertions; ~6 use workspace routes; expected baselines: 6 updated.
- `phase-a-r3-dashboards.spec.ts` — 12 assertions; all workspace; expected baselines: 12 updated.
- `phase-a-r6-classroom.spec.ts` — 12 assertions; all workspace (classroom is workspace-mode); expected baselines: 12 updated.
- `phase-a-r6-6-navbar-rtl.spec.ts` — 12 assertions; 6 workspace; expected baselines: 6 updated. PLUS spec additions to cover the rail variant at ≥1024px (new assertions, new baselines).
- `gate-a-role-routing.spec.ts` — 10 assertions; all workspace; the sidebar-sentinel check needs to be adapted: today it asserts the Sheet-drawer sidebar contents; under R7.12 ≥1024 it asserts the rail's contents instead. **Two-mode assertion** in the spec.

`gate-a-axe-scan.spec.ts` — 67 routes; no baselines to update (it's analytical, not snapshot-based), but the axe-scan output will likely shift on workspace routes because the DOM tree changes. Re-run post-R7.12 and confirm critical/serious counts don't regress vs the post-R7.5 baseline (54→6 critical, 65→64 serious).

## Out of scope for R7.12

- **R7.11 multi-role hierarchy / workspace switcher.** Still owner-gated.
- **A "favorite items" or pinning feature within the rail.** Beyond MD Mini-variant spec; owner can request as R7.13.
- **Rail-specific color/theming.** Inherits global tokens. R6.5 navy + R7.6 darker mute applies.
- **Animations beyond width transition** (e.g., fade-in tooltips, icon micro-animations). Plain transitions only; keep CSS lean.
- **Performance track work** (R7.1-R7.4). Per D25 sequential ordering — strictly after R7.12 + R7.7.
- **OWNER-FINDING-1 avatar.** Phase B Profile model.

## DoD for R7.12

- [ ] This memo committed first (done by this commit)
- [ ] Owner reviews memo + acks (then code starts)
- [ ] `apps/web/src/layouts/AppShell.tsx` — workspace grid + `<MiniRail>` mount at ≥1024px
- [ ] `apps/web/src/layouts/MiniRail.tsx` — new component (or inline within AppShell if short enough)
- [ ] `apps/web/src/sidenav.tsx` — `RoleSideNav` accepts `mode` prop; renders icon-only in mini
- [ ] `apps/web/styles.css` — `--rail-width` token + workspace grid styles + rail container styles + visually-hidden helper (if not already present)
- [ ] localStorage persistence wired with the migration shim for legacy `"open" | "closed"` values
- [ ] `phase-a-r7-12-mini-rail.spec.ts` — 18 assertions per the matrix above
- [ ] Local `npm run build` clean
- [ ] Affected D12 specs re-run with diff capture
- [ ] If diffs are architectural-only: `UPDATE_BASELINES=1` accept; review doc documents
- [ ] If diffs include unexpected regressions: STOP, fix-commit, then accept
- [ ] axe-scan re-run; confirm no critical/serious regression vs post-R7.5 baselines
- [ ] Review doc with: before/after architecture diagram, per-spec baseline-diff table, axe-scan delta, content-margin audit results
- [ ] D13 manual smoke pause for owner — rail mini ↔ expanded at desktop; mobile drawer at <1024px; refresh page → state persists; tab navigation through rail works

## Budget

| Component | Est. lines |
|---|---|
| `apps/web/src/layouts/AppShell.tsx` (rail wiring + content margin) | +60 |
| `apps/web/src/layouts/MiniRail.tsx` (new component) | ~120 |
| `apps/web/src/sidenav.tsx` (mode prop + dual rendering) | +30 |
| `apps/web/styles.css` (rail + grid + animation + visually-hidden) | ~150 |
| `apps/web/tests/visual/phase-a-r7-12-mini-rail.spec.ts` | ~220 |
| `apps/web/tests/visual/phase-a-r6-6-navbar-rtl.spec.ts` (rail-variant assertions) | +40 |
| `apps/web/tests/visual/gate-a-role-routing.spec.ts` (dual-mode sidebar assertion) | +30 |
| `docs/PHASE_A_R7_12_MEMO.md` (this file) | ~430 |
| `docs/PHASE_A_R7_12_REVIEW.md` | ~150 |
| **Total** | **~1230 lines** |

Far over the 300-line target — R7.12 is the largest sub-R since R6 (classroom redesign). The size is unavoidable: a real architecture change with a new component + style scope + spec + regression strategy + memo + review. Owner has acked the scope explicitly (D23 + D25). No code/test split — the regression strategy is integral.

## Sequencing reminder per D25

After R7.12 ships + D13 ack:
1. **Measurement re-run** — §1 a11y + §2 + §5
2. R7.7a + R7.7b + R7.7c + R7.7d (long-tail a11y)
3. R7.1 (Vite manual chunks)
4. R7.2 (Vazirmatn self-host)
5. R7.3 (Lighthouse a11y sweep residuals)
6. R7.4 (authed-route Lighthouse runner)
7. Final measurement
8. Gate A close → Phase B start

No step starts without explicit owner ack of the previous step's D13 smoke.

---

**Memo status: PROPOSED. Awaiting owner ack before any code starts.**

Three questions the owner may want to answer in the ack:

1. **Toggle position** — top of rail (proposed) vs bottom vs in topbar? Implementation outline §c picks top.
2. **Tooltip implementation in mini mode** — native `title` attribute (proposed, simplest) vs Radix Tooltip (more polish, more code)? Proposed: native title; can upgrade later.
3. **Branch vs main** — R7.12 code lands on a feature branch (safer; can compare baselines side-by-side) or directly on main (faster iteration; current Phase-A convention)? Proposed: main, following Phase-A convention.

Default answers are proposed; owner can override.

— Phase A author, 2026-05-23. Memo committed. Code stopped. Awaiting ack.
