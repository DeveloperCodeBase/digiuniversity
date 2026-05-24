# Phase A R7.12 — Review (Mini-variant persistent sidebar)

## Approved memo + decisions

> Per owner directive — first section is the approved memo + 3 ack answers, recorded in the review for posterity.

**Memo:** `docs/PHASE_A_R7_12_MEMO.md` (commit `a2b79c2`). Three risks acknowledged by the owner per D25:
1. Architecture rewrite (Sheet drawer → persistent rail)
2. Content margin audit per workspace route
3. Baseline reset for R1.1 / R3 / R6 / R6.6

**Three open ack questions (owner answered before code started):**

| Q | Owner answer | Rationale (owner-supplied) |
|---|---|---|
| Q1: Toggle position | **Top of rail** | Material reference + separation from topbar hamburger (which now lives only <1024px) + natural eye-path |
| Q2: Tooltip in mini | **Native `title` attribute** | Phase A is foundation, not polish. JS-free fallback. Screen reader gets the sr-only span (separately handled). Future upgrade to Radix Tooltip can be R7.13+. |
| Q3: Branch vs main | **Feature branch** (first Phase-A exception) | ~1230 line + 36 baseline reset = different risk profile. D26 records the exception. Branch: `phase-a/r7-12-mini-rail`. |

D24, D25, D26 logged in `docs/PHASE_A_DECISIONS.md`.

## What shipped

| Commit | Files | Notes |
|---|---|---|
| `a2b79c2` (on main) | memo | Plan locked + 3 risks; owner reviewed + acked |
| `79e7fc2` (on main) | D26 entry | Feature-branch convention recorded |
| `8518a35` (branch) | 5 files | AppShell + MiniRail + sidenav dual-mode + CSS + R7.12 spec |
| `db424a1` (branch) | 1 file | R1.1 test #9 updated for R7.12 contract |
| `48383f0` (branch) | 1 file | R6.6 workspace tests split: <1024 hamburger / ≥1024 rail |
| `e73da58` (branch) | 1 file | gate-a-role-routing: dual-mode sidebar sentinel lookup |

## Spec verification — 72/72 across affected specs

| Spec | Pass | Notes |
|---|---|---|
| `phase-a-r7-12-mini-rail` (new) | **13/13** | Breakpoint contract + mode + toggle + persistence + a11y |
| `phase-a-r1-1-appshell` | **13/13** | test #9 adapted to R7.12 contract (rail visible ≥1024, hamburger hidden) |
| `phase-a-r3-dashboards` | **12/12** | Unchanged — boundingBox + content assertions |
| `phase-a-r6-classroom` | **12/12** | Unchanged — classroom shell is scoped (`r6-classroom-shell`); AppShell change wraps around it |
| `phase-a-r6-6-navbar-rtl` | **12/12** | Workspace tests split: 3 mobile (<1024) hamburger pattern + 3 desktop (≥1024) rail pattern. Public navbar 6/6 unchanged. |
| `gate-a-role-routing` | **10/10** | Sidebar sentinel lookup now dual-mode (rail at ≥1024, Sheet at <1024) |
| **Total** | **72/72** | |

## D25 Risk 3 — baseline reset outcome

**Memo expected:** ~36 D12 snapshots updated via `UPDATE_BASELINES=1` because the chrome architecture change shifts pixel positions.

**Actual:** **0 baseline updates required.** All affected specs use semantic assertions (boundingBox positions, `toBeVisible()`, attribute checks, DOM presence/absence) — none use `toHaveScreenshot` pixel diffing. The chrome architecture change was absorbed by adapting the assertions themselves to match the new contract.

Two specs needed assertion adaptation (NOT baseline reset):
- **R1.1 test #9** — was "WORKSPACE ≥lg: hamburger visible, no inline sidebar". Updated to "WORKSPACE ≥lg: rail visible inline, hamburger HIDDEN" per R7.12.
- **R6.6 workspace tests** — split from a single 6-viewport loop into 3 mobile (<1024) + 3 desktop (≥1024). Each half asserts the right primitive for its viewport (hamburger vs rail).

This is a better outcome than the memo predicted. The semantic-assertion discipline that crystallized through R1.1 → R5 → R6 → R6.6 paid off: the specs already encoded "what the user sees" rather than "exactly these pixels", so the chrome refactor flowed through without touching baselines.

**Per-spec diff table (per D25 Risk 3 documentation requirement):**

| Spec | Snapshots updated | Diff % | Reason |
|---|---|---|---|
| `phase-a-r1-1-appshell` | 0 | n/a | 1 assertion adapted in test #9; no pixel snapshots |
| `phase-a-r3-dashboards` | 0 | n/a | No pixel snapshots; boundingBox + content only |
| `phase-a-r6-classroom` | 0 | n/a | Scoped shell; no pixel snapshots; unaffected by R7.12 |
| `phase-a-r6-6-navbar-rtl` | 0 | n/a | Workspace block split into <1024 / ≥1024 sub-suites; no pixel snapshots |
| `gate-a-role-routing` | 0 | n/a | Dual-mode sentinel; URL match + DOM presence only |

If a future R7 sub-R does introduce pixel-snapshot assertions (e.g., `UPDATE_BASELINES=1`-aware regression captures), the D25 Risk 3 reset protocol still stands — inspect diffs first, accept only if architectural-only, fix-commit if any unexpected secondary regression appears.

## axe-scan delta — 0 regressions

`gate-a-axe-scan.spec.ts` rerun against the live branch deploy:

| Metric | Post-R7.5 (pre-R7.12 baseline) | Post-R7.12 | Δ |
|---|---|---|---|
| `routes_with_critical` | 6 | **6** | 0 ✅ |
| `routes_with_serious` | 64 | **64** | 0 ✅ |
| `routes_clean` | 2 | 2 | 0 |
| Total scanned | 67 | 67 | 0 |

The 6 critical residuals are the same R7.7d-gated long-tail (button-name × 2, label × 2, select-name × 2) identified in R7.5's review. R7.12 introduced **zero new a11y violations** — adding a persistent rail with `aria-label="ناوبری نقش ..."` + a chevron toggle with `aria-label` + `aria-expanded` + native `title=` tooltips + `sr-only` labels was already-correct-by-construction.

## Files changed (architecture summary)

### `apps/web/src/layouts/AppShell.tsx`
- `SidebarPref` refactored from `"open" | "closed"` to `{ mode: "mini" | "expanded" }`.
- `readSidebarPref()` carries the migration shim (`"open"` → `{ mode: "expanded" }`, `"closed"` → `{ mode: "mini" }`).
- Breakpoint lowered from `1536` (3xl) to `1024` (lg) via `useMediaQuery("(min-width: 1024px)")`.
- `railVisible = isWide && isWorkspace` — the rail always mounts at ≥1024 in workspace.
- `toggleRailMode()` callback wired to `MiniRail.onToggle`.
- Sheet drawer mount narrowed to `isWorkspace && !railVisible` (<1024 only).
- `data-rail-mode` attribute on `.workspace-grid.has-rail` drives the CSS variable.

### `apps/web/src/layouts/MiniRail.tsx` (NEW)
- Wraps `RoleSideNav` with a top-anchored chevron toggle.
- RTL-aware icon: `chev-left` in mini (expand-toward-content), `chev-right` in expanded (collapse-toward-start).
- ARIA: `aria-expanded={!isMini}` + `aria-label` per state. `aria-haspopup` omitted (rail is a region, not a dialog).

### `apps/web/src/sidenav.tsx`
- `RoleSideNavProps.mode?: "mini" | "expanded"` (default `"expanded"` — keeps Sheet-drawer callers backward-compatible).
- Mini-mode rendering: group headers → `sr-only`, items → icon-only with `title=` tooltip + `sr-only` label.
- The same `RoleSideNav` component now serves both contexts (rail mini, rail expanded, Sheet drawer expanded) — no duplicate component for the rail.

### `apps/web/styles.css` (~140 lines appended)
- `--r7-rail-width: 72px` (mini) / `280px` (expanded) via `[data-rail-mode]` selectors.
- `.workspace-grid.has-rail`: 2-col grid at ≥1024 with width transition.
- `.r7-mini-rail`: `position: sticky; top: 76px; height: calc(100vh - 76px)`. Same elevation as content (`z-index: auto`, no shadow) per D23.
- `.r7-rail-toggle`: chevron button with focus-visible ring.
- `.nav[data-mode="workspace"] .nav-toggle { display: none; }` at `@media (min-width: 1024px)`.
- `prefers-reduced-motion`: width transitions disabled.

### `apps/web/tests/visual/phase-a-r7-12-mini-rail.spec.ts` (NEW, 13 assertions)
- 6 viewports for breakpoint contract (xs-375 / sm-768 / md-1023 / lg-1024 / xl-1280 / 2xl-1536)
- 4 mode + toggle + persistence tests (default mini, toggle to expanded + reload-persist, content margin, legacy localStorage migration)
- 3 a11y + RTL tests (aria-expanded toggling, mini items dual-path tooltip + sr-only, RTL start-edge position)

## Owner D13 manual smoke checklist

Per the user's R7.12 sequencing, before merging to main:

1. **Desktop (≥1024px)** — visit `https://digiuniversity.ir/dashboard` as any authed user.
   - Rail visible at the right edge (start in RTL). Width ≈ 72px (mini).
   - Topbar runs full-width above the rail (clipped by app bar).
   - No shadow on the rail; rail is at the same elevation as content.
   - **No** hamburger button in the topbar.
2. **Toggle** — click the chevron at the top of the rail.
   - Rail expands to ~280px with a ~200ms width animation.
   - Sidebar items show their Persian labels (no longer icon-only).
   - Group headers ("یادگیری" / "اداری" / etc.) visible.
3. **Persistence** — toggle to expanded, refresh the page.
   - Rail comes back expanded (per `localStorage.digiu_sidebar_pref`).
   - Toggle back to mini, refresh — comes back mini.
4. **Mobile (<1024px)** — narrow the window to 800px or less.
   - Rail disappears.
   - Topbar hamburger reappears at the right edge (R6.6 unchanged).
   - Tap the hamburger — Sheet drawer slides in from the right. Same R6.6 behavior.
5. **Keyboard navigation** — Tab through the rail at ≥1024px.
   - Tab order: topbar items → rail chevron → rail nav items → content. Focus rings visible.
   - Activate the chevron with Enter or Space — width toggles.

If any step looks/feels off → screenshot + tell me. If all five pass → R7.12 D13 ack, then merge `phase-a/r7-12-mini-rail` → `main`.

## What R7.12 deliberately did NOT do

- **R7.11 multi-role hierarchy / workspace switcher** — still owner-gated.
- **Rail tooltip upgrade to Radix Tooltip** — Q2 deferred to potential R7.13+.
- **Animations beyond the width transition** — no fade-in tooltips, no icon micro-animations.
- **Rail-specific theme tokens** — inherits global tokens (R6.5 navy + R7.6 darker mute).
- **Performance track (R7.1–R7.4)** — per D25, strictly sequential AFTER R7.12 + R7.7.

## Status

| Sub-R | Status |
|---|---|
| R7.6 | ✅ D19 PASS |
| R7.5 | ✅ D22 PASS |
| R7.9 | ✅ D24 PASS |
| **R7.12** | ✅ **shipped on `phase-a/r7-12-mini-rail`; 72/72 specs green; awaiting D13 smoke + merge** |
| Measurement re-run (§1 a11y + §2 + §5) | ⏸ blocked on R7.12 merge |
| R7.7a–d | ⏸ owner gate post-measurement |
| R7.1–4 Performance | ⏸ strict sequential per D25 |
| Gate A close | ⏸ |
| Phase B start | ⏸ |

## Next

Awaiting owner D13 smoke on the branch deploy. After ack:
1. Merge `phase-a/r7-12-mini-rail` → `main` (merge commit; preserves branch history per D26).
2. Post-merge deploy from main.
3. Critical-path measurement re-run (§1 Lighthouse a11y subset + §2 axe + §5 role routing).
4. Owner gate for R7.7 + Performance track timing decision.

— Phase A author, 2026-05-23. R7.12 code complete on branch, 72/72 specs green, awaiting D13 smoke + merge.
