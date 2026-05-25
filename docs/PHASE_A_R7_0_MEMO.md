# Phase A R7.0 — Service Worker cache strategy fix (memo)

**Author:** Phase A author
**Date:** 2026-05-25
**Status:** ⏳ awaiting owner ack before code
**Decision basis:** D42 (R7.0 critical pre-Gate-A) + D41 (R-Landing postmortem root cause) + D45 (execution order)

---

## Why

R-Landing's site-wide breakage (D41) was amplified by the current Service Worker config. The SW (`vite-plugin-pwa` workbox) precaches **all** built artifacts (`globPatterns: ["**/*.{js,css,html,svg,woff2}"]`) and serves them aggressively via the default `precacheAndRoute` strategy = **cache-first** for every precached URL.

Consequence: when R-Landing's broken bundles hit production, every visitor's browser:
1. Downloaded the broken precache
2. Activated immediately via `skipWaiting + clientsClaim`
3. Served the broken bundle on every subsequent request
4. Kept serving it even after the next deploy fixed the bug, because cache-first means the SW NEVER asks the network for already-cached URLs

This is a **foundational reliability bug**: any future deploy with a regression gets stuck in users' browsers until the SW phones home (which it only does on a fresh page load, after the OLD precache has already painted the broken page).

Owner directive D42: «SW dest نخوریم → هر deploy آینده همین bug رو می‌سازه». Fix before Gate A close.

---

## What — scope summary

| Item | Change |
|---|---|
| `apps/web/vite.config.js` — VitePWA workbox config | Add `runtimeCaching` entries for HTML/JS/CSS → **NetworkFirst**; leave assets (fonts, images, icons) → **CacheFirst** (existing default). Remove the catch-all precache for HTML/JS/CSS — only assets stay in precache. |
| `apps/web/public/sw-recovery.js` | Bump `KILL_FLAG` from `digiu_sw_reset_v3` → `digiu_sw_reset_v4`. Forces one-time SW unregister + cache clear on every device that loads the new bundle. Immediate cleanup for users still stuck on R-Landing precache. |
| `apps/web/src/pages/debug/SwResetPage.tsx` (NEW) | Owner/user escape hatch route at `/debug/sw-reset`. Renders a "Clear SW + caches" button + a "Force reload" button. Always available, no auth, no SW interaction. Manual recovery if auto-update fails. |
| `apps/web/src/router.tsx` | Register `/debug/sw-reset` route (PUBLIC kind, no auth gate). |
| `apps/web/tests/visual/phase-a-sw-cache-strategy.spec.ts` (NEW) | Playwright spec that exercises the deploy → re-deploy flow and asserts the new bundle is served, not cached old. |

**Estimated total: ~400-600 lines** (per owner directive D42 estimate). Main convention, single PR.

---

## How — technical detail

### 1. `vite.config.js` workbox config (the core fix)

**Current (problematic):**
```js
workbox: {
  globPatterns: ["**/*.{js,css,html,svg,woff2}"],   // precaches EVERYTHING
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  runtimeCaching: [
    { urlPattern: ({ url }) => url.pathname.startsWith("/api/") || url.pathname.startsWith("/ai/"),
      handler: "NetworkOnly" },
  ],
  // ...
}
```

**Proposed (R7.0):**
```js
workbox: {
  // Keep precache ONLY for genuinely static assets (fonts + icons +
  // svgs). These rarely change and content-hash naming makes
  // cache-busting automatic. Removing js/css/html from precache means
  // the SW never serves stale app code.
  globPatterns: ["**/*.{woff2,woff,svg}"],

  // Auto-update keeps. Outdated-cache cleanup keeps.
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,

  runtimeCaching: [
    // /api and /ai stay NetworkOnly (no caching of dynamic auth state).
    {
      urlPattern: ({ url }) => url.pathname.startsWith("/api/") || url.pathname.startsWith("/ai/"),
      handler: "NetworkOnly",
    },

    // HTML routes (SPA shell + any future SSR'd pages): NetworkFirst.
    // Network gives us the latest deploy; cache fallback only on offline.
    // navigateFallback + navigateFallbackDenylist still routes SPA paths
    // to /index.html for client-side React Router.
    {
      urlPattern: ({ request }) => request.mode === "navigate"
        || request.destination === "document",
      handler: "NetworkFirst",
      options: {
        cacheName: "html-network-first",
        networkTimeoutSeconds: 3,        // fast fallback if network slow
        expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 7 },
      },
    },

    // JS bundles (Vite content-hashed): NetworkFirst.
    // Content-hash means a successful network fetch invalidates the cache
    // entry automatically. NetworkFirst guarantees the latest hash is
    // requested every time, with cache fallback only on offline.
    {
      urlPattern: ({ url, request }) =>
        url.pathname.startsWith("/assets/") && request.destination === "script",
      handler: "NetworkFirst",
      options: {
        cacheName: "js-network-first",
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 7 },
      },
    },

    // CSS bundles (Vite content-hashed): NetworkFirst.
    {
      urlPattern: ({ url, request }) =>
        url.pathname.startsWith("/assets/") && request.destination === "style",
      handler: "NetworkFirst",
      options: {
        cacheName: "css-network-first",
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 7 },
      },
    },

    // Static assets (woff2/woff fonts, svg icons, png/jpg images):
    // CacheFirst, long maxAge. Content-hashed names mean a font change
    // gets a new URL → new cache entry. Cache-first is safe.
    {
      urlPattern: ({ url, request }) =>
        url.pathname.startsWith("/assets/") &&
        (request.destination === "font" || request.destination === "image"),
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets",
        expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
  ],

  navigateFallback: "/index.html",
  navigateFallbackDenylist: [/^\/api\//, /^\/ai\//, /^\/debug\//],
},
```

**Why this is the right tradeoff:**
- **PWA installability stays:** the manifest + SW + offline-fallback all keep working. The app installs to home screen, opens offline (with cached HTML+JS from last visit).
- **Future deploys propagate immediately:** NetworkFirst on HTML/JS/CSS means the new bundle is fetched every time, with the cache only as a fallback when offline.
- **No more "stuck on broken bundle" failure mode:** even if a deploy is bad, the next page load fetches network. The SW serves cache ONLY when network fails.
- **Offline still works:** users who lose connectivity get the last-cached version of HTML/JS/CSS + cached fonts/images. Full offline app fidelity.
- **Standard practice:** Workbox's own [recipes guide](https://developer.chrome.com/docs/workbox/) recommends NetworkFirst for HTML, runtime-caching for JS/CSS, CacheFirst for fonts/images. This is the Workbox canonical pattern, not a bespoke design.

### 2. `sw-recovery.js` — bump `KILL_FLAG`

Already exists and works. Bumping `KILL_FLAG` to `v4` is a one-liner. This triggers a one-time auto-cleanup on every device the first time it loads the new bundle, evicting any leftover R-Landing precache. Pairs with the strategic fix above.

```js
var KILL_FLAG = "digiu_sw_reset_v4"; // bump from v3 → v4 for R7.0
```

### 3. `/debug/sw-reset` page — manual escape hatch

A standalone PUBLIC route, no auth, no chrome dependencies. Renders the exact recovery snippet as clickable buttons so a non-technical owner / user can fix a stuck browser without DevTools.

```tsx
export const SwResetPage: React.FC = () => {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "err">("idle");
  const handleReset = async () => {
    setStatus("running");
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      localStorage.clear();
      setStatus("done");
      setTimeout(() => location.replace("/?postReset=1"), 1500);
    } catch (e) { setStatus("err"); }
  };
  return (
    <main className="sw-reset-page">
      <h1>پاکسازی Service Worker و کش</h1>
      <p>اگر بعد از deploy جدید سایت رو به‌روز نمی‌بینید، این دکمه را بزنید.</p>
      <button onClick={handleReset} disabled={status === "running"}>
        {status === "idle" && "پاکسازی + بارگذاری مجدد"}
        {status === "running" && "در حال پاکسازی..."}
        {status === "done" && "✓ بارگذاری مجدد..."}
        {status === "err" && "خطا — لطفاً دوباره تلاش کنید"}
      </button>
    </main>
  );
};
```

Route registered as PUBLIC in `router.tsx`. Excluded from SW interception via `navigateFallbackDenylist: [..., /^\/debug\//]` (so the page itself bypasses the SW even when SW is buggy).

### 4. Spec — `phase-a-sw-cache-strategy.spec.ts`

Playwright spec that simulates the deploy-then-redeploy cycle:

```ts
test("@gate-a R7.0 — SW serves new bundle after redeploy (not stale cache)", async ({ page, context }) => {
  // 1. Visit /, register SW, capture bundle hash
  await page.goto("/");
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  const oldHash = await page.evaluate(() =>
    Array.from(document.scripts).map(s => s.src).find(s => /assets\/index-.*\.js/.test(s)));

  // 2. Simulate a deploy: invalidate cache, intercept next index.html to return new bundle hash
  await context.route("**/", (route) => {
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: `<!doctype html><html><head><link rel="stylesheet" href="/assets/index-FAKEHASH.css"></head>
             <body><script src="/assets/index-FAKEHASH.js" type="module"></script></body></html>`,
    });
  });
  await page.goto("/?reload=1");
  const newHash = await page.evaluate(() =>
    Array.from(document.scripts).map(s => s.src).find(s => /assets\/index-.*\.js/.test(s)));

  // 3. Assert: new hash served, not old
  expect(newHash).not.toBe(oldHash);
  expect(newHash).toMatch(/index-FAKEHASH/);
});
```

Plus 4 simpler assertions:
- `/debug/sw-reset` renders and the reset button works (caches.keys() returns [] after click)
- After bumping KILL_FLAG, the one-time kill switch fires (verified via localStorage flag set to non-`v4` initially)
- SW registers fresh on the test page
- Fonts and SVGs are cached (request count = 1 for two consecutive loads)

---

## Risks

1. **NetworkFirst means slower offline experience.** Users on lossy connections may briefly stare at white screen during the `networkTimeoutSeconds` window. Mitigation: tight timeouts (3s for HTML, 5s for JS/CSS) + cache fallback returns instantly after timeout. In practice on 3G, the experience is identical to a no-SW site since cache-first would have to validate against the server anyway.

2. **Existing precache cleared on R7.0 deploy.** Users with the old SW will get a brief flash of the SW unregistering + reloading on first visit. Pairs with bumping KILL_FLAG so they only see this once.

3. **navigateFallback behavior change.** Currently HTML is precached, so the SPA shell is offline-available. With NetworkFirst, offline users get the LAST cached HTML (which still works fine since it's the SPA shell). No regression for the offline LMS use case Phase-14.6 was designed for.

4. **PWA install icon may briefly disappear in dev tools** during the SW transition. Manifest is unchanged so install is still available; just the "ready to install" indicator may flicker on first load.

5. **`networkTimeoutSeconds` requires Workbox 4+** — verified: `vite-plugin-pwa` 0.20+ ships Workbox 7. We're on the right version.

---

## Verification plan

### Pre-deploy (automated)
- `npm run typecheck` clean
- `npm run lint` clean (audit-on-mutation rule N/A — no api mutations)
- `npm test` — vitest unit tests pass
- `npx playwright test tests/visual/phase-a-sw-cache-strategy.spec.ts` — new spec passes
- Regression sweep: R1.1 (13/13) + R6.6 (12/12) + R7.12 (72/72) — must all stay green
- Build size diff: expected -10 to -50 KiB (smaller precache manifest)

### Post-deploy (Chrome Extension D29)
1. Open https://digiuniversity.ir/ in incognito → verify new SW registers, KILL_FLAG triggers cleanup, page loads cleanly
2. Open `/debug/sw-reset` → click reset → verify caches cleared + reload
3. Open Network tab → reload `/` → verify HTML + JS + CSS all show "Network" (not "ServiceWorker") in waterfall
4. Force offline (DevTools "Offline" checkbox) → reload `/` → verify last-cached HTML+JS renders (offline fallback works)
5. Make a fake new deploy locally → hard-reload production → verify new bundle hash served

### D13 owner manual smoke
- Owner on real device + incognito + hard reload: visit `/`, `/login`, `/dashboard`, `/classroom`. All should render the LATEST deploy (no stale precache).
- Owner deploy test: make a trivial code change (e.g., update a footer string), deploy, hard-reload — change should appear immediately on owner's device without any cache-clear ritual.

---

## What this UN-blocks

- Gate A close (D42 — R7.0 is now a Gate A prereq, not post)
- R7.1+R7.2 resume can ship safely (no more "stuck on broken bundle" amplification)
- Future R-Landing-v2 (D43) — landing rebuild can deploy via main bundle without fear of SW stickiness
- Phase B deploy cycle (D44/D45) — first Phase B sub-R post-Gate-A can ship without users getting stuck on old code

---

## Scope estimate (final)

| File | LOC change |
|---|---|
| `apps/web/vite.config.js` | +60 / -10 = +50 (runtimeCaching block + comments) |
| `apps/web/public/sw-recovery.js` | +1 / -1 = 0 (KILL_FLAG v3 → v4) |
| `apps/web/src/pages/debug/SwResetPage.tsx` (NEW) | +80 |
| `apps/web/src/router.tsx` | +5 (route registration) |
| `apps/web/tests/visual/phase-a-sw-cache-strategy.spec.ts` (NEW) | +130 |
| `apps/web/src/pages/debug/SwResetPage.css` (NEW) | +30 (basic styling) |
| `docs/PHASE_A_R7_0_REVIEW.md` (NEW, post-ship) | +180 |
| `docs/PHASE_A_DECISIONS.md` (D42 already in; add D42-impl note post-ship) | +20 |

**Total: ~495 lines** within the 400-600 estimate.

---

## Open questions for owner (none required to start)

- Q1 — `/debug/sw-reset` exposure: PUBLIC route accessible to anyone, or gated by a query-param secret? **Default proposed:** PUBLIC, since the page only clears the visitor's own browser state (no admin power), and it must work for stuck non-authed visitors.
- Q2 — `networkTimeoutSeconds` values: HTML 3s + JS/CSS 5s reasonable for Iran network conditions? **Default proposed:** keep as-is; can tune in a follow-up if owner sees slow fallbacks on real device.
- Q3 — KILL_FLAG bump: should we additionally bump on every R7.x deploy to force fresh state, or only when needed? **Default proposed:** only when needed (R7.0 needs it; later sub-Rs don't unless they touch SW config).

---

## Status

| Item | Status |
|---|---|
| Memo | ✅ this file |
| Owner ack | ⏳ pending |
| Code | ⏳ pending ack |
| Spec | ⏳ pending ack |
| D29 pre-smoke | ⏳ pending ack |
| Review doc | ⏳ post-ship |

— Phase A author, 2026-05-25. R7.0 memo per D42 + D45 ordering. Awaiting owner ack before code.
