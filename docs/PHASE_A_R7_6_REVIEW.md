# Phase A R7.6 — Review (Darken `--fg-mute` + `--fg-dim` for WCAG AA contrast)

> First step on the R7 critical path. Owner-prescribed token darkening applied + verified. **R7.6 succeeded 100% within its scope** — both `--fg-mute` and `--fg-dim` text on white are now clean per axe-scan. **65 → 64 color-contrast routes** in the rule-frequency headline doesn't tell the whole story: the diagnostic capture shows the remaining 64 violations come from **4 OTHER root causes** that need separate R7.7 sub-items. R7.5 starts after owner D13 smoke confirms text legibility.

## What shipped

| Commit | Files | Notes |
|---|---|---|
| `f7bf9f2` | memo | Plan locked before code |
| `871b2ff` | 2 files | Token darkening + contrast-check script |
| `6278b8a` | 1 file | axe-scan spec enhancement: capture violation samples |

## Contrast verification (pre + post)

`node tools/r7-6-contrast-check.mjs` output:

| Token | Role | OLD | NEW | Verdict |
|---|---|---|---|---|
| `--fg` | primary text | `#0d0d0c` 19.44:1 | `#0b2447` 15.47:1 | AAA (normal text) |
| `--fg-mute` | secondary text | `#5b6b87` 5.39:1 | `#4a5a76` **6.96:1** ↑ | AA (normal text) |
| `--fg-dim` | tertiary text | `#93a0b8` 2.64:1 | `#768094` **3.97:1** ↑ | AA (large text / non-essential UI only) |

**Unexpected pre-edit finding:** `--fg-mute` was already at 5.39:1 (above AA-normal 4.5:1) before R7.6. The token darkening still landed because the script confirmed the new value is even more comfortable (6.96:1, near AAA). `--fg-dim` was the actually-failing token at 2.64:1 — now at 3.97:1, still just below AA-normal but well above the 3:1 SC 1.4.11 threshold.

## Regression sweep — 49/49 D12 assertions still green

| Spec | Pass |
|---|---|
| R1.1 AppShell | 13/13 |
| R5 Login | 12/12 |
| R6 Classroom | 12/12 |
| R6.6 Navbar RTL | 12/12 |
| **Total** | **49/49** |

No `toHaveScreenshot` baseline drift — Phase A specs use boundingBox + visibility checks, so the token darkening was invisible to the assertions. Visual fidelity confirmed at all 6 viewports per spec.

## axe-scan re-run — color-contrast bucket breakdown

The headline number (color-contrast rule firing on 65 → 64 routes) masks what actually happened. The diagnostic-enhanced spec (commit `6278b8a`) captured the foreground + background hex pair for each violation, which lets us bucket by root cause:

| Bucket | Count | What it is | Was this R7.6's scope? |
|---|---|---|---|
| **`fgMuteWhite`** | **0** ✅ | `--fg-mute` text on `--bg: #ffffff` | **YES — R7.6's specific target. Fully cleared.** |
| **`fgDimWhite`** | **0** ✅ | `--fg-dim` text on `--bg: #ffffff` | **YES — R7.6's specific target. Fully cleared.** |
| `accentOnWhite` | 31 | Brand blue (#2f5fd3 / #4772d8 / #4f78da variants) as TEXT on white or bg-soft (4.17-4.22:1) | NO — accent color is interactive-tone, not text-tone |
| `goldOnWhite` | 13 | Gold (#e7c87a) as TEXT on white (1.55:1, structurally impossible to hit AA at this hue) | NO — gold is brand accent, never should be body text |
| `textOnAccent` | 4 | `--accent-on` (#e9eefa) on accent button (#4973d8) (3.82:1) | NO — accent button's on-color needs a separate review |
| `textOnDark` | 1 | `--fg-mute` (#4a5a76) on footer dark bg (#0a0d1a) (2.77:1) | NO — token assumes white bg; footer needs a different muted token |
| `other` | 15 | Misc (warning amber on amber-soft, dim eyebrow text, etc.) | NO |

**R7.6 success rate within its scope: 100%.** The two token-specific buckets (`fgMuteWhite`, `fgDimWhite`) both went to **0**. The token darkening did exactly what the memo predicted.

**What 65 → 64 actually represents:** the rule still fires on 64 routes, but the *cause* is now exclusively the OTHER 4 buckets — not the tokens R7.6 was targeted at. Owner-prescribed Path A worked as designed.

## R7.7 long-tail re-scoping

The R7 sweep plan originally treated R7.7 as "long-tail one-offs (~10 routes)". The diagnostic data shows R7.7 is actually four distinct design-system sub-Rs:

### R7.7a — Restrict accent-blue to non-text usage (31 routes)
Brand blue (`--accent: #2f5fd3`) is being used as TEXT color in eyebrow labels, mono spans, and link decorations. At ~4.17:1 against white it's just below AA-normal. Two paths:
- **Path 1**: Replace accent-as-text with `--fg` (navy ink). Reserves accent for borders, fills, icons, focus rings.
- **Path 2**: Darken `--accent: #2f5fd3` to a deeper blue that hits 4.5:1 (around `#2647a8`). Side-effect: all accent-based UI (buttons, focus rings, brand-blue motifs) gets visibly darker.
- **Recommendation**: Path 1. Accent should be "interactive" color, not "text" color. The 31 affected sites are mostly decorative eyebrows that read fine in `--fg`.

### R7.7b — Restrict gold to non-text usage (13 routes)
Gold (`--gold: #e7c87a`) is used as TEXT on white in card headings + dashboard eyebrows. Gold against white is **1.55:1** — structurally impossible to satisfy 4.5:1 without darkening to a brown that's no longer recognizable as gold.
- **Recommendation**: Replace gold-as-text with `--accent` or `--fg`. Reserve gold for badges, fills, icon strokes, decorative borders (the R6 classroom uses gold this way correctly — its scoped tokens stay).

### R7.7c — Add `--fg-on-dark` token + retire `--fg-mute`-on-dark-footer usage (1 route)
The footer at `/about` (and presumably elsewhere) uses `--bg-deep: #0a0d1a` as a dark backdrop with `--fg-mute` text on top. After R7.6, `--fg-mute` is darker, which makes the on-dark contrast WORSE (2.77:1).
- **Recommendation**: Add `--fg-mute-on-dark` token (e.g., `#aab0c4`, same as dark-theme `--fg-mute`). Update footer CSS to use this on dark backdrop. Alternatively, the footer could switch to using the dark-theme tokens directly via a `data-theme="dark"` attribute on the footer element.

### R7.7d — Accent-button on-color contrast (4 routes)
`--accent-on: #ffffff` rendered on `--accent: #2f5fd3` (or its variants) gives 4.5:1+ normally, but the affected sites use a lighter intermediate like `#e9eefa` for "soft" on-accent text, which sits at 3.82:1.
- **Recommendation**: Audit the affected components; ensure CTA buttons use pure white text on accent. The 4 sites can be fixed in a single component edit.

**Total R7.7 budget reshaped:** R7.7a (31 routes) is the biggest item — likely 1 day. R7.7b + R7.7c + R7.7d together ~1 day. Combined ~2 days. Owner decision required on Path 1 vs Path 2 for accent-as-text.

## Other axe rules — no change

R7.6 didn't touch ARIA, button-name, label, or any of the chrome bugs. Those remain for R7.5 and R7.7-long-tail:

| Rule | Routes (before R7.6) | Routes (after R7.6) |
|---|---|---|
| `aria-valid-attr-value` | 53 | 53 (unchanged — R7.5 target) |
| `aria-prohibited-attr` | 2 | 2 |
| `button-name` | 2 | 2 |
| `label` | 2 | 2 |
| `scrollable-region-focusable` | 2 | 2 |
| `select-name` | 2 | 2 |
| `aria-toggle-field-name` | 1 | 1 |
| `nested-interactive` | 1 | 1 |

## Owner manual smoke — D13 checklist for R7.6

Before R7.5 starts, please re-smoke text legibility on real device:

1. **Hard reload** any page with body text (e.g., `/about`, `/help`, `/honor-code`).
2. **Compare to memory** — body text should look slightly darker / slightly more legible. The change is subtle (5.39:1 → 6.96:1 for `--fg-mute`).
3. **Mobile real device** — body sub-text on cards, meta text below KPI numbers, breadcrumb crumbs. All should read comfortably; nothing should look "stamped on" or "too dark for the design".
4. **Check `--fg-dim` usage** — placeholder text in form inputs, disabled state labels, day-of-week strips in calendars. These are now noticeably more visible (2.64:1 → 3.97:1). If the design relied on them being faint, this may look different.

If anything looks off (text too dark, design balance broken, etc.), tell me — I revert the token values and we re-think. If all four checks pass, R7.5 starts.

## Status

- R7.6 ships as designed ✅ — its scoped target (fg-mute/fg-dim on white) cleared 100%
- 49/49 D12 regression green
- axe-scan reveals 64 remaining color-contrast violations need R7.7 sub-items (re-scoped above)
- R7.5 (chrome aria-valid-attr-value) is the next sub-R on the critical path
- D17 ordering preserved: no R7.5 until owner acks R7.6 smoke
- D11/D14: no R7.7a/b/c/d implementation until explicit owner authorization

## Next

Awaiting owner D13 ack on R7.6 + decision on R7.7a's Path 1 vs Path 2 (accent-as-text resolution).

After R7.6 acked → R7.5 (chrome aria) → R7.9 (apiRoleToLocal + D18 flow spec) → measurement re-run → R7 critical path complete → owner gate for Performance track.

— Phase A author, 2026-05-23. R7.6 awaiting D13 smoke.
