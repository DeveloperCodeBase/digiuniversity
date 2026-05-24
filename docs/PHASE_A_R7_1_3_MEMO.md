# Phase A R7.1.3 — Memo (conditional: Path B lazy below-fold OR Path C SSG)

## Header

This memo is **CONDITIONAL** on owner Decision 4 from `docs/PHASE_A_CLOSE_MEMO.md`:
- If owner picks **Path A (accept §1 🟡, close Gate A)** → this memo is reference-only.
- If owner picks **Path B (lazy below-fold)** → execute Section "Path B" below.
- If owner picks **Path C (SSG)** → execute Section "Path C" below.

Memo pre-staged so Decision 4 doesn't get blocked on memo-write latency.

## Common context

Phase A R7 sweep delivered `/` Lighthouse Perf 35 → 67 median / 84 best — a +32 to +49 point trajectory. The literal-100% ≥ 90 target is bounded by:
- 32-point variance band (CPU contention on Windows running headless Chrome)
- Style & Layout = 2.3s of main-thread budget (intrinsic to the SPA's design surface)

R7.1.3 picks one of two paths to chase the strict-90% reading.

---

## Path B — Lazy-load below-fold Home sections

### Goal

Defer rendering of below-fold Home content until after first paint, reducing React's initial render cost + Style&Layout work inside Lighthouse's TBT measurement window.

### Approach

1. Extract everything in `apps/web/src/pages/Home.tsx` from line 108 onwards (TrustStrip + StatsBand + FacultyShowcase + CatalogTeaser + Testimonials + the various `<section className="section">` blocks + helper components) into a new file `apps/web/src/pages/Home.below.tsx`.
2. Helper components defined inline in Home.tsx (Stat, Hero3DClassroom, Hero3DTutor, Hero3DAnalytics, Hero3DCredential, TrustStrip, StatsBand, FacultyShowcase, CatalogTeaser, Testimonials, etc.) — split into:
   - **stay in Home.tsx** (above-fold deps): Stat, Hero3DClassroom, Hero3DTutor, Hero3DAnalytics, Hero3DCredential
   - **move to Home.below.tsx** (below-fold): TrustStrip, StatsBand, FacultyShowcase, CatalogTeaser, Testimonials
3. In Home.tsx, replace the below-fold JSX block with:
   ```tsx
   const HomeBelow = React.lazy(() => import("./Home.below"));
   ...
   <React.Suspense fallback={null}>
     <HomeBelow go={go} />
   </React.Suspense>
   ```
   `fallback={null}` keeps the page paint clean — no loading UI flash.

### Predicted impact

| Metric | Pre | Predicted post-Path-B |
|---|---|---|
| `/` Perf median | 67 | ~72-77 (+5-10) |
| `/` Perf best | 84 | ~88-93 (+4-9) |
| Main JS bundle | 98 KiB | ~70-80 KiB (-25 KiB; HomeBelow becomes a separate chunk ~25-35 KiB) |
| LCP | 3.3-3.7 s | ~2.8-3.2 s (-0.5 s; smaller initial React tree paints faster) |
| TBT | 240-440 ms | ~150-300 ms (-100 ms; less reconciliation work in TBT window) |

**Confidence: medium-low.** Lighthouse SCROLLS to detect LCP candidates. If the scroll triggers HomeBelow's mount inside the TBT window, the gain inverts (similar to the content-visibility:auto regression in R7.1.2). The R7.1.2 lesson: below-fold deferral CAN fight Lighthouse's measurement methodology.

**Mitigation:** add an `IntersectionObserver` with `rootMargin: "800px 0px"` so HomeBelow mounts when the viewport approaches the fold. Lighthouse's typical 8000px-tall scroll-to-bottom probe would mount HomeBelow ~500ms into the simulation, possibly clean TBT window.

### Files touched (estimated)

| File | Lines | Purpose |
|---|---|---|
| `apps/web/src/pages/Home.tsx` | -700 / +30 | Remove below-fold JSX + helpers; add lazy import + Suspense |
| `apps/web/src/pages/Home.below.tsx` | +680 (new) | Extracted JSX + helper components |
| `apps/web/src/router.tsx` | 0 | No change (Home is already the entry chunk) |
| `apps/web/tests/visual/phase-a-r7-1-3-perf.spec.ts` | +80 (new) | Assert HomeBelow chunk exists separately; assert hero paints before HomeBelow mounts |

**Total: ~-700/+790 net (slight increase from helper splitting overhead).** Real fix-cost: ~30-50 lines.

### Risks

- **R1 — IntersectionObserver mount timing varies with viewport height.** On tall viewports, HomeBelow might mount immediately; on short viewports (Lighthouse mobile 360×640), it stays unmounted longer. Need to test both.
- **R2 — Hero3D* components defined in Home.tsx still need props/context.** The Hero3DCredential uses `<Icon>` and other shared deps; verify those still work after the split.
- **R3 — Reveal/Stagger animations inside the now-lazy HomeBelow.** These need to fire on scroll. IntersectionObserver in motion.tsx already handles this — should "just work" because Reveal is added INSIDE the lazy chunk's JSX, and IntersectionObserver fires when the chunk mounts + scrolls into view.
- **R4 — SEO impact.** Search bots that don't run JS would see only the hero. Probably not a concern (the SPA already requires JS for routing) but worth confirming for the marketing landing.

### Verification

1. Visual spec: assert HomeBelow chunk URL appears in main bundle's `__vite__mapDeps`.
2. Spec: assert HomeBelow JSX is NOT in the initial HTML response.
3. Lighthouse 3-run median: target Perf ≥ 80 on `/`.
4. Manual smoke: scroll `/` to bottom on mobile + desktop; verify all below-fold content renders correctly (no Suspense fallback gap; Reveal animations fire on scroll).

### Decision threshold for Path B success

- ✅ **If post-Path-B `/` median Perf ≥ 80 AND best ≥ 88 → PROCEED to Phase A close** with §1 as «🟡 partial PASS, near-90 median».
- ❌ **If post-Path-B `/` median Perf < 75 → REVERT** (same playbook as R7.1.2 revert) and recommend Path C.
- 🟡 **If 75 ≤ median < 80 → owner decides** — accept the modest improvement or escalate to Path C.

---

## Path C — Static Site Generation (SSG) for `/`, `/login`, `/programs`

### Goal

Pre-render the 3 §1 sampled pages as static HTML at build time. First paint doesn't wait for ANY JS execution. The SPA hydrates on top of the pre-rendered HTML.

### Approach

1. **Install `vite-plugin-ssg`** (or `vite-plugin-react-ssg`, whichever has better React 18.3 + react-router-dom 6.30 support at the time of execution).
2. **Configure SSG roots** in `vite.config.js`:
   ```ts
   ssg({
     includedRoutes: () => ["/", "/login", "/programs"],
   })
   ```
3. **Refactor `apps/web/src/main.tsx`** to use `ViteSSG` entrypoint instead of `ReactDOM.createRoot`. The new entrypoint accepts a `createApp` factory that returns the React app + router. At build time, vite-plugin-ssg renders this for each route and emits static HTML.
4. **SSG-safe useEffect handling.** The current `main.tsx` reads `localStorage` for theme — this runs only in browser. Wrap any `window`/`document` access in `if (typeof window !== "undefined")` guards. Verify AuthContext and useMouseParallax similarly guarded.
5. **Hydration mismatch detection.** Add `useId()` properly throughout; verify no `Math.random()` or `Date.now()` in initial-render paths (would cause server/client mismatch). The current codebase uses `Math.random()` in places (e.g., motion fly reactions) — these are post-mount only, so safe.

### Predicted impact

| Metric | Pre | Predicted post-Path-C |
|---|---|---|
| `/` Perf median | 67 | ~85-92 (+18-25) |
| `/` Perf best | 84 | ~95-100 (+11-16) |
| `/` Perf worst | 52 | ~75-82 (+23-30; variance band collapses because first paint is HTML, not JS-dependent) |
| FCP | 2.4 s | ~0.8-1.2 s (-1.2 to -1.6 s; HTML ships immediately) |
| LCP | 3.3 s | ~1.5-2.5 s (-1 to -2 s; LCP is in the static HTML) |
| TBT | 240-440 ms | ~100-200 ms (-150 ms; less JS to parse before TBT window closes) |

**Confidence: medium-high.** SSG is the right architectural fix for the diagnosis (Style&Layout cost intrinsic to the SPA's design). The variance band should collapse because HTML-first paint is deterministic.

### Files touched (estimated)

| File | Lines | Purpose |
|---|---|---|
| `apps/web/package.json` | +1 | Add `vite-plugin-ssg` (or equivalent) |
| `apps/web/vite.config.js` | +15 | SSG plugin config + included routes |
| `apps/web/src/main.tsx` | +20 / -10 | Switch to ViteSSG createApp entry; preserve theme bootstrap as a browser-side post-hydration effect |
| `apps/web/src/auth/AuthContext.tsx` | +5 / -2 | Guard `window` access with `typeof window !== "undefined"` checks; defer auth state to post-mount effect |
| `apps/web/src/motion.tsx` | +2 | Guard `window.matchMedia` calls similarly |
| `apps/web/index.html` | +0 (might need adjustments to mount point) | Default Vite mount works |
| `apps/web/tests/visual/phase-a-r7-1-3-ssg.spec.ts` | +100 (new) | Assert curl-fetched HTML contains hero text (not just SPA shell); assert FCP < 1.5s |
| **Docker build pipeline** | possible Dockerfile changes | SSG runs at build time; ensure the existing `npm run build` step now produces pre-rendered HTML |

**Total: ~150-250 lines real fix-cost** + 1-2 day debugging for hydration edges. Bigger but bounded.

### Risks

- **R1 — Hydration mismatch errors.** Server-rendered HTML must match client first-render. Any `Math.random()` / `Date.now()` / `localStorage` in initial render = mismatch error. Need a systematic guard pass.
- **R2 — Auth-aware redirect.** `/` redirects authed users to `/dashboard` via `useEffect`. The redirect would happen post-hydration (correct). But the pre-rendered HTML shows the public landing briefly before the redirect fires. Owner's R1.3-D11 directive — privacy leak — should NOT trigger because the pre-rendered HTML is the PUBLIC landing (no auth-user data leaked).
- **R3 — Build pipeline complexity.** `npm run build` now does a full Node-side React render for each SSG route. Increases build time ~30-60s. Acceptable.
- **R4 — Vite plugin churn.** `vite-plugin-ssg` ecosystem has ~5 options with varying React 18 support. Pick one, pin the version.
- **R5 — Workspace routes still SPA-mode.** SSG only pre-renders `/`, `/login`, `/programs`. The other 60+ routes stay client-rendered (correct; they need auth).

### Verification

1. `npm run build` produces `dist/index.html`, `dist/login/index.html`, `dist/programs/index.html` with pre-rendered hero text + brand visible in raw HTML.
2. Curl each URL — assert hero text is present in the response body (not just the SPA shell `<div id="root"></div>`).
3. Lighthouse 3-run median: target Perf ≥ 90 on each of /, /login, /programs.
4. Manual smoke: load `/` with JS disabled — page should still render the hero correctly (degrades gracefully).

### Decision threshold for Path C success

- ✅ **If post-Path-C `/` median Perf ≥ 90 AND best ≥ 95 → CLOSE Gate A as 6/6 ✅.**
- 🟡 **If 85 ≤ median < 90 → owner judgment** — likely close anyway given the variance collapse.
- ❌ **If median < 85 → REVERT** (hydration mismatches or measurement methodology still in play); fall back to Path A.

---

## Combined recommendation

If owner picks neither A nor B nor C explicitly, the standing recommendation:

1. **Path A (accept) is the rational default.** The Phase A R7 sweep delivered the foundation repair the Compass roadmap intended. Variance band reality means literal-90% isn't a reliable target on this stack/measurement combination. D31 precedent allows owner discretion.

2. **Path C (SSG) is the right tech path if the score literal-100% matters.** It addresses the root cause (Style&Layout cost during first paint). The architectural change is genuinely Phase-B-shaped, so doing it post-Gate-A close might mix concerns.

3. **Path B is a hedge.** Could give +5-10 points but might revert (like R7.1.2 did). Not strictly better than A.

## Standing instruction

«**memo نوشتی، stop + owner memo review. هیچ code تا owner ack.**» — applies again here.

Owner picks:
- A → close Gate A. Phase B memo next.
- B → execute Section "Path B" of this memo.
- C → execute Section "Path C" of this memo.
- D (re-measure on different hardware) → arrange Linux+Docker box for variance check; might shift the picture.

— Phase A author, 2026-05-24. R7.1.3 conditional memo pre-staged. Three forward paths fully documented. Standing by.
