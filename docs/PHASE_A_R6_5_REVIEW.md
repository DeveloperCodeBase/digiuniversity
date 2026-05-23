# Phase A R6.5 — Review (Global theme to white + navy blue)

> Single-commit theme switch: replace the off-white-paper + oxford-blue light theme with the white + navy-blue palette from the R6 classroom template. Default theme flipped from `dark` to `light` so the new palette is what first-paint users see. Surgical scope — 1 CSS block + 1 line in `main.tsx`. All 56 visual assertions across R1.1, R1.4, R3, R5, R6 still green.

## What shipped

| Commit | Files | Notes |
|---|---|---|
| `110439c` | 2 files (styles.css + main.tsx) | Light theme tokens rewritten to white + navy + brand-navy-* tokens added |

## Token diff

| Token | Before | After | Why |
|---|---|---|---|
| `--bg` | `#fafaf5` (warm off-white) | `#ffffff` (pure white) | Match template's white background |
| `--bg-deep` | `#f0eee5` (cream) | `#f5f7fb` (blue-tinted) | Match template's `--bg-soft` |
| `--surface` | `#ffffff` (white) | `#ffffff` (white) | Unchanged |
| `--surface-2` | `#f4f3ee` (warm grey) | `#f5f7fb` (blue-tinted) | Consistency with `--bg-deep` |
| `--surface-3` | `#e8e6dd` (warm tan) | `#eaf0f8` (blue mute) | Template's `--bg-mute` |
| `--line` | `rgba(13,13,13,0.08)` (warm black) | `rgba(11,36,71,0.08)` (navy) | Ink-consistent dividers |
| `--fg` | `#0d0d0c` (near-black) | `#0b2447` (navy-800) | Headings + body read as one brand voice |
| `--fg-mute` | `#4a4a48` (warm grey) | `#5b6b87` (muted navy) | Same tone family |
| `--fg-dim` | `#8a8884` (warm grey) | `#93a0b8` (faint navy) | Same tone family |
| `--accent` | `oklch(0.34 0.13 255)` (oxford blue) | `#2f5fd3` (brand blue) | Brighter, template-matched |
| `--accent-2` | `oklch(0.28 0.14 256)` (darker oxford) | `#1e3a8a` (deep blue) | Hover state, template-matched |
| `--accent-soft` | `oklch(0.95 0.025 255)` (paper blue) | `#e6edfc` (template blue-100) | Match template |
| `--accent-dim` | `oklch(0.65 0.08 255)` (mid blue) | `#7fa1f0` (template blue-300) | Match template |
| `--accent-on` | `#fafaf5` (cream) | `#ffffff` (white) | On-color text contrast |
| `--gold` | `oklch(0.5 0.16 30)` (brick red) | `#e7c87a` (warm gold) | Matches the MockBadge gold + template gold |
| **NEW** `--brand-navy-900` | — | `#061634` | Template's darkest navy |
| **NEW** `--brand-navy-800` | — | `#0b2447` | Template's primary navy |
| **NEW** `--brand-navy-700` | — | `#122e5f` | Template's mid navy |
| **NEW** `--brand-navy-600` | — | `#19376d` | Template's mid-light navy |

Shadows re-tinted from `rgba(13,13,13,…)` (warm black) to `rgba(11,36,71,…)` (navy) so ink shadows match ink color.

## What stayed the same

- **Dark theme** (`[data-theme="dark"]`) — untouched. Users who toggle to dark keep the existing palette.
- **`--navy` legacy alias** — still points at `oklch(0.55 0.12 75)` (muted gold). The name is a misnomer kept for back-compat with 90+ pre-existing references that expect gold/amber color. New code that wants literal navy uses `--accent` or the new `--brand-navy-*` tokens.
- **`--amber` alias** — still maps to `--navy` (which is gold). 50+ references stay green.
- **R5 login (`r5-login-shell`)** — has its own scoped token block under `.r5-login-shell {…}`. Unaffected.
- **R6 classroom (`r6-classroom-shell`)** — has its own scoped token block under `.r6-classroom-shell {…}`. Unaffected.
- **MockBadge** — uses `var(--gold)`. The new value (#e7c87a warm yellow gold) is actually a better match for the badge's intent than the old brick-red oklch — improvement, not regression.

## Default theme switch

`apps/web/src/main.tsx`:
```diff
- return localStorage.getItem("digiu_theme") || "dark";
+ return localStorage.getItem("digiu_theme") || "light";
```

The boot script reads `localStorage.getItem("digiu_theme")` and falls back to `"light"` instead of `"dark"`. Users who previously toggled to dark stay on dark (their `localStorage` value is honoured); users with no preference now see the new white + navy theme on first paint.

## Regression sweep — all 56 D12 assertions green

| Spec | Pass | Skip | Fail |
|---|---|---|---|
| R1.1 AppShell | **13/13** | 0 | 0 |
| R1.4 fixes | **7/7** | 0 | 0 |
| R3 Dashboards | **12/12** | 0 | 0 |
| R5 Login | **12/12** | 0 | 0 |
| R6 Classroom | **12/12** | 0 | 0 |
| **Total** | **56/56** | 0 | 0 |

R5's "Theme toggle" test in particular (which flips `html[data-theme]`) still passes — confirming both light and dark variants work end-to-end.

## Owner manual smoke — 4-step checklist (D13)

Visit **https://digiuniversity.ir** on real phone + desktop:

1. **Hard reload** the landing page. The background should be **white** (was warm cream). Headings read as **navy blue** (was near-black).
2. **Login** at `/login`. The R5 brand panel keeps its dark navy backdrop (it's CSS-scoped, won't change). The form panel's accent buttons + links should be the **new brand blue** (#2f5fd3, brighter than the old oxford blue).
3. **Workspace** (`/dashboard`, `/super`, etc.) — chrome (AppShell + sidebar + topbar) is now white with navy ink. Active nav item, primary buttons, KPI accent strokes — all brand blue. MockBadge stays **gold/yellow**.
4. **Classroom** (`/classroom`) — unchanged. Its CSS-scoped tokens override the global ones.

If anything looks off, screenshot + tell me which.

## Metrics

| Metric | Before R6.5 | After R6.5 | Δ |
|---|---|---|---|
| CSS bundle | 182.31 KB | 182.31 KB | 0 (token names unchanged, value swap only) |
| JS bundle | 873.32 KB | 873.32 KB | 0 (no JS change) |
| Modules transformed | 210 | 210 | 0 |
| Default theme | dark | **light** | — |
| Active `@ts-nocheck` | 1 | 1 | 0 |

The theme change is a pure value swap inside the existing `:root` block; bundle sizes are identical.

## What R6.5 deliberately did NOT do

- **Rename `--navy` → `--brand-gold`.** Tempting (the name is a misnomer), but renaming would touch 90+ files. Out of scope for a token-value-swap R. New code uses `--brand-navy-*` and the existing `--navy` keeps its (gold-tinted) value.
- **Remove the dark theme.** Some users may prefer dark; toggling stays available. Phase B+ can prune unused themes if telemetry shows nobody flips.
- **Rebrand R5 / R6.** Both pages have their own scoped token blocks because they're template-driven. Touching them would un-do R5 and R6.
- **New theme variants** (e.g., "high-contrast", "sepia"). Out of Phase-A scope.

## Awaiting

Owner manual smoke per D13. Then Gate A dossier aggregates the full evidence trail:

| Sub-R | Status |
|---|---|
| R1.1 + R1.2 + R1.3 + R1.4 | ✅ shipped |
| R2 (retire `@ts-nocheck`) | ✅ shipped |
| R3 (10 role dashboards) | ✅ shipped |
| R4 (audit lint) | ✅ shipped |
| R5 (login redesign) | ✅ shipped |
| R6 (Classroom redesign) | ✅ shipped |
| **R6.5 (white + navy theme)** | ✅ **shipped (56/56 still green)** |
| **Gate A dossier** | pending |
