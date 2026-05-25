# Phase A R-Landing — Postmortem

**Date:** 2026-05-25
**Trigger:** Owner emergency directive — «EMERGENCY. تمام pages وبسایت شکسته بعد از R-Landing commits. ROLLBACK now.»
**Status:** Rollback shipped (commit `674462d`) + verified live on 5 pages.

---

## Timeline

| When | Event |
|---|---|
| 2026-05-24 ~early | `83dacbb` D37 audit doc (docs only) |
| 2026-05-25 ~early | `6795a22` D38 memo (docs only) |
| 2026-05-25 ~early | `5bac904` **R-Landing initial ship** — Home rewrite + home-v2.css + AppShell isLandingRoute early-return + landing spec |
| 2026-05-25 ~early | `0739c97` R-Landing review doc (docs only) |
| 2026-05-25 mid | `b761107` drop auth-redirect from landing |
| 2026-05-25 mid | `e32acd4` HOTFIX horizontal-scroll body margin (`html:has`/`body:has` rules + overflow-x:clip) |
| 2026-05-25 mid | `2964043` skip-link hotfix inside .home-shell-v2 |
| 2026-05-25 late | `a9f517f` **REBUILD** — faithful Nav + Footer 1:1 from template |
| 2026-05-25 late | `535484b` forensic audit doc (docs only) |
| 2026-05-25 late | Owner reports **site-wide breakage on all pages** post-R-Landing |
| 2026-05-25 late | `674462d` **EMERGENCY ROLLBACK** — revert all R-Landing code commits |
| 2026-05-25 late | Deploy + Chrome Extension verification — site restored |

**Time from breakage report to rollback deploy:** ≈10 minutes.

---

## Root cause analysis — hypothesis ranking by evidence

### HYPOTHESIS E — Service Worker / Workbox precache stickiness ← **CONFIRMED PRIMARY AMPLIFIER**

**Mechanism:** The web app uses `vite-plugin-pwa` (registered Phase-14.6) with:
- `registerType: "autoUpdate"`
- `workbox: { globPatterns: ["**/*.{js,css,html,svg,woff2}"] }`
- `skipWaiting + clientsClaim`

This means every visitor's browser registers a Workbox Service Worker that PRECACHES all built artifacts at install time. Cache key: `workbox-precache-v2-https://digiuniversity.ir/`.

When R-Landing shipped (`5bac904`):
1. Visitor's browser had old SW + old precache from prior deploy
2. New SW downloads in background, install precache of R-Landing artifacts (with the bug)
3. `skipWaiting` activates new SW immediately
4. `clientsClaim` makes new SW control all open tabs
5. **Now every navigation served R-Landing content from precache, including SPA shell HTML**
6. Even if subsequent deploys (hotfixes) shipped fixes, until the SW updated AGAIN the user remained stuck on the broken precache

**Evidence:**
- `navigator.serviceWorker.getRegistrations()` returned 1 active SW on `https://digiuniversity.ir/`
- `caches.keys()` returned `["workbox-precache-v2-https://digiuniversity.ir/"]`
- **The exact recovery action that restored function**: `regs[0].unregister() + caches.delete("workbox-precache-v2-https://digiuniversity.ir/")` + fresh navigate. After this, all 5 pages rendered correctly with post-rollback bundles.
- Before the SW unregistration: page showed R-Landing wrapper `.home-shell-v2` and template hero despite the server bundle (`index-DyOoXXlp.js`) having ZERO `home-shell-v2` mentions. **Mismatch between bundle hash and rendered content = SW serving stale precache.**

**Recovery action for any user still seeing the broken site:**
```js
// In DevTools Console on digiuniversity.ir:
const regs = await navigator.serviceWorker.getRegistrations();
for (const r of regs) await r.unregister();
const names = await caches.keys();
for (const n of names) await caches.delete(n);
location.reload(); // hard reload to fetch fresh bundle
```

Or simpler: hard-reload (Ctrl+Shift+R) a few times — the autoUpdate SW will eventually pull the new bundle.

### HYPOTHESIS A — home-v2.css selector leak

**Hypothesis:** Generated home-v2.css (3306 lines) had selectors that affected the cascade on non-Landing routes even though prefixed with `.home-shell-v2`.

**Evidence against:** the `scripts/landing-scope-css.mjs` script special-cases `:root`, `html`, `body`, `#root`, `html, body`, `body::before`, `html::before`, `*` to scope them all to `.home-shell-v2`. The R-Landing spec `phase-a-landing.spec.ts` asserted (test #6) that `/login` body color is NOT home ink — passed. Computed-style proof of no leak in scoped CSS.

**Verdict:** UNLIKELY as primary cause, but the 3306 new lines added cascade weight + parse cost. May have contributed to perceived slowness on workspace routes.

### HYPOTHESIS B — main.tsx unconditional CSS import

**Hypothesis:** `home-v2.css` imported unconditionally in main.tsx → loaded on every route.

**Evidence against:** `home-v2.css` is imported inside `apps/web/src/pages/Home.tsx` (lazy-loaded via `React.lazy` per R7.1 chunks). It is NOT in main.tsx. So home-v2.css only loads when Home.tsx is mounted (i.e., user visits `/`).

**Verdict:** RULED OUT as a cause.

### HYPOTHESIS C — `body:has(.home-shell-v2)` hotfix wrong selector

**Hypothesis:** The HOTFIX block at top of home-v2.css:
```css
html:has(.home-shell-v2),
body:has(.home-shell-v2) { margin: 0 !important; ... }
```
fails on browsers without `:has()` support, OR affects body in unintended way.

**Evidence against:** `:has()` is supported in Chrome 105+ (Aug 2022), Firefox 121+ (Dec 2023), Safari 15.4+ (Mar 2022). Owner uses modern Chrome. On routes without `.home-shell-v2` in DOM, the selector doesn't match, so the rule is inert.

**Verdict:** UNLIKELY direct cause. However, if Workbox precache served the OLD HTML that DID have `.home-shell-v2` injected for non-Home routes (via SPA fallback serving cached /), the rule would have fired everywhere.

### HYPOTHESIS D — auth-redirect removal affected workspace routes

**Hypothesis:** Removing `redirectAuthedFromLanding` (b761107) inadvertently broke workspace auth gating.

**Evidence against:** The change was local to `AppShell.tsx`:
```tsx
const redirectAuthedFromLanding = false; // was: isLandingRoute && auth.isAuthenticated;
```
The variable is consumed only in `if (redirectAuthedFromLanding) return <Skeleton/>` — making it false just disables that bounce. The workspace auth gate (`if (isWorkspace && !auth.isAuthenticated) go("login")`) is untouched.

**Verdict:** RULED OUT.

### HYPOTHESIS A.b — `isLandingRoute` matched routes during transition

**Hypothesis:** `isLandingRoute = route === "" || route === "home"`. If `useCurrentRoute()` ever returns `""` transiently during route resolution, the AppShell would return `<Outlet/>` (bare, no chrome) — breaking workspace routes.

**Evidence:** I did not measure `route` value during transitions on production. PLAUSIBLE but not confirmed.

**Verdict:** Possible secondary cause; would explain "all pages broken" if the chrome briefly disappeared during navigation. Would need React profiler or DOM mutation logs to confirm.

---

## Verdict — what most likely caused "all pages broken"

**Primary:** Hypothesis E — Service Worker stickiness amplified any R-Landing bug into a persistent visible breakage across all routes. The SW served stale precached responses including the SPA shell HTML, so even after the visit went to `/dashboard`, the SW returned `/`'s cached index.html (or an old broken variant) which then rendered the R-Landing code path.

**Possible contributing primary:** Hypothesis A.b — `isLandingRoute` matching too aggressively could have caused brief chrome-disappearance on every route during React Router transitions.

**Confidence:** Hypothesis E is HIGH confidence (we observed the SW + cache directly and the unregister-and-clear action restored function). The R-Landing CODE bugs are MEDIUM confidence (no direct repro yet — to repro we'd need to redeploy R-Landing then check workspace routes with a fresh-clear browser, which would require owner approval to re-ship the broken code).

---

## Why the regression sweep missed this

The post-R-Landing review noted 🟡 1/8 PASS + 7 regressions in the regression sweep (R1.1, R3, R5, R6, R6.6, R7.12, gate-a-role-routing). These were attributed to "Vite CSS chunking" or "test timing" by the review doc.

**In hindsight:** those 7 regressions WERE the early-warning signal. The review doc undersold them by characterizing them as "investigate later". Lesson: when 7 of 8 specs regress on a ship, the right call is STOP + investigate, not «ship + investigate-later».

This is a "feedback_phase_a_budget_test_coupling" violation in spirit — the review treated test failures as separable from the ship, when they were the canary.

---

## Action items (pending owner direction)

1. **Owner action required**: clear browser SW + cache (see Recovery action above) on every device that visited the site during R-Landing's life. The autoUpdate SW will eventually push the new bundle but explicit clear is faster.

2. **Site-wide stability check** (recommended): after owner confirms own browser shows post-rollback site correctly, do a 5-page smoke as student (`/`, `/login` → log in → `/dashboard`, `/classroom`, `/profile`).

3. **R-Landing rebuild conditional on owner approval** per directive: «rollback first، diagnose بعد، rebuild بعدتر (اگه owner خواست)». If owner wants rebuild, suggested safety guardrails:
   - **Pre-ship**: deploy R-Landing to a staging URL first (no SW on staging) to catch breakage before production
   - **Pre-ship**: run the full 8-spec regression sweep ON the new code (not as a follow-up "investigate later") and refuse ship if any spec fails
   - **Pre-ship**: explicit measurement of `route` value across all 50+ routes to rule out Hypothesis A.b
   - **Post-ship**: explicit SW cache-bust on activation (force `caches.delete("workbox-precache-v2-*")` in the new SW's install handler so users can't get stuck)
   - **Post-ship**: D29 owner pre-smoke ON the production URL (in incognito + DevTools, no SW state) before reporting "shipped"

4. **Standing change** (suggested, owner-decision): consider gating the Workbox SW behind a feature flag, OR removing `skipWaiting + clientsClaim` so users have a chance to refuse a bad update. The Phase-14.6 rationale was «take effect immediately after a new deploy» but that's a double-edged sword: a bad deploy also takes effect immediately and gets stuck in precache.

---

## R-Landing status

**FROZEN.** No rebuild attempt until owner explicit approval.

**Preserved artifacts (historical record):**
- `docs/PHASE_A_LANDING_AUDIT.md` (D37)
- `docs/PHASE_A_LANDING_MEMO.md` (D38)
- `docs/PHASE_A_R_LANDING_REVIEW.md` (initial review)
- `docs/PHASE_A_LANDING_FORENSIC_AUDIT.md` (D40 pre-emergency report)
- `docs/PHASE_A_DECISIONS.md` entries D37 / D38 / D39 / D40 / D41

**Deleted code:**
- `apps/web/src/pages/home-v2.css` (3306 lines)
- `apps/web/tests/visual/phase-a-landing.spec.ts`
- `scripts/landing-scope-css.mjs`
- `apps/web/src/pages/Home.tsx.broken-v1` + `home-v2.css.broken-v1` (rebuild backups)

**Reverted modifications:**
- `apps/web/src/pages/Home.tsx` (back to pre-rewrite generic Home)
- `apps/web/src/layouts/AppShell.tsx` (auth-redirect intact; isLandingRoute Outlet early-return removed)
- `apps/web/src/pages/Home.tsx` re-added to `docs/PHASE_A_DEFERRED_TYPES.md`

---

— Phase A author, 2026-05-25. Rollback shipped, root cause identified (SW precache amplification), R-Landing FROZEN pending owner direction.
