/*
 * Phase-15 R5: PWA recovery bootstrap, externalised from index.html so
 * the SPA can ship a strict Content-Security-Policy without
 * `'unsafe-inline'` in `script-src`. Loaded synchronously from <head>
 * before the main bundle.
 *
 * Two jobs (unchanged from the original inline script in Phase-14.8):
 *   1) controllerchange listener: when a new service worker takes over
 *      (skipWaiting + clientsClaim from a newer deploy), reload once so
 *      the page picks up the new precache.
 *   2) one-time stale-SW kill: the very first time a client loads this
 *      version of the bootstrap, unregister any existing SWs, clear all
 *      caches, then hard-reload. Gated by localStorage so it only runs
 *      once per device. Escape hatch for users stuck on pre-Phase-14.6
 *      SWs that never had skipWaiting+clientsClaim.
 *
 * Bump KILL_FLAG to retrigger across a future deploy. Wrapped in
 * try/catch so a private-browsing localStorage failure can't block the
 * page bootstrap.
 *
 * nginx serves this file with Cache-Control: no-cache (see nginx.conf
 * `location = /sw-recovery.js`) so the very first byte of every load
 * gets revalidated against the origin.
 */
(function () {
  try {
    if (!("serviceWorker" in navigator)) return;

    // 1) Auto-reload on SW takeover so new assets render immediately.
    var reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (reloading) return;
      reloading = true;
      // Tiny defer so the new SW finishes claiming clients before the
      // navigation; otherwise some browsers race the reload against
      // the claim and get the OLD SW one more time.
      setTimeout(function () { window.location.reload(); }, 50);
    });

    // 2) One-time kill switch. The flag includes a version so future
    // deploys can re-trigger by bumping it.
    // R-Landing-v2 Commit A: bumped v3 → v4. Forces one-time
    // SW unregister + cache clear on every device, even ones that
    // previously ran v3. Pairs with main.tsx top-of-file unregister
    // block. Belt-and-suspenders for the demo window — D45 + D47.
    var KILL_FLAG = "digiu_sw_reset_v4";
    if (localStorage.getItem(KILL_FLAG)) return;

    navigator.serviceWorker.getRegistrations().then(function (regs) {
      if (regs.length === 0) {
        localStorage.setItem(KILL_FLAG, String(Date.now()));
        return;
      }
      // There's at least one SW registered. Unregister all, clear
      // caches, then reload. The new SW will register fresh from the
      // new bundle on the next page load.
      var unreg = Promise.all(regs.map(function (r) { return r.unregister(); }));
      var clear = (typeof caches !== "undefined" && caches.keys)
        ? caches.keys().then(function (keys) {
            return Promise.all(keys.map(function (k) { return caches.delete(k); }));
          })
        : Promise.resolve();
      Promise.all([unreg, clear]).then(function () {
        localStorage.setItem(KILL_FLAG, String(Date.now()));
        // Bypass HTTP cache via a query param to force network fetch
        // of every resource on this hard-reload.
        var url = new URL(window.location.href);
        url.searchParams.set("_swReset", String(Date.now()));
        window.location.replace(url.toString());
      }).catch(function () {
        // If anything fails, mark the flag so we don't loop, then
        // continue the boot with whatever state we have.
        localStorage.setItem(KILL_FLAG, "error");
      });
    });
  } catch (e) {
    // localStorage / serviceWorker / caches API blocked — ignore.
  }
})();
