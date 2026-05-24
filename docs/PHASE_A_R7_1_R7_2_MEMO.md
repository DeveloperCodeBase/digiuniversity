# Phase A R7.1 + R7.2 — Memo (Performance track: Vite chunks + Vazirmatn self-host)

## Header — approved decisions

- **D17** R7 sweep critical-path order.
- **D25** Performance track is sequential AFTER the a11y track.
- **D29** Pre-smoke automation via Chrome Extension.
- **D32** R7.3 closed; §1 a11y subset ✅; only §1 Perf subset blocks Gate A.
- **Owner directive 2026-05-24** «forward progress متوقف نکن» — R7.1+R7.2 next.

## Goal — single sentence

Lift Lighthouse-mobile Performance on the three §1 sampled pages (`/`, `/login`, `/programs`) from **66 / 100 / 66** to **≥ 90** by chunking the SPA bundle (eliminating the 168 KB of unused JS on `/`) and self-hosting Vazirmatn (eliminating the 199 KB Google Fonts third-party transfer).

After R7.1+R7.2 ship and verify, §1 flips from 🟡 partial → ✅ PASS. Gate A then has zero blocking criteria.

## Combined vs split rationale

The memo proposes **combined R7.1+R7.2** for three reasons:

1. **Shared measurement surface.** The Lighthouse Perf re-measure is one run for both. Splitting forces two re-runs with intermediate noise.
2. **Risk-amortizing.** R7.1 alone may not hit 90 (chunks reduce parse + execution time but LCP is still bottlenecked on font fetch); R7.2 alone may not hit 90 (font self-host removes a third-party request but the main JS bundle still has unused code). Combining lets the per-page deltas sum.
3. **Scope-shape comparable to prior sub-Rs.** R7.1 touches vite.config.ts + ~5 route files (+~60 lines). R7.2 touches index.html + styles.css + woff2 assets (+~30 lines + binary assets). Combined still under the 300-line target.

If owner prefers split: R7.1 first, then R7.2 a few hours later. Memo carries both plans either way.

## Audit trace — what Lighthouse Perf actually flags

Extracted from `docs/gate-a-evidence/lh-landing-mobile.report.json` (latest post-R7.3, fetchTime 2026-05-24T07:33:45Z):

| Metric | `/` value | Score | Bucket |
|---|---|---|---|
| **LCP** (largest-contentful-paint) | **6.1 s** | **0.12** 🔴 | Network + render; fonts block paint of hero text |
| **FCP** (first-contentful-paint) | **4.8 s** | **0.11** 🔴 | Same root cause as LCP |
| Speed Index | 4.8 s | 0.67 🟡 | Derived from FCP |
| TTI (interactive) | 6.3 s | 0.61 🟡 | Bootup + main thread |
| Main thread work | 7.4 s | 0.5 🟡 | JS parse + execute |
| **unused-javascript** | **329 KiB savings** | **0** 🔴 | The smoking gun |
| Bootup time | 0.9 s | 1.0 ✅ | Once code parses, execution is fast |
| TBT | 0 ms | 1.0 ✅ | No long tasks |
| CLS | 0.009 | 1.0 ✅ | Layout-stable |
| Total byte weight | 1057 KiB | 1.0 ✅ | Within budget (but composition is wrong) |
| Server response | 2.7 ms | 1.0 ✅ | nginx is fast |
| Render-blocking resources | 0 | 1.0 ✅ | No blocking CSS |

**Two leverages to move the needle:**

### Leverage A — Unused JS on `/` is 168 KiB (69.8% of main bundle)

```
url: https://digiuniversity.ir/assets/index-D0AWi8kr.js
total: 241375 bytes (~241 KiB compressed)
wasted: 168588 bytes (~168 KiB unused on /)
wasted%: 69.8%
```

The current Vite config has **no manual chunks**. Every route's React component, every Radix UI component, every page's atoms — all in one bundle. The landing page (`/`) downloads code for `/classroom`, `/admin`, `/super`, all 10 dashboards, all 49 routes — and never executes it.

### Leverage B — Google Fonts transfer is 199 KiB

```
entity: Google Fonts
transferSize: 198735 bytes
mainThreadTime: 16.3 ms (negligible)
blockingTime: 0 ms (font-display: swap is in effect)
```

The `<link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" />` line in `apps/web/index.html` loads:
- Vazirmatn at **7 weights** (300/400/500/600/700/800/900). The CSS actually uses 500/600/700/800. 3 weights are over-fetched.
- Bricolage Grotesque at **5 weights × variable** axis. The CSS uses it for headings only (`--f-display`).
- JetBrains Mono at **4 weights**. The CSS uses it for the `.eyebrow` / numeric strings.

All three fonts come from `fonts.gstatic.com` — that's two TCP/TLS round trips to a third-party origin before paint. The PWA SW caches them after the first visit, but for cold loads (incognito + hard reload, which is the §1 measurement mode), it's the full 199 KiB.

## R7.1 — Vite manual chunks + React.lazy route splitting

### R7.1.a — Manual chunks (vite.config.ts)

Add to `vite.config.ts` under `build`:

```ts
build: {
  target: "es2020",
  sourcemap: true,
  rollupOptions: {
    output: {
      manualChunks: {
        // Vendor chunks — code that's shared across most routes.
        // Splitting these out lets the browser cache them long-term;
        // a SPA bundle change (per-deploy) doesn't invalidate vendors.
        "react-vendor": ["react", "react-dom", "react-router-dom"],
        "radix-vendor": [
          "@radix-ui/react-dialog",
          "@radix-ui/react-dropdown-menu",
          "@radix-ui/react-slot",
          // ... whatever Radix packages we actually depend on.
        ],
        "axe-vendor": ["@axe-core/react"],
        // motion / icons / utility code that ships everywhere.
        "ui-shared": ["framer-motion"],
      },
    },
  },
},
```

**Effect:** the main bundle drops to ~80-100 KiB (only the routing shell + landing code). The vendor chunks become long-cached files that aren't re-downloaded across deploys (their content-hash is stable until a vendor upgrade). Each route's lazy chunk is downloaded on-demand.

### R7.1.b — React.lazy for workspace routes

In `apps/web/src/router.tsx`, convert workspace route imports from:

```ts
import { DashboardPage } from "./pages/Dashboard";
```

to:

```ts
const DashboardPage = React.lazy(() => import("./pages/Dashboard"));
```

Wrap the route render in `<React.Suspense fallback={<PageLoader />}>`. Public routes (`/`, `/about`, `/programs`, `/login`, `/register`) **stay eagerly imported** — they're the entry points and need to render fast.

**Effect:** workspace route code (which is most of the unused-JS-on-/) becomes lazy-loaded. The 168 KiB savings on `/` becomes real.

### R7.1.c — Preload critical chunks

Add a `<link rel="modulepreload">` for the react-vendor + landing chunk in `apps/web/index.html`. This lets the browser fetch them in parallel with the main HTML parse.

**Files touched (R7.1):**
- `apps/web/vite.config.ts` (+~15 lines manualChunks block)
- `apps/web/src/router.tsx` (+~40 lines: lazy + Suspense for workspace routes, ~30 routes)
- `apps/web/index.html` (+~2 lines modulepreload)

## R7.2 — Self-host Vazirmatn + drop unused weights

### R7.2.a — Self-host Vazirmatn (primary Persian font)

Install `@fontsource-variable/vazirmatn` (or `@fontsource/vazirmatn` for static weights):

```bash
# On VPS during build (Dockerfile-level, NOT on Windows host)
npm install @fontsource/vazirmatn
```

Import only the weights actually used. From the CSS audit (`grep font-weight`):
- 600 (used 25 times)
- 700 (used 21 times)
- 500 (used 11 times)
- 800 (used 8 times)

Drop 300/400/900 (zero uses or covered by browser defaults).

In `apps/web/src/main.tsx` or styles.css entry:

```ts
import "@fontsource/vazirmatn/500.css";
import "@fontsource/vazirmatn/600.css";
import "@fontsource/vazirmatn/700.css";
import "@fontsource/vazirmatn/800.css";
```

These resolve to local woff2 files served from the same origin (no third-party request).

### R7.2.b — Bricolage Grotesque + JetBrains Mono: owner decision

Two options:

**Option B1 — Keep both, self-host.** `npm install @fontsource/bricolage-grotesque @fontsource/jetbrains-mono`. Import only the used weights. Saves the third-party transfer but adds ~70-100 KiB of self-hosted woff2.

**Option B2 — Drop both, fallback to system.**
- `--f-display: "Vazirmatn", system-ui, sans-serif` (use Vazirmatn for display too)
- `--f-mono: ui-monospace, "JetBrains Mono", monospace` (Lighthouse will resolve to ui-monospace on most platforms — `Cascadia Code` on Windows, `SF Mono` on Mac, etc.). Persian eyebrow text loses the JetBrains aesthetic but stays readable.

**Memo proposes Option B1 (keep both, self-host)** — preserves the design intent. Option B2 saves more bytes but degrades the brand visual. Owner can override.

### R7.2.c — Drop Google Fonts CSS link from index.html

Remove the `<link href="https://fonts.googleapis.com/css2?...">` line from `apps/web/index.html` once self-hosted fonts are imported. Also remove the `<link rel="preconnect" href="https://fonts.googleapis.com" />` and `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />` lines (no longer needed).

### R7.2.d — Update PWA workbox font caching

The current `vite.config.ts` has a `runtimeCaching` rule for `fonts.googleapis.com` + `fonts.gstatic.com`. Remove that rule (no longer needed — local fonts are precached by workbox automatically via the `globPatterns: ["**/*.{js,css,html,svg,woff2}"]` entry).

**Files touched (R7.2):**
- `apps/web/package.json` (+~2 deps)
- `apps/web/src/main.tsx` (+~6 import lines)
- `apps/web/index.html` (-~3 lines)
- `apps/web/vite.config.ts` (-~9 lines, the Google Fonts runtimeCaching rule)
- `apps/web/styles.css` (-~0 — `--f-sans/display/mono` definitions stay, the local fonts have the same family names)

## Predicted Lighthouse Perf delta per page

| Page | Pre-R7.1+R7.2 | R7.1 only | R7.2 only | R7.1+R7.2 combined |
|---|---|---|---|---|
| `/` | 66 | ~75 | ~78 | **~88-94** |
| `/login` | 100 (anomaly) | ~95 | ~95 | ~95+ (already high) |
| `/programs` | 66 | ~72 | ~78 | **~85-92** |

**Confidence: medium-low.** Lighthouse Perf is heavily metric-weighted (LCP 25%, FCP 10%, TBT 30%, CLS 25%, SI 10%). My estimates depend on:
- How much of the 168 KiB unused JS is on the LCP critical path (some is in routes Lighthouse never visits — pure win when lazy-loaded).
- Whether self-hosted Vazirmatn ships in time for the first paint (font swap behavior).
- Real-world variability of Lighthouse mobile emulation (4× CPU + Slow 4G; ±5 points run-to-run is normal).

**Backup plan if a page lands at 85-89:** identify the dominant remaining audit (likely LCP element optimization — hero image preload, or critical-CSS extraction) and either fix in-scope or document as R7.1+R7.2-followup. The 90 goal is owner-set; if real number is 87 owner can re-set.

## New tests required

- **`apps/web/tests/visual/phase-a-r7-1-r7-2-perf.spec.ts`** (new). Assertions:
  - Bundle structure: `/` requests `react-vendor-*.js` + `index-*.js` (≤120 KiB combined for the main chunk); workspace route chunks NOT in the initial request waterfall.
  - Font loading: no request to `fonts.googleapis.com` or `fonts.gstatic.com` on `/` (cold load).
  - Computed `font-family` of `body` resolves to `Vazirmatn`.

The existing `gate-a-axe-scan.spec.ts` regression coverage still applies — chunking shouldn't break any axe surface.

## Regression scope

Run the standard 8-spec sweep (R1.1 + R3 + R5 + R6 + R6.6 + R7.7 + R7.7.3 + R7.12 + gate-a-role-routing) post-deploy. Lazy-loading workspace routes might surface a regression if a spec assumes synchronous component mount; the `<Suspense>` fallback should handle it, but worth verifying.

## Pre-smoke plan per D29 (Chrome Extension)

**Prerequisite:** the Claude in Chrome extension must be connected on the owner laptop. R7.3 verification documented that it was not connected — D29 fell back to visual specs. Owner: please install/connect the extension before this sub-R kicks off.

**If extension connected:**
- Navigate `/`, `/login`, `/programs`, plus 2-3 workspace routes (`/dashboard`, `/programs/cs410`, `/profile`) to exercise the lazy-load path.
- Confirm each loads without console error.
- Capture screenshot at LCP + after 2s settle.
- Check DevTools Network tab: vendor + main + route chunks separately fetched, no fonts.gstatic.com requests.
- Silent-fix attempts: 3/3.

**If extension NOT connected:**
- The R7.1+R7.2 spec covers the bundle structure + font assertions. Visual specs fill the broader role as in R7.3.
- D13 owner manual smoke remains the formal gate.

## D13 owner manual smoke checklist (~10-15 min, mobile + incognito + hard reload)

1. **Cold load `/`** — incognito mobile, hard reload. Page should paint within ~2-3s (was 4.8s). Hero text + brand should render without visible "font flash" (FOUT). Test with airplane-mode toggle to simulate the slow-4G profile.
2. **Click into `/programs`** — first navigation triggers a lazy-chunk fetch. Confirm no white screen or hanging Suspense; the route renders within ~500ms after click.
3. **Click into `/dashboard` (after login)** — same lazy-load check on the workspace side. Sidebar drawer should still open immediately.
4. **Devtools Network tab inspection** — open `/` in a desktop Chrome incognito with devtools open. Filter Network to JS — confirm 2-3 chunks (vendor + main + maybe ui-shared). Filter to Font — confirm woff2 requests are same-origin (`digiuniversity.ir/assets/...woff2`), zero requests to `fonts.gstatic.com`.
5. **Lighthouse mobile re-run on real device** — if owner has time, run Lighthouse from a real mobile (PageSpeed Insights on the phone) for sanity check.
6. **Rapid navigation stress** — click between `/`, `/programs`, `/about`, `/login` rapidly. Confirm no visible layout shift or font swap during transitions.

## Risks + open questions

### R1 — Lazy-loading + Suspense + auth race

When `/dashboard` lazy-loads while AuthContext is still bootstrapping, the Suspense fallback might show before the auth gate decides to redirect. Mitigation: ensure auth bootstrap completes before any workspace route renders (might already be the case via `<UIRoot>` wrapper).

### R2 — Self-hosted Vazirmatn file size vs cached Google Fonts

Owner laptop users have a long-cached Google Fonts copy. Self-hosting means a one-time re-download. First-visit-after-deploy is slower for them; subsequent visits are faster.

### R3 — Bundle hash invalidation cascade

Adding `manualChunks` reshuffles the asset hashes. The PWA precache will treat the new chunks as new resources; the SW will fetch them on activation. Existing users will see a one-time re-download of ~250 KiB on the next visit. Acceptable.

### R4 — Vendor chunk size vs HTTP/2 multiplexing

Splitting too aggressively can hurt cold-load (many small requests negotiate slowly even over h2). Keep manualChunks to 3-5 buckets, not per-package.

### R5 — `font-display: swap` vs FOUT

The current Google Fonts CSS line uses `&display=swap`. Self-hosted `@fontsource/*` packages also use swap by default. FOUT (Flash of Unstyled Text) for ~100ms is acceptable; FOIT (Flash of Invisible Text) is not. Verify computed font-display on the self-hosted woff2 files.

### Q1 — Option B1 (keep all 3 fonts, self-host) vs Option B2 (drop Bricolage + JetBrains, system fonts)

Memo proposes B1 — preserves design intent. B2 saves more bytes (drops ~70 KiB of self-hosted woff2 in addition to the Google Fonts savings). Owner override?

### Q2 — Lazy boundary at the route level vs at the page-section level

Memo proposes route-level lazy (every workspace route is its own chunk). Page-section level would lazy-load heavy widgets within a page (e.g., the AI Tutor FAB, the calendar widget). More aggressive savings but more Suspense boundaries to manage. Memo defaults to route-level. Owner override?

### Q3 — Preserve sourcemap or drop in production?

`build.sourcemap: true` is currently on (debugging convenience). Sourcemaps are 2-4× the bundle size in extra bytes (separate `.map` files, not on the critical path but a bandwidth cost). Lighthouse doesn't count them in `total-byte-weight` because they're not script-loaded. Keep for now (no Perf impact); flip to `hidden` or `false` in a future sub-R if owner wants the deploy footprint smaller. Out of R7.1+R7.2 scope.

## Verification flow (post-code, before D13)

1. Commit + push the R7.1+R7.2 code + spec.
2. `.\scripts\remote.ps1 up` then `.\scripts\remote.ps1 logs` — clean boot.
3. `.\scripts\remote.ps1 visual -Service phase-a-r7-1-r7-2-perf` — new spec must pass.
4. Lighthouse re-run on `/`, `/login`, `/programs` from Windows host (using `scripts/r7-3-lighthouse-landing-only.ps1` pattern to dodge the chrome-launcher EPERM).
5. Verify Perf ≥ 90 on each (or document the residual gap).
6. Re-run axe-scan — verify no regression (critical stays 0; serious tail same or smaller).
7. Run the regression sweep via `scripts/r7-7-regression.ps1` (with 60-90s pre-spec cooldown to dodge the rate-limit-bucket edge documented in R7.3 review).
8. **Pre-smoke per D29** (Chrome Extension on owner laptop) — if connected.
9. **Ping owner for D13.**
10. After D13 ack: write `docs/PHASE_A_R7_1_R7_2_REVIEW.md` (per-fix table + Perf score deltas + KEEP justifications).
11. Update `docs/PHASE_A_DECISIONS.md` with **D33** entry (R7.1+R7.2 D13 ack).
12. **If §1 Perf verdict flips to ✅, Gate A reaches zero blocking criteria.** Update Gate A dossier §1 row + the headline checklist. Trigger the Phase A close ceremony (final dossier sign-off, all 6 criteria ✅).

## What's NOT in R7.1+R7.2 scope

- **R7.4** (authed-route Lighthouse runner). §1 still measures anonymous pages only.
- **Sourcemap flip** (per Q3). Out of scope.
- **Image optimization** (no Lighthouse Perf audit currently flags images — the SPA's hero canvases are SVG/CSS, not raster).
- **Critical CSS extraction** (might be needed if Perf lands at 85-89; deferred unless required).
- **HTTP/3 / QUIC** (Caddy on host already serves h2; h3 is a Caddy config change, out of R7.1+R7.2).

## Standing instruction per workflow

«**memo نوشتی، stop + owner memo review. هیچ code تا owner ack.**»

This memo is committed. No code, no spec, no package.json changes, no `.\scripts\remote.ps1` actions until the owner reviews this memo and acks.

Awaiting:
- Q1: Option B1 (keep 3 fonts, self-host) vs Option B2 (drop Bricolage + JetBrains, system)?
- Q2: Route-level lazy (memo default) vs page-section-level lazy?
- Q3: Sourcemap flip — leave on (default) or strip?
- Combined (R7.1+R7.2 in one PR/sub-R) vs split (R7.1 first, R7.2 next)?
- Memo green-light to start code?

— Phase A author, 2026-05-24. R7.1+R7.2 memo locked, awaiting owner ack per standard workflow.
