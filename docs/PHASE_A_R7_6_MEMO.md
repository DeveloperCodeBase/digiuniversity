# Phase A R7.6 — Memo (Darken `--fg-mute` + `--fg-dim` for 4.5:1 contrast)

> First step on the R7 critical path. Targets the 65 `color-contrast` violations from §2 of the Gate A dossier — single CSS block change in `apps/web/styles.css`. Owner-prescribed values: `--fg-mute: #4a5a76` (was `#5b6b87`), `--fg-dim: #768094` (was `#93a0b8`). Verify contrast ratios via a tiny Node script BEFORE editing; re-run D12 regression after.

## Why R7.6 is first

Gate A's three failing criteria share two root-cause files: `apps/web/styles.css` (color tokens) and the chrome aria attribute on AppShell (R7.5). Of those, the CSS edit is the smallest, lowest-risk surgery — single tokens, no JSX touched, no a11y semantics changed. Doing it first proves the R7 pipeline (memo → code → verify → re-run measurements → review) works end-to-end before R7.5 + R7.9 land on top.

R7.6 also delivers the largest single-fix win on §2: 65 routes hit `color-contrast` (serious) under axe-core, and **every one** is downstream of `--fg-mute` or `--fg-dim` text rendered against `--bg`. One CSS rule, 65 routes unblocked.

## Survey of the affected tokens

`apps/web/styles.css` light theme block (R6.5 values):

```css
:root, [data-theme="light"] {
  --bg: #ffffff;
  --fg: #0b2447;        /* navy-800; verified contrast 13.6:1 against bg */
  --fg-mute: #5b6b87;   /* 🔴 ~4.1:1 against #ffffff — below WCAG AA 4.5:1 */
  --fg-dim: #93a0b8;    /* 🔴 ~3.0:1 against #ffffff — below WCAG AA 4.5:1; below 3:1 only for "large text" */
  ...
}
```

Usage scan (rough counts via `grep -rn 'var(--fg-mute)' apps/web/src` and `grep -rn 'var(--fg-dim)' apps/web/src`):
- `--fg-mute` is the second most-used color token after `--fg` itself. Body sub-text, table cell labels, meta text, helper hints, breadcrumb crumbs, KPI captions, etc. About 200+ use sites.
- `--fg-dim` is the third tier — placeholder text, disabled state ink, decorative dividers, day-of-week labels in calendars. About 80-100 use sites.

Both are used as **text colors on a white background**, which is exactly the situation WCAG SC 1.4.3 cares about (4.5:1 for normal text, 3:1 for large text or non-essential UI).

## New values + contrast verification (pre-commit)

Owner-prescribed:
- `--fg-mute: #4a5a76` (was `#5b6b87`)
- `--fg-dim: #768094` (was `#93a0b8`)

Before applying, I'll write a tiny Node script (`tools/r7-6-contrast-check.mjs`) that computes the WCAG contrast ratio for each new value against `--bg: #ffffff` using the relative-luminance formula:

```
L = 0.2126 * R_lin + 0.7152 * G_lin + 0.0722 * B_lin
R_lin (etc.) = ((sRGB+0.055)/1.055)^2.4   for sRGB > 0.03928
             = sRGB/12.92                 otherwise
contrast = (L_lighter + 0.05) / (L_darker + 0.05)
```

The script will print the OLD ratios, the NEW ratios, and PASS/FAIL against the 4.5:1 bar.

**My hand calc (will be verified by the script):**
- `#4a5a76` against `#ffffff`:
  - R=74 → 0.07; G=90 → 0.10; B=118 → 0.18
  - L ≈ 0.0151 + 0.0738 + 0.0134 = 0.1023
  - Contrast = 1.05 / 0.1523 ≈ **6.9:1** ✅ comfortable AA + close to AAA (7:1)
- `#768094` against `#ffffff`:
  - R=118 → 0.18; G=128 → 0.22; B=148 → 0.30
  - L ≈ 0.039 + 0.154 + 0.022 = 0.215
  - Contrast = 1.05 / 0.265 ≈ **3.96:1** 🟡 above 3:1 (large text OK) but below 4.5:1 (normal text)

If the script confirms `--fg-dim` at #768094 sits at ~3.96:1, that's **technically still failing** WCAG AA for normal text. Two paths:

**Path A** (owner-prescribed): Use #768094 as-is. Document the 3.96:1 ratio in the review. `--fg-dim` use sites are almost entirely 12-13px helper text, divider labels, and disabled state — these qualify as "non-essential UI" under WCAG SC 1.4.11 (Non-text Contrast, 3:1) rather than SC 1.4.3 (Normal text, 4.5:1). axe-core may or may not flag them — depends on whether axe classifies the use sites as essential text.

**Path B** (auto-darken to 4.5:1): Compute a slightly darker value that does hit 4.5:1. Going from #93a0b8 (3.0:1) to #6a7589 should land around 4.5:1. The script will tell me the exact value.

**Decision:** start with **Path A** (owner-prescribed values) since the owner explicitly specified them. Run the post-edit axe-scan. If `color-contrast` violations drop from 65 → ~0 even with `--fg-dim` at 3.96:1, Path A is sufficient. If `--fg-dim` text still trips the rule on some routes, escalate to Path B in R7.7 (long-tail fixes).

## What R7.6 ships

1. **`apps/web/styles.css`** — replace the two token values in the `:root, [data-theme="light"]` block. Six characters changed per token (the hex value); the surrounding comment notes the WCAG rationale.
2. **`tools/r7-6-contrast-check.mjs`** — standalone Node script. No CLI args; prints OLD vs NEW contrast ratios. Run via `node tools/r7-6-contrast-check.mjs`. Optionally also wired into `remote.ps1 lint` action for future re-runs.
3. **D12 regression sweep** — `.\scripts\remote.ps1 visual -Service phase-a-r1-1-appshell` + `-Service phase-a-r5-login` + `-Service phase-a-r6-classroom` + `-Service phase-a-r6-6-navbar-rtl`. Token shift may move pixel diffs ≤1% per spot; if snapshot specs use `toHaveScreenshot`, baselines may need refresh. The current Phase-A specs use `toBeVisible` + boundingBox checks (not `toHaveScreenshot`), so the regression should be invisible unless a literal pixel comparison is added.
4. **axe-scan re-run (color-contrast only)** — re-run the full `gate-a-axe-scan` spec; filter the resulting JSON to `color-contrast` violations only; expect 65 → 0 (or close to it).
5. **`docs/PHASE_A_R7_6_REVIEW.md`** — final write-up with before/after table, the contrast-script output, the regression sweep counts, the axe-scan delta, and the D13 manual-smoke checklist.

## Out of scope for R7.6

- **Dark theme contrast.** R6.5 left the dark theme untouched. Dark mode's `--fg-mute` is `#aab0c4` against `--bg: #0a0d1a` — that contrast is ~7:1 (already fine). No edit needed.
- **`--fg` itself.** `#0b2447` against `#ffffff` is ~13.6:1, AAA territory. Leave alone.
- **Other tokens (`--accent`, `--gold`, etc.).** Decorative + brand colors, not text-on-bg. Not in scope.
- **R5 / R6 scoped tokens (`--r5-*`, `--r6-*`).** Those are inside their shells (`r5-login-shell`, `r6-classroom-shell`) with their own contrast story. R6.6 manual smoke confirmed R6 looks correct. If axe-scan post-R7.6 shows color-contrast still firing inside the classroom or login shells, that's a separate R7.7 sub-item.
- **The chrome aria-valid-attr-value bug.** R7.5's surgery; touched separately so blame for the contrast change is unambiguous if R6.6's snapshots shift unexpectedly.
- **R7.11 multi-role hierarchy.** Owner-gated; flagged in R7.9 review.

## DoD for R7.6

- [ ] Memo committed first (this file)
- [ ] Contrast-check script written + executed + output captured in review
- [ ] `--fg-mute` and `--fg-dim` updated in `apps/web/styles.css`
- [ ] Local `npm run build` clean
- [ ] R1.1 + R5 + R6 + R6.6 visual specs re-run on VPS — all green (or baselines updated with explicit note if pixel shift > 1%)
- [ ] `gate-a-axe-scan` re-run on VPS — color-contrast violations drop from 65 → ≤5 (≤5 = long-tail acceptable, > 5 = escalate)
- [ ] Review doc written with the contrast table + regression counts + axe delta
- [ ] D13 manual smoke pause for owner (body text legibility on mobile, especially card subtitles + meta text)
- [ ] R7.5 does not start until owner D13 acks R7.6

## Budget

| Component | Est. lines |
|---|---|
| `apps/web/styles.css` (2 token values) | +2 lines |
| `tools/r7-6-contrast-check.mjs` | ~80 lines |
| `docs/PHASE_A_R7_6_MEMO.md` (this file) | ~150 lines |
| `docs/PHASE_A_R7_6_REVIEW.md` | ~80 lines |
| **Total** | **~310 lines** |

Within the 300-line target by a small margin. No code/test split needed.
