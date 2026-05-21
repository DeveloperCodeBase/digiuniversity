# Phase-16 R3 — Component Library Review

Sprint R3 (the four R3a / R3b / R3c / R3d sub-sprints) lays the
design-system foundation the audit asked for, sized for production
and themed against the existing OKLCh tokens (no shadcn CLI
overwrite of styles.css). The rest of Phase 16 — Classroom mobile
fix, BottomNav, landing redesign, page refactors — composes with
the primitives shipped here.

## Commits in this sprint

| SHA       | Title |
| --------- | --------------------------------------------------------- |
| `cacc428` | fix(responsive): correct xs breakpoint to 320px for iPhone SE |
| `289eeff` | fix(auth): AuthLoadingSkeleton kills redirect flash |
| `0011e17` | docs(memory): defer ts-nocheck retirement to Phase 16.5 |
| `9db1732` | chore(styles): remove orphan OKLCh tokens |
| `5a3bb15` | phase-16 R3: Radix-backed primitive library at apps/web/src/ui/ |
| `3460b83` | phase-16 R3: Storybook stories + vitest axe-core tests for ui/ |
| `e05578c` | phase-16 R3: Storybook snapshot pipeline |
| `45c08c3` | fix(visual): git clean docs/ before pull so re-runs don't conflict |
| `f643630` | fix(r3-storybook): aria-haspopup selector for DropdownMenu |
| `8c39091` | fix(r3-storybook): snapshot closed dropdown trigger |
| `1f89e7f` | fix(stories): spaces in titles for deterministic Storybook IDs |

## Gate-1 owner corrections — all applied

| # | Owner instruction | Status |
| - | ----------------- | ------ |
| 1 | `xs=375` → `xs=320` (iPhone SE coverage) | ✅ `cacc428` |
| 2 | Build `<AuthLoadingSkeleton/>` — no redirect flash | ✅ `289eeff` |
| 3 | Defer `@ts-nocheck` retirement to Phase 16.5 | ✅ `docs/MEMORY.md` |
| 4 | Keep `gate-1-login-form-pre-submit.png` breadcrumb | ✅ retained |

## Primitive layer (`apps/web/src/ui/`)

**16 primitives** + utilities, all themed with OKLCh CSS variables.
Zero hardcoded colours. RTL-aware via Radix `dir` + logical
properties. Reduced-motion respected.

### Form / interactive

| Primitive | Backing | Variants / API |
| --- | --- | --- |
| `Button` | native + Radix Slot | `variant: primary|secondary|ghost|outline|ink|danger` · `size: sm|md|lg|icon` · `asChild` · `loading` · `leftIcon` · `rightIcon` |
| `Input` | native | 44 px min touch · `invalid` · `describedBy` |
| `Label` | native | `required` (asterisk affordance) |
| `Textarea` | native | `invalid` · `describedBy` |
| `Tabs` | `@radix-ui/react-tabs` | `Tabs / List / Trigger / Content` · keyboard arrows |
| `DropdownMenu` | `@radix-ui/react-dropdown-menu` | `Trigger / Content / Item (destructive) / Label / Separator` · portal mount · data-state animations |

### Surface

| Primitive | Backing | Variants |
| --- | --- | --- |
| `Card` + `CardHeader/Title/Description/Content/Footer` | legacy `.card` | `variant: default | flat | bordered` · `padding: none | sm | md | lg` |
| `Dialog` + `Trigger/Content/Header/Title/Description/Footer/Close` | `@radix-ui/react-dialog` | full-screen on `<md`, `env(safe-area-inset-bottom)` |
| `Sheet` + `Trigger/Content/Header/Title/Description/Footer/Close` | `@radix-ui/react-dialog` | `side: top | bottom | start | end` · RTL-aware slide direction |
| `Separator` | `@radix-ui/react-separator` | `orientation: horizontal | vertical` |

### Status / loading

| Primitive | Backing | Variants / API |
| --- | --- | --- |
| `Toast` + `ToastProvider` + `toast()` API | `@radix-ui/react-toast` | `kind: info | success | warn | danger` · imperative `toast.info(...)` etc. · optional action button |
| `Skeleton` | none | `variant: text | circle | rect` · `lines` · `motion-safe:animate-pulse` |
| `EmptyState` | none | `icon` · `title` · `body` · `cta` · `density: compact | comfortable` |
| `ErrorState` | none | `title` · `body` · `retry` (required) · `retryLabel` · optional `<details>` |
| `Badge` | none | `variant: default | success | warning | danger | muted | live` · live adds pulsing dot |
| `Avatar` + `Image` + `Fallback` | `@radix-ui/react-avatar` | `size: sm | md | lg | xl` · graceful image-load fallback |

### Composition guarantees

- **Persian + RTL**: every primitive consumed in the showcases renders correctly with `<html dir="rtl">`. Sheet's `side="start" / "end"` resolve to the right / left edges respectively under RTL.
- **OKLCh tokens**: no inline `#hex` or `oklch(...)` literals outside `styles.css`. All colour reads go through `var(--accent)`, `var(--surface)`, `var(--fg)`, etc. Future theme swaps land everywhere.
- **A11y**:
  - 44×44 minimum touch target on every interactive element.
  - `aria-invalid`, `aria-busy`, `aria-describedby` wired on form inputs.
  - Focus rings use `--accent` with 30% opacity 2-px outline — visible against any surface.
  - `role=status` / `role=alert` on Skeleton / EmptyState / ErrorState / Toaster for screen readers.
  - `prefers-reduced-motion` honoured (skeleton pulse uses `motion-safe:`, every animation gated by the global guard in `styles.css`).

## Test coverage

### Vitest + jest-axe (`tests/ui/primitives.test.tsx`)

```
Test Files  3 passed (3)
     Tests  41 passed (41)
```

24 new scenarios in this sprint:

- Smoke render for every primitive (no throw, expected text present).
- WCAG 2.2 AA via axe-core on Button (all 7 variants), Card, the
  Input + Label + Textarea field group, Dialog (open content),
  Sheet (open content), Tabs, EmptyState, Separator — zero
  violations across the lot.
- Interaction semantics: Dialog open + close, Tabs click-to-switch
  (userEvent — Radix activates on pointerdown, fireEvent.click
  misses), DropdownMenu open (userEvent), Toast queue flush via
  imperative API, ErrorState retry button.
- Form a11y: Label htmlFor → Input association, aria-invalid +
  aria-describedby on Input and Textarea, required-asterisk on
  Label.

Plus the 17 pre-existing tests (`data.test.js` 12 + `breakpoints.test.js` 5) — still all green.

### Storybook visual snapshots

54 PNGs (18 stories × 3 viewports) at `docs/gate-2-evidence/r3-storybook/`.
Captured via the new `web-visual` docker profile + the
`playwright.storybook.config.js` pipeline:

```
.\scripts\remote.ps1 visual -Service r3-storybook
```

(Pre-step: builds `storybook-static/` inside the docker volume,
serves it via python3 http.server, runs Playwright against
`http://localhost:6006`.)

Sample frames:

| Component | Mobile 320 | Tablet 768 | Desktop 1280 |
| --- | --- | --- | --- |
| Button all variants | ![](gate-2-evidence/r3-storybook/01-button-all-variants--mobile-320.png) | ![](gate-2-evidence/r3-storybook/01-button-all-variants--tablet-768.png) | ![](gate-2-evidence/r3-storybook/01-button-all-variants--desktop-1280.png) |
| Card default | ![](gate-2-evidence/r3-storybook/03-card-default--mobile-320.png) | ![](gate-2-evidence/r3-storybook/03-card-default--tablet-768.png) | ![](gate-2-evidence/r3-storybook/03-card-default--desktop-1280.png) |
| Dialog default | ![](gate-2-evidence/r3-storybook/09-dialog-default--mobile-320.png) | ![](gate-2-evidence/r3-storybook/09-dialog-default--tablet-768.png) | ![](gate-2-evidence/r3-storybook/09-dialog-default--desktop-1280.png) |
| Sheet bottom | ![](gate-2-evidence/r3-storybook/10-sheet-bottom--mobile-320.png) | ![](gate-2-evidence/r3-storybook/10-sheet-bottom--tablet-768.png) | ![](gate-2-evidence/r3-storybook/10-sheet-bottom--desktop-1280.png) |
| Tabs | ![](gate-2-evidence/r3-storybook/11-tabs-default--mobile-320.png) | ![](gate-2-evidence/r3-storybook/11-tabs-default--tablet-768.png) | ![](gate-2-evidence/r3-storybook/11-tabs-default--desktop-1280.png) |
| Badge all variants | ![](gate-2-evidence/r3-storybook/13-badge-all-variants--mobile-320.png) | ![](gate-2-evidence/r3-storybook/13-badge-all-variants--tablet-768.png) | ![](gate-2-evidence/r3-storybook/13-badge-all-variants--desktop-1280.png) |
| Avatar sizes | ![](gate-2-evidence/r3-storybook/14-avatar-sizes--mobile-320.png) | ![](gate-2-evidence/r3-storybook/14-avatar-sizes--tablet-768.png) | ![](gate-2-evidence/r3-storybook/14-avatar-sizes--desktop-1280.png) |
| Skeleton card | ![](gate-2-evidence/r3-storybook/16-skeleton-card--mobile-320.png) | ![](gate-2-evidence/r3-storybook/16-skeleton-card--tablet-768.png) | ![](gate-2-evidence/r3-storybook/16-skeleton-card--desktop-1280.png) |
| EmptyState | ![](gate-2-evidence/r3-storybook/17-empty-state-default--mobile-320.png) | ![](gate-2-evidence/r3-storybook/17-empty-state-default--tablet-768.png) | ![](gate-2-evidence/r3-storybook/17-empty-state-default--desktop-1280.png) |
| ErrorState | ![](gate-2-evidence/r3-storybook/18-error-state-default--mobile-320.png) | ![](gate-2-evidence/r3-storybook/18-error-state-default--tablet-768.png) | ![](gate-2-evidence/r3-storybook/18-error-state-default--desktop-1280.png) |

The remaining stories (Button loading, Card bordered, Input default/invalid, Label required, Textarea, DropdownMenu trigger, Separator) are in the same folder.

## Bundle budget

Measured via `npm run build` and parsing the Vite output:

| Build | gzipped JS | gzipped CSS | total |
| --- | --- | --- | --- |
| Pre-R3 (`0011e17`, post-AuthLoadingSkeleton) | ~213 KB | ~24 KB | ~237 KB |
| Post-R3 (`5a3bb15`+) | **237 KB** | **24 KB** | **261 KB** |
| Net add from R3 | **+24 KB JS** | +0 KB | **+24 KB** |

**Budget**: ≤ 30 KB gzipped for `apps/web/src/ui/` primitives. ✅ Under by 6 KB.

Breakdown of the +24 KB:
- `@radix-ui/react-{dialog, dropdown-menu, popover, tabs, tooltip, toast, select, checkbox, radio-group, switch, slider, scroll-area, accordion, avatar, separator, slot}` — 16 packages but they share a `react-primitive` + `react-portal` + `react-compose-refs` core, so the effective add is ~18 KB.
- `clsx@2.1.1` — ~250 bytes.
- `react-hook-form@7.54.2` — only the schema-validation entry-points (form validation lands in R9/R13), so currently dead-code-eliminated.
- `zod@3.24.1` + `@hookform/resolvers@3.10.0` — same: not exercised by the primitives, will appear in the bundle only when forms wire them up in R9.
- Our 16 wrapper modules — ~5 KB.

Stories + tests + `playwright.storybook.config.js` are dev-only and do not enter the production bundle.

## Deps added in R3

| Package | Version | Why exact-pinned |
| --- | --- | --- |
| `@radix-ui/react-dialog` | 1.1.4 | Dialog primitive |
| `@radix-ui/react-dropdown-menu` | 2.1.4 | Menu primitive |
| `@radix-ui/react-popover` | 1.1.4 | Available for future tooltip-like UI |
| `@radix-ui/react-tabs` | 1.1.2 | Tabs |
| `@radix-ui/react-tooltip` | 1.1.6 | Tooltip placeholder for R6 |
| `@radix-ui/react-toast` | 1.2.4 | Toaster |
| `@radix-ui/react-select` | 2.1.4 | Filter dropdowns in R13 |
| `@radix-ui/react-checkbox` | 1.1.3 | Form controls |
| `@radix-ui/react-radio-group` | 1.2.2 | Form controls |
| `@radix-ui/react-switch` | 1.1.2 | Settings toggles |
| `@radix-ui/react-slider` | 1.2.2 | Range / progress |
| `@radix-ui/react-scroll-area` | 1.2.2 | Custom scrollbars in Sheet |
| `@radix-ui/react-accordion` | 1.2.2 | FAQ in landing |
| `@radix-ui/react-avatar` | 1.1.2 | Avatar |
| `@radix-ui/react-separator` | 1.1.1 | Separator |
| `@radix-ui/react-slot` | 1.1.1 | Button asChild |
| `react-hook-form` | 7.54.2 | Form state machine |
| `zod` | 3.24.1 | Schema validation |
| `@hookform/resolvers` | 3.10.0 | RHF ↔ zod adapter |
| `clsx` | 2.1.1 | Class merging in `cn()` |
| `jest-axe` (dev) | 9.0.0 | A11y in vitest |
| `@types/jest-axe` (dev) | 3.5.9 | TS types |

All pinned exact (`--save-exact`) — Phase-14.7 lesson: drift between
local `npm install` and the docker image resolves means visual
captures stop being reproducible. Same logic that pinned
`@playwright/test@1.49.1` to match the docker `playwright:v1.49.1-noble`
image.

## What lands next (R4 onwards)

Per the plan no further owner gate fires until R10 ships (Gate 2 = full
landing redesign). Continuous work between now and then:

- **R6 / R7** — Classroom overlays migrate to `Dialog` (poll),
  `Sheet side="bottom"` (breakout), reactions sticky bar. Closes B-04.
- **R8** — `BottomNav` for 10 roles, mounted in Layout, hidden on
  `≥md` and on `/classroom`. Closes B-06.
- **R9 / R10** — Landing redesign with 6 new sections (Hero update +
  trust strip + stats band with count-up + faculty showcase + course
  catalog teaser + testimonials + dual CTA), all consuming the new
  primitives. Closes the rest of B-08.
- **R11** — landing overflow + touch-target Playwright matrix.
- **Gate 2** — owner review after R11 lands.
- **R13** — high-traffic pages (Dashboard, MyCourses, Catalog) get
  primitives + mobile-first refactor.
- **R14 / R15 / R16** — Playwright responsive matrix, lazy-load
  routes, Lighthouse, README/MEMORY updates.

The `@ts-nocheck` retirement remains scheduled for **Phase 16.5**
per owner ruling in `docs/MEMORY.md`.

## Open observations

- **Bundle grows by 24 KB** for the primitive layer alone. When R13
  starts using `react-hook-form` + `zod` for the auth & profile
  forms, expect another ~12 KB. If the total approaches the 280 KB
  mark we should land R15 (lazy-route bundles) early.
- **DropdownMenu open state in Storybook iframe** flaked under the
  python http.server + isolated iframe combo. The interactive open
  state is covered by the vitest `userEvent.click` test instead.
  Decision logged in the spec comment.
- **Storybook ID convention** — Storybook 8.6 collapses bare
  CamelCase titles. Use spaces (`"UI/Empty State"`) for predictable
  kebab IDs. Applied to EmptyState, ErrorState, DropdownMenu.
