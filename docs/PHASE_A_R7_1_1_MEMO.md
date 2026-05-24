# Phase A R7.1.1 — Memo (Style & Layout reduction for the Perf tail)

## Header

This memo is **CONDITIONAL** on owner Decision 3 from R7.1+R7.2 D13:
- If owner picks «accept §1 Perf 🟡 partial» → R7.1.1 is shelved; Gate A closes with §1 partial.
- If owner picks «spin R7.1.1 to chase ≥ 90» → this memo is the plan.

The memo is committed now so owner has the concrete plan in hand BEFORE making Decision 3, not after.

## Goal — single sentence

Lift Lighthouse-mobile Performance on `/` (73 → ≥90) and `/programs` (77 → ≥90) by reducing the Style & Layout main-thread cost from 2.3s to ~1.0s. `/login` (87) is within noise of 90 — included as a side-effect target.

## Bottleneck recap (from R7.1+R7.2 review)

| Phase of main-thread work on `/` | Cost | Lever |
|---|---|---|
| **Style & Layout** | **2.3 s** ← target | CSS/layout cost during initial paint |
| Other (compositor, GC) | 765 ms | Indirect; reducing Style&Layout reduces this too |
| Script Evaluation | 308 ms | Already optimized via R7.1.b |
| Long task on main doc | 858 ms (one task) | Landing hero React render + animated canvas |
| Long tasks on radix-vendor | 4 × ~80-270 ms | Radix primitives' init |

**TBT is currently 440 ms post-R7.1+R7.2.** Score-wise the 90 target needs TBT ≤ ~200 ms.

## Three independent levers

### R7.1.1.a — Defer Home hero animated canvas

The landing's hero section has an animated SVG/canvas (the brand visual). It paints synchronously on mount. Deferring it via IntersectionObserver/requestIdleCallback would skip the work for above-the-fold first paint.

**Files:** `apps/web/src/pages/Home.tsx` (hero section block) + possibly `styles.css` (animation keyframes).

**Change shape:** wrap the canvas component in an `<IntersectionObserver>` or `useEffect(() => requestIdleCallback(() => setShowCanvas(true)))` pattern so the canvas mounts only after the first paint completes.

**Predicted impact:** -300-500ms off the 858 ms main-doc long task → TBT drops ~150 ms.

### R7.1.1.b — Tailwind purge tightening

The main CSS bundle includes Tailwind utilities used by ALL pages (lazy ones too). A more aggressive purge could strip utilities that are ONLY used by lazy-loaded pages.

**Approach:** confirm `tailwind.config.js`'s `content` glob already restricts to relevant files. If so, the next step is to split CSS per route — each lazy chunk includes its own page-specific CSS. Vite handles this automatically when `vitePlugin.css.codeSplit` is enabled (it's the default).

**Files:** `tailwind.config.js` (verify), `vite.config.js` (no change — codeSplit is default).

**Predicted impact:** -200-400ms off Style & Layout via smaller initial CSS parse.

**Risk:** Tailwind classes that are dynamically computed (e.g., `${variant === "primary" ? "bg-blue-500" : "bg-gray-500"}`) need explicit safelisting OR pre-defined string maps. The current codebase already uses this pattern.

### R7.1.1.c — Strip CSS animations from above-the-fold

Several `@keyframes` rules trigger composite-layer work on initial paint:
- `.reveal` (Stagger entry animation)
- `.r6-speaking-indic` (classroom pulse — but not on /)
- `.brand-mark::before` (radial pulse on the navbar mark)

The `.reveal` Stagger is on the landing's content sections. Disabling it for the FIRST visible row + delaying for subsequent rows would cut Style&Layout work.

**Files:** `styles.css` (`.reveal`, `.stagger`) + possibly `apps/web/src/motion.tsx` (Stagger component logic).

**Approach:** add a `:nth-child(n+4) { animation-delay: 0; transform: none }` carve-out OR gate the entire animation via `prefers-reduced-motion`. (Already gates for users who set the OS preference; we'd be enabling it for everyone on first paint.)

**Predicted impact:** -300-500ms off Style & Layout for the landing.

## Combined predicted result

| Page | Current Perf | After R7.1.1.a | + R7.1.1.b | + R7.1.1.c | Combined |
|---|---|---|---|---|---|
| `/` | 73 | ~78 | ~82 | ~85 | **~88-92** |
| `/login` | 87 | ~88 | ~89 | ~89 | **~90-92** |
| `/programs` | 77 | ~82 | ~85 | ~85 | **~85-90** |

**Confidence: low-medium.** Style & Layout reduction is harder to predict than JS chunking. Real-device variability + Lighthouse mobile emulation noise can swing scores ±3-5 points. The "combined" column might be 85 / 90 / 83 OR 92 / 93 / 88 — same shape, different numbers.

If R7.1.1 lands and `/` is still at 85-89, the next sub-R candidate is R7.1.2 (CSS-only refactor — drop variable fonts in favor of static woff2, simplify the hero markup).

## Files touched (estimated scope)

| File | R7.1.1 lines | Purpose |
|---|---|---|
| `apps/web/src/pages/Home.tsx` | +15 / -5 | Defer canvas mount via IntersectionObserver |
| `apps/web/src/motion.tsx` | +5 / -2 | Stagger first-N gate |
| `apps/web/styles.css` | +20 / -5 | `.reveal` first-batch carve-out + cleanup |
| `apps/web/tailwind.config.js` | +0 / -0 | Audit only (no change if config is already tight) |
| `apps/web/vite.config.js` | +3 / -0 | Add `cssCodeSplit: true` explicit (it's default but worth pinning) |

**Total estimate: ~40-50 lines** across 4-5 files. Half the size of R7.1+R7.2.

## New tests required

- **`apps/web/tests/visual/phase-a-r7-1-1-perf.spec.ts`** (new):
  - Assert hero canvas is NOT mounted until after FCP (via Performance Observer or wait-and-check).
  - Assert `.reveal` first 3 elements have `animation-duration: 0` or are skipped.
  - Assert main CSS bundle size dropped (compare gzipped size from production).

## Regression scope

Same 8-spec sweep as R7.1+R7.2. Animation changes might surface in R3 dashboards / R6 classroom snapshot tests if any rely on the Stagger entry animation. Expect 1-2 baseline updates if those tests are time-sampled mid-animation.

## D29 pre-smoke plan

If Chrome Extension is connected by then:
- Navigate `/`, `/programs`, `/login` — confirm hero canvas eventually appears (within 2s post-load); content above-the-fold paints immediately.
- Run a Performance recording in DevTools (or via the extension if it supports it) — confirm Style & Layout time on `/` is < 1.5s.

If not connected: visual specs fill the role, same as R7.3 + R7.1+R7.2.

## D13 owner manual smoke checklist (~5-8 min)

1. **Hero animation behavior on `/`** — load on real mobile. The brand mark + hero text should paint immediately. The animated canvas (if any) should appear within ~1-2s, NOT block paint. Stagger animations should still feel intentional on subsequent scrolls.
2. **Visual sanity** — no broken layouts, no missing animations on lower-fold content.
3. **Lighthouse mobile re-run** — `/`, `/programs`, `/login` from Windows host. Perf should be ≥ 88 on each.

## Risks + open questions

### R1 — Stagger feel regressing

If we disable `.reveal` for the first N elements, the page might feel less polished on initial load. Owner D11/D14 (brand-protection decisions) suggest preserving the design intent.

**Mitigation:** Option A: drop the animation only for the FIRST row visible (e.g., hero block); subsequent rows below the fold keep Stagger as today. Option B: shorten the animation duration to ~150ms instead of disabling. Memo defaults to Option A (zero-impact on perceived motion on lower-fold).

### R2 — IntersectionObserver mobile/Safari coverage

iOS Safari supports IntersectionObserver since 12.0 (2018). Should be fine. Polyfill via `intersection-observer` package if any old Safari complaints — unlikely.

### R3 — Style & Layout reduction predictions may be off

Lighthouse's per-phase breakdown is sampling-based. My predicted -300-500ms per fix is from rule-of-thumb (similar before/after patterns in other projects). Real number could be ±50%.

**Mitigation:** ship R7.1.1.a alone first, re-measure. If Perf moves +3-5 on `/`, the trajectory is on track and we add R7.1.1.b + .c. If only +1, the bottleneck is elsewhere and we pivot.

### Q1 — Scope: ship a/b/c combined or sequential?

**Memo defaults to sequential** (a first, measure, then b + c if needed). Combined is faster ship but harder to isolate which lever delivered.

### Q2 — Acceptable lower bound

If R7.1.1 lands and Perf is 85-89 on `/`, is that:
  - "🟢 close enough, accept and close Gate A" — owner discretion per D31 precedent.
  - "spin R7.1.2 for one more pass" — diminishing-returns territory.

Memo recommends: owner sets the bar before R7.1.1 starts. If 88+ is acceptable, R7.1.1 is sufficient. If literal 90 is required, R7.1.2 may be needed.

## Standing instruction per workflow

«**memo نوشتی، stop + owner memo review. هیچ code تا owner ack.**»

This memo is conditional. It only enters execution if owner picks Decision 3 = «spin R7.1.1». If owner picks Decision 3 = «accept §1 🟡 partial», this memo is documentation-only and the next sub-R is the Phase A close ceremony.

Awaiting owner ack of either:
  (a) «accept §1 🟡, close Gate A» — this memo shelved as reference.
  (b) «spin R7.1.1» — start coding (sequential a → measure → b/c).

— Phase A author, 2026-05-24. R7.1.1 memo pre-staged so the owner's Decision 3 doesn't get blocked on memo-write latency.
