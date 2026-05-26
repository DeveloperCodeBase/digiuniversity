# Phase A R7.1+R7.2 Resume — Baseline Measurement (post-R-Landing-v2)

**Date:** 2026-05-26
**Trigger:** D56 — R-Landing-v2 closed (D13 owner ack), R7.1+R7.2 resume per D33 + D25.
**Source data:** 3 Lighthouse mobile runs at `docs/gate-a-evidence/r7-resume-baseline/`.

## Implementation state (verified pre-baseline)

All scoped R7.1+R7.2 items are **already shipped** in production:

| Item | Status | Evidence |
|---|---|---|
| R7.1.a Vite manualChunks | ✅ | `vite.config.js` react-vendor + radix-vendor |
| R7.1.b React.lazy() for workspace routes | ✅ | `router.tsx` 8 lazy routes |
| R7.1.c `<link rel="modulepreload">` | ✅ | Vite 5 default emits for both vendors; verified in served HTML |
| R7.2.a Vazirmatn self-host (500/600/700/800) | ✅ | `main.tsx` @fontsource imports |
| R7.2.b Bricolage + JetBrains Mono self-host | ✅ | `main.tsx` imports |
| R7.2.c Google Fonts `<link>` removed | ✅ | `index.html` confirms removal |
| R7.2.d Workbox runtimeCaching strip | N/A | SW disabled per D45 |

## Lighthouse scores — current state

| Page | Perf | A11y | FCP | LCP | TBT | CLS | Total bytes |
|---|---:|---:|---|---|---|---:|---|
| `/` | **43** 🔴 | 100 ✅ | 2.7 s | **8.5 s** 🔴 | **1,130 ms** 🔴 | 0 ✅ | 3,240 KiB |
| `/login` | **70** 🟡 | 100 ✅ | 2.1 s | 2.7 s ✅ | 650 ms 🟡 | 0.033 ✅ | — |
| `/programs` | **63** 🟡 | 96 ✅ | 2.5 s | 5.2 s 🟡 | 480 ms ✅ | 0 ✅ | — |

## Delta vs prior baselines

| Page | Gate A round 1 (pre-R7) | Post-R-Landing-v1 D33 (peak) | **Now (post-R-Landing-v2)** | Δ vs peak |
|---|---:|---:|---:|---:|
| `/` | 66 | 85 | **43** | **−42** 🔴 |
| `/login` | 100 | (n/a) | **70** | — |
| `/programs` | 66 | (n/a) | **63** | — |

`/` performance has **collapsed** from R-Landing-v1's 85 (D33 era) to 43 — a 42-point drop.

## Root cause analysis — image weight

**Home LCP element** (from `home.report.json`):
```
selector: "div.shell > div.hero-headline > div.hero-logo-mark > img"
i.e. /landing-v2/light-logo.png — 286 KB on the critical path
```

**Image asset inventory** (`apps/web/public/landing-v2/`):

| File | Size | Used in |
|---|---:|---|
| `light-logo.png` | **286 KB** | **Hero (LCP critical path)** + Footer |
| `dark-logo.png` | 285 KB | (legacy, not referenced) |
| `jahad-light.png` | 286 KB | Footer (D52) |
| `jahad-dark.png` | 285 KB | AppShell Nav + hero cobrand chip |
| `airac-white.png` | 29 KB | Hero cobrand chip |
| `faculty/m1.jpg` | 121 KB | FacultyV2 |
| `faculty/m2.png` | **1,178 KB** | FacultyV2 |
| `faculty/m3.png` | **1,577 KB** | FacultyV2 |
| `faculty/m4.png` | **2,150 KB** | FacultyV2 |
| `faculty/w1.jpg` | 76 KB | FacultyV2 |
| `faculty/w2.png` | **1,240 KB** | FacultyV2 |
| `faculty/w3.png` | **1,354 KB** | FacultyV2 |
| `faculty/w4.png` | **1,918 KB** | FacultyV2 |
| `students/student-man-1.jpg` | 121 KB | TestiV2 |
| `students/student-woman-1.jpg` | 76 KB | TestiV2 |
| `students/student-woman-2.png` | **1,354 KB** | TestiV2 |

**Total uncompressed PNG portrait weight: ~11.5 MB.** Faculty PNGs alone = ~9.4 MB.

**Why this happened:** R-Landing-v2 vol-1 (D48 Commit G) staged 8 faculty portraits + 4 brand logos directly from `docs/my-upload/landing-v2/uploads/` without any image-optimization step. Originals were left at full resolution — the `.png` variants are 1–2 MB each (versus the available `.jpg` variants which are 76–121 KB).

**LCP narrative:** the new D55 hero logo lockup (`light-logo.png` 286 KB) became the LCP element. Combined with the deferred-but-decoding faculty portraits the main thread spent 1,130 ms blocked during the LH simulation window.

## Per-axis findings

- **Bundle size:** healthy. Vite chunks split as planned (react-vendor + radix-vendor + per-route lazy). No JS bloat regression vs D33 era.
- **Font transfer:** healthy. Self-hosted @fontsource serves trimmed weights as same-origin woff2.
- **CSS payload:** healthy. home-v2.css (~99 KB) is in the cascade but scoped to `.home-shell-v2` so cost is parse-time only.
- **Image weight:** **CATASTROPHIC.** This is the single root cause of the `/` Perf regression.
- **TBT 1,130 ms:** mostly image-decode time for the lazy PNGs that hydrate during the scroll-into-view window measured by Lighthouse.

## Proposed path forward — R7.1.5 (image-optimization fine-tuning sub-R)

Per owner directive «اگه page یا duo زیر 90: R7.x.1 fine-tuning sub-R، نه backtrack». Open the R7.1.5 sub-R immediately as a single-commit fine-tune:

**Fix 1 — Hero LCP logo swap (highest impact, ~286 KB → ~29 KB):**
- `Home.tsx` `hero-logo-mark img src`: `/landing-v2/light-logo.png` → `/landing-v2/airac-white.png` (the existing 29-KB AIRAC wordmark variant) OR replace with an inline SVG composition.
- Expected delta: LCP 8.5 s → ~3 s, Perf `/` 43 → 65–75.

**Fix 2 — Faculty portrait PNG → JPG swap (high impact, ~9.4 MB → ~1 MB):**
- Current FacultyV2 uses 2 JPGs (m1, w1) + 6 PNGs (m2-m4, w2-w4). Owner's `uploads/` only has these 2 JPG sources.
- Option A: reduce FacultyV2 from 8 cards → 4 cards (just m1 + w1 + 2 more from JPG pool). Loss: less faculty diversity.
- Option B: ship a tiny image-optimize step in build (sharp / squoosh-cli) to auto-compress PNGs at deploy time. Adds dependency.
- Option C: ask owner for JPG variants of m2/m3/m4/w2/w3/w4.

**Fix 3 — fetchpriority + decoding hints:**
- Hero logo: `fetchpriority="high" decoding="sync"`.
- Faculty + Testi portraits: keep `loading="lazy"` + add `decoding="async" fetchpriority="low"`.
- Expected delta: TBT 1,130 ms → ~400-600 ms.

## Recommendation

**Ship Fix 1 + Fix 3 immediately** as `R7.1.5.a` (single commit, < 50 LOC). Expected impact:
- `/` Perf: 43 → ~70+ (still under 90 because faculty PNGs still drag during scroll)
- Re-measure post-deploy
- Then evaluate Fix 2 path with owner — needs decision between Option A/B/C

This keeps the loop tight: 1 commit → 1 deploy → 1 measure → owner decision on next slice.

## R7.1.5.a post-deploy results (Fix 1 + Fix 3 shipped)

After commit `b1b9he6vc` (hero `light-logo.png` → `airac-white.png` + fetchpriority/decoding hints on all portraits) deployed:

| Metric | Baseline | Post-R7.1.5.a | Δ |
|---|---:|---:|---:|
| `/` Perf | 43 | **65** | **+22** ✅ |
| `/` FCP | 2.7 s | 2.2 s | −0.5 s |
| `/` LCP | 8.5 s | 5.6 s | **−2.9 s** ✅ |
| `/` TBT | 1,130 ms | 330 ms | **−800 ms** ✅ |
| `/` CLS | 0 | 0 | stable |
| `/` total bytes | 3,240 KiB | 2,953 KiB | −287 KiB (matches logo Δ) |
| `/` A11y | 100 | 100 | stable ✅ |

**Single-commit impact:** +22 Perf points from one image swap + 3 lines of priority hints. The hero is no longer the LCP-killer; the remaining 5.6 s LCP is now the faculty/testimonial portrait section scrolling into the LH simulation viewport (Fix 2 territory).

## Path to ≥ 90

Remaining gap to ≥ 90 on `/` is ~25 points. Highest-impact remaining lever is **Fix 2 — faculty PNG compression**. Three options for owner decision:

- **A — Reduce 8 → 4 faculty cards.** Use only the 2 small JPGs (m1 + w1) twice each or split into 4 unique JPG slots. Loss: half the faculty diversity. ~9 MB → ~400 KB.
- **B — Add image-optimize build step.** Install `sharp` + small Vite plugin to auto-resize/recompress PNGs → WebP at build time. ~9 MB → ~500 KB. New dependency, ~5 min npm install in build container.
- **C — Owner re-uploads optimized JPGs.** Owner provides m2/m3/m4/w2/w3/w4 as 800px-wide JPGs ~80 KB each → drop-in swap. Cleanest, no new dependency, blocks on owner action.

## Status

| Item | Status |
|---|---|
| Baseline measured | ✅ |
| Root cause identified | ✅ image weight (hero LCP + faculty PNGs) |
| R7.1+R7.2 implementation | ✅ already shipped pre-resume |
| R7.1.5.a hero swap + hints | ✅ shipped, +22 Perf delta verified |
| Fix 2 faculty PNG compression | ⏳ owner decision: A / B / C |
| §1 Perf ≥ 90 on all 3 pages | 🟡 currently 65 / 70 / 63 (gap ~25 on /, ~20 on /login, ~27 on /programs) |
| Regression sweep | ⏳ post-Fix 2 |

— Phase A author, 2026-05-26.
