# Phase A R7.7 — Memo (Combined a11y sweep: a + b + c + d)

> Per D20 (Path 1 approved) + D28 (back to main-direct convention) + owner Path B decision (combine a/b/c/d into one sub-R). Closes §2 of the Gate A dossier from 🟡 → ✅: 6 critical → 0, 63 serious → ≤5 (long-tail acceptable, escalate only if >5 remain). Predicts Lighthouse a11y 88 → 95+ as a side effect.

## Why combined (per owner D28 rationale)

1. **Closes §2 to ✅, not 🟡** — Path A would leave the dossier with a serious-violation tail.
2. **Same shape of work** — a11y violation cleanup. Not architectural rewrites. Splitting it across two sub-Rs is admin overhead without a coherence benefit.
3. **One memo, one code pass, one spec, one review, one D13 smoke** — vs two of each.

## Memo + acked decisions (header per workflow convention)

- **D17** — R7 sweep approved, critical-path-first
- **D19** — R7.6 D13 PASS (token darken)
- **D20** — R7.7a Path 1 (accent-as-text → `--fg`); R7.7b/c/d also approved
- **D22** — R7.5 D13 PASS (chrome aria fix)
- **D24** — R7.9 D13 PASS (apiRoleToLocal complete)
- **D27** — R7.12 D13 PASS (mini-variant rail)
- **D28** — main-direct convention from R7.7 onwards (this sub-R)

## R7.7a — Demote `--accent` from text usage

**Audit results** (`grep -rnE "color:\s*var\(--accent.*\)|color:\s*var\(--cyan.*\)"`):

| Location | Selector | Verdict |
|---|---|---|
| `styles.css:796` | `.hero-stat .v .unit` | **FIX** — landing hero text on white |
| `styles.css:1135` | `.stage-screen .slide-eyebrow` | **FIX** — eyebrow text on slide bg |
| `styles.css:1272` | `tutor-input` text | **FIX** — input on white |
| `styles.css:1303` | `.tx-line .speaker` | **FIX** — transcript speaker label |
| `styles.css:1649` | `.stat .v .unit` | **FIX** — stat unit on white |
| `styles.css:1655` | (sched header) | **FIX** — title text on white |
| `styles.css:1704` | `.sched-time` | **FIX** — schedule time |
| `styles.css:1801` | `.cert .name` | **FIX** — certificate name (large text — may pass at 3:1, but normalize) |
| `styles.css:2031` | `.thread-votes .up` | **FIX** — vote count |
| `styles.css:2454` | (workspace text rule) | **FIX** — workspace text on white |
| `styles.css:2669` | (workspace text rule) | **FIX** — same |
| `styles.css:2761` | `.nav-link.active` | **CASE-BY-CASE** — already on `var(--accent-soft)` bg; check |
| `styles.css:3202` | (input/text rule) | **FIX** |
| `styles.css:3728` | (text rule) | **FIX** |
| `styles.css:4064` | (text rule) | **FIX** |
| `styles.css:4159` | (text rule) | **FIX** |
| `styles.css:4290` | `.ai-msg.ai .ai-av` | **KEEP** — accent text on `color-mix(--accent 18%, surface)` bg (accent-on-tinted, passes) |
| `styles.css:2398` | `.pill-cyan` | **KEEP** — accent text on `--accent-soft` bg (pill pattern) |
| `Badge.tsx:24` | primary badge text | **KEEP** — accent text on `--accent-soft` bg (badge pill) |
| `Badge.tsx:33` | live badge | **KEEP** — `--accent-on` text on `--accent` bg (high contrast on-color) |
| `BottomNav.tsx:210` | active-item text | **FIX** — `text-[var(--accent)]` on white nav bg |

**KEEP exceptions** (left alone with brief justification in the review):
- Accent-text-on-accent-soft-bg pill patterns (Badge primary, `.pill-cyan`, `.ai-msg.ai .ai-av`) — these are "tinted-on-tinted" combinations whose contrast usually passes the 4.5:1 bar. axe-scan didn't flag these specifically (the 63 color-contrast hits are on different elements per the violation samples), confirming the assumption.
- Non-color uses (`border-color`, `background-color`, `outline`, `caret-color`, `::selection`) — these are decorative / interactive surfaces, not text-on-bg, so WCAG SC 1.4.3 doesn't apply.

**Strategy:** swap `color: var(--accent)` / `color: var(--cyan)` / `color: var(--accent-2)` → `color: var(--fg)` (navy ink, ~13.6:1 against white) at every text-as-color use site. The CSS edits are surgical — one line per use, ~17 lines total.

For `.nav-link.active` (line 2761): inspect the surrounding rule. If the active state currently relies on accent-text-on-accent-soft + an `::after` underline, **keep the accent text** (it's on a tinted bg, passes contrast) and rely on the underline for the "active" affordance. Otherwise add an underline or font-weight bump per the owner's D13 smoke note: "اگه فقط مثل متن معمولی به نظر می‌رسه، یه underline یا state visual نگه دار".

**Predicted axe-scan impact:** `color-contrast: 63 → ~5` (the ~5 residuals would be R7.7b/c/d items, not R7.7a).

## R7.7b — Gold-as-text → `--fg`

**Audit results** (`grep -rnE "color:\s*var\(--gold.*\)"`):

| Location | Selector | Verdict |
|---|---|---|
| `Button.tsx:47` | `!text-white` on `!bg-[var(--gold)]` | **KEEP** — white-on-gold, opposite contrast direction; should pass |
| `Badge.tsx:30` | warning badge | **KEEP** — gold text on `var(--gold-soft)` bg (badge pill pattern) |
| `DropdownMenu.tsx:68` | "danger" menu item text | **FIX** — gold text likely on white menu bg → swap to `--fg` + keep gold-on-hover (`data-[highlighted]:bg-[var(--gold-soft)]`) |
| `ErrorState.tsx:59` | error icon bg + text | **KEEP** — gold text on gold-soft bg (icon container) |
| `Label.tsx:33` | required-field `*` | **KEEP** — tiny icon, the `*` is decorative; alternatively swap to `--fg` if axe flags it |
| `styles.css:2401` | `.pill-rose` | **KEEP** — gold text on gold-soft bg (pill pattern) |
| `styles.css:3733` | `.toast-warn .toast-icon` | **KEEP** — icon, not body text; passes "non-text contrast" 3:1 |
| `styles.css:4509` | `.lobby-btn.off` | **KEEP** — gold text on gold-soft bg (button pill) |

**Strategy:** the only clear FIX target is `DropdownMenu.tsx:68` (danger menu item text on white). Two paths:
- **Swap text color to `--fg`**: lose the visual "this is a destructive action" signal. Compensate by adding an inline icon (warn/alert glyph) before the text.
- **Keep gold text but require gold-soft hover background**: only the hover state passes contrast. Default state still fails.

Choose **swap-with-icon**: text in `--fg`, with an Icon `name="warn"` prefix already on the menu item (most danger items have it). If a danger item lacks an icon, add one. This is per the user's R7.7b directive: «gold فقط برای badge/icon/celebration».

For `Label.tsx:33` (required-field asterisk): leave it gold. The `*` symbol is small and decorative; WCAG SC 1.4.11 ("non-text contrast", 3:1) covers it. If a strict 4.5:1 is needed, swap to `--fg` and lose the visual prominence — but Lighthouse + axe don't typically flag a required-asterisk symbol as a contrast violation (it's part of the label, not standalone text). Leave it; revisit only if axe complains.

**Predicted axe-scan impact:** `color-contrast: drops 1-2 more` (DropdownMenu's danger items are scoped to specific routes that may or may not be in the current 63 residuals).

## R7.7c — Add `--fg-mute-on-dark` token + retarget footer

**Issue:** the footer renders on the dark navy bg from `.footer` styles (which uses constant dark surface regardless of theme). Body text in the footer uses `--fg-mute` which is light-theme `#5b6b87`. **`#5b6b87` text on dark navy (`#0b2447`) gives contrast ~1.3:1** — way below WCAG.

**Token addition** (in the `:root, [data-theme="light"]` block):
```css
--fg-mute-on-dark: #c0c8d8;   /* tuned for ≥4.5:1 against #0b2447 navy bg */
```

Verification (mental math; verified by R7.6's contrast-check script pattern):
- `#c0c8d8` against `#0b2447` (light theme navy fg used as dark surface): L_fg ≈ 0.58, L_bg ≈ 0.025. Contrast = (0.58 + 0.05) / (0.025 + 0.05) = 0.63 / 0.075 ≈ **8.4:1** ✅ AAA.

**Footer wire-up:** find every `.footer` CSS rule that uses `var(--fg-mute)` and swap to `var(--fg-mute-on-dark)`. Also any `.footer p` / `.footer .brand-sub` / `.footer .standards` rules that currently use the light-bg mute token.

**Predicted axe-scan impact:** `color-contrast: drops 1 route` (the footer is on PUBLIC routes; serves on /, /home, /about, /pricing, /admissions, /help, /honor-code, /programs — most of those already in the 63 serious count but the footer is only one of multiple violations per route).

## R7.7d — Per-page one-off fixes (6 critical residuals + 3 serious)

Pulled from `docs/gate-a-evidence/axe-scan.json` violation samples post-R7.12:

| Route | Violation | Selector | Fix |
|---|---|---|---|
| `/verify-email` | `label` (critical) | `input:nth-child(1)` | Add `<label htmlFor="…">` or `aria-label` to the verify-email page's input |
| `/settings` | `label` (critical) | `input[value="نسرین رضوی"]` | Settings "full name" input lacks `<label>` — add it |
| `/admin` | `button-name` (critical) | `.card-flat.p-4:nth-child(1) > .mb-2.justify-between.flex > .border-none.p-0.cursor-pointer` | Icon-only button on the admin setup wizard's first card; add `aria-label` |
| `/research` | `button-name` (critical) | `.p-4\.5.gap-4.items-center:nth-child(1) > .btn-ghost.btn-sm.btn` | Icon-only button on the first research card; add `aria-label` |
| `/analytics` | `select-name` (critical) | `select` | Bare `<select>` lacks `<label>` or `aria-label` — add it |
| `/recordings` | `select-name` (critical) | `select` | Same — bare `<select>` |
| `/messages` | `scrollable-region-focusable` (serious) | `.p-6` | Scrollable container needs `tabindex="0"` |
| `/classroom` | `scrollable-region-focusable` (serious) | `.r6-rail` | R6 participant rail (the horizontal scroller at <920px) needs `tabindex="0"` |
| `/classroom` | `nested-interactive` (serious) | `.r6-slide` | An interactive element nested in another (likely `<button>` inside `<a>` somewhere in the slide). Audit the slide-overlay JSX. |
| `/classroom` | `aria-prohibited-attr` (serious) | `div[title="علی ر."] > .r6-rail-mic-off[aria-label="میکروفون خاموش"]` | A `<div>` inside the participant tile has `aria-label` which is prohibited on `<div>` without a role. Add `role="img"` or move the label to the parent. |

**Strategy:** one targeted fix per row. Most are 1-3 line edits. Total surface: 6 files (`/verify-email` page, `/settings` page, `/admin` setup-wizard component, `/research` card component, `/analytics` filter component, `/recordings` filter component, `/messages` page, R6 classroom Stage/rail components).

**Predicted axe-scan impact:** `critical 6 → 0` (all 6 are R7.7d-gated). `serious -3` (messages scroll, classroom rail scroll, classroom aria-prohibited).

## Combined predicted axe-scan delta

| | Post-R7.12 (current) | Predicted post-R7.7 | Δ |
|---|---|---|---|
| Routes with ≥1 critical | 6 | **0** | −6 (R7.7d) |
| Routes with ≥1 serious | 63 | **~5** | ~−58 (R7.7a ~55, R7.7b ~1, R7.7c ~1, R7.7d ~3) |
| Clean | 3 | **~55** | +52 |

If the ~5 residual serious doesn't drop further, those would need a follow-up sub-R OR an owner override (some "serious" axe rules can be context-dependent, e.g. a stretch-zoomed text element). The R7.7 review will list any residuals with proposed handling.

## Spec strategy

Two options reviewed:

1. **New spec** `tests/visual/phase-a-r7-7-a11y-sweep.spec.ts` — per-fix assertion (10ish tests).
2. **Extend `gate-a-axe-scan.spec.ts`** with thresholds — assert `critical_count === 0` and `serious_count <= 5` after the scan runs.

**Picked: hybrid.**
- Extend `gate-a-axe-scan.spec.ts` to assert hard thresholds at the suite level (catches regression cleanly).
- Add a small new spec `phase-a-r7-7-a11y-sweep.spec.ts` (~80 lines) with focused assertions on the R7.7d-fixed elements (e.g., assert `/admin`'s first card button has `aria-label`, `/verify-email`'s input has an associated `<label>`). Catches per-fix regression without depending on axe's exact violation count.

Without the threshold assertion, a future change that re-introduces 1 critical wouldn't surface as a test failure (the current spec records violations but doesn't gate).

## Regression strategy

Affected D12 specs:
- `phase-a-r1-1-appshell.spec.ts` — color tokens used in chrome; expected unaffected (assertions are semantic). Re-run as safety.
- `phase-a-r5-login.spec.ts` — login page R5 has its own scoped tokens; should be unaffected. Re-run.
- `phase-a-r6-classroom.spec.ts` — classroom shell scoped; the rail / reactions changes from R7.7d may affect.
- `phase-a-r6-6-navbar-rtl.spec.ts` — navbar color changes likely; re-run.
- `phase-a-r7-12-mini-rail.spec.ts` — rail's active-state color likely changes; re-run.
- `gate-a-role-routing.spec.ts` — role nav sentinel still resolves; re-run.

No `UPDATE_BASELINES=1` expected (specs are semantic, not snapshot — same pattern that R7.12 confirmed).

## DoD for R7.7

- [ ] Memo committed first (this file)
- [ ] R7.7a CSS swap landed
- [ ] R7.7b DropdownMenu danger-text + asterisk handling
- [ ] R7.7c `--fg-mute-on-dark` token + footer rewire
- [ ] R7.7d 9 per-page fixes (6 critical + 3 serious)
- [ ] `gate-a-axe-scan.spec.ts` threshold extension
- [ ] `phase-a-r7-7-a11y-sweep.spec.ts` new focused-per-fix spec
- [ ] Local `npm run build` clean
- [ ] Affected D12 specs regression — all green
- [ ] axe-scan: `critical_count === 0` AND `serious_count ≤ 5`
- [ ] Lighthouse mobile re-run on the 3 pages — A11y score 88 → ≥95 predicted (Perf still <90 — that's R7.1/R7.2's job)
- [ ] Review doc with per-step contrast measurement + axe delta + Lighthouse delta
- [ ] D13 owner manual smoke pause (~10-15 min — color changes are visible on multiple pages)

## Budget

| Component | Est. lines |
|---|---|
| `apps/web/styles.css` (R7.7a swaps + R7.7c token + footer wire) | ~25 |
| `apps/web/src/ui/BottomNav.tsx` (active-item color) | ~3 |
| `apps/web/src/ui/DropdownMenu.tsx` (danger swap) | ~5 |
| `apps/web/src/pages/auth/*` (verify-email label) | ~5 |
| `apps/web/src/pages/Settings.tsx` (fullName label) | ~5 |
| `apps/web/src/pages/Admin.tsx` or similar (button aria-label) | ~3 |
| `apps/web/src/pages/Research.tsx` (button aria-label) | ~3 |
| `apps/web/src/pages/Analytics.tsx` (select label) | ~5 |
| `apps/web/src/pages/Recordings.tsx` (select label) | ~5 |
| `apps/web/src/pages/Messages.tsx` (tabindex=0) | ~2 |
| `apps/web/src/pages/classroom/Stage.tsx` (rail tabindex + slide nested-interactive + mic-off aria) | ~8 |
| `apps/web/tests/visual/gate-a-axe-scan.spec.ts` (threshold extension) | ~10 |
| `apps/web/tests/visual/phase-a-r7-7-a11y-sweep.spec.ts` (new) | ~90 |
| `docs/PHASE_A_R7_7_MEMO.md` (this file) | ~260 |
| `docs/PHASE_A_R7_7_REVIEW.md` | ~150 |
| **Total** | **~580 lines** |

Above the 300-line target but the budget is split across many small files. Per R1.1-D7 the cap is a target with grace, and combining a/b/c/d in one sub-R (owner-approved per Path B) means the work is non-decomposable. No code/test split.

## Out of scope for R7.7

- R7.1 / R7.2 / R7.3 / R7.4 (Performance track) — strict sequential per D25.
- R7.11 multi-role hierarchy / workspace switcher — owner-gated.
- Phase B Profile-model (avatar component) — OWNER-FINDING-1 stays in OUT_OF_SCOPE.
- Brand color reshuffles (changing `--accent` itself) — D20 explicitly preserves the brand-blue value.

## Sequencing reminder

After R7.7 D13 ack:
1. Measurement re-run #3 — Lighthouse + axe + role routing.
2. Update Gate A dossier: §2 → ✅, §1 a11y subset → ✅ (Perf still 🔴).
3. Owner gate for Performance track start (R7.1 + R7.2 + R7.3 + R7.4).
4. Then Performance track lands.
5. Final measurement.
6. Gate A close → Phase B start.

— Phase A author, 2026-05-23. R7.7 memo proposed. Awaiting owner ack before code starts.
