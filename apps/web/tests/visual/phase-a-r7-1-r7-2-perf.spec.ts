// Phase A R7.1+R7.2 — Performance track verification spec.
//
// Per the R7.1+R7.2 memo: assertions on bundle structure (Vite manual
// chunks land, lazy chunks load on-demand, no Google Fonts requests).
// This is the "did the optimization actually take effect" check —
// Lighthouse Perf scoring lives in the dossier re-measure, not here.
//
// Tagged @gate-a so the suite can be cherry-picked into CI.

import { test, expect, type Page, type Route } from "@playwright/test";

test.describe("@gate-a R7.1+R7.2 — Performance optimizations", () => {

  // ----- R7.1.a — Vite manual chunks -----

  test("R7.1.a /: response delivers separate react-vendor + radix-vendor + main chunks", async ({ page }) => {
    const requested: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.endsWith(".js")) requested.push(url);
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // The build output names chunks `react-vendor-[hash].js` and
    // `radix-vendor-[hash].js` per the manualChunks block in vite.config.js.
    const hasReactVendor = requested.some((u) => /\/assets\/react-vendor-[^/]+\.js$/.test(u));
    const hasRadixVendor = requested.some((u) => /\/assets\/radix-vendor-[^/]+\.js$/.test(u));
    expect(hasReactVendor, "react-vendor chunk must be loaded on / cold load").toBe(true);
    expect(hasRadixVendor, "radix-vendor chunk must be loaded on / cold load").toBe(true);
  });

  // ----- R7.1.b — Route-level lazy loading -----

  test("R7.1.b /: workspace route chunks are NOT loaded on / cold load", async ({ page }) => {
    const requested: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.endsWith(".js")) requested.push(url);
    });
    await page.goto("/", { waitUntil: "networkidle" });
    // Workspace route chunks should NOT appear on a / cold load.
    // Vite emits per-route chunks like `Dashboard-[hash].js` (or
    // similar) for each React.lazy(() => import(...)) boundary.
    // Sample 3 workspace pages we know are lazy per the router edits.
    const workspaceChunks = ["Dashboard", "Classroom", "Settings", "Tutor"];
    for (const stem of workspaceChunks) {
      const loaded = requested.some((u) => new RegExp(`/assets/${stem}-[^/]+\\.js$`).test(u));
      expect(loaded, `${stem} chunk MUST NOT be loaded on / cold load`).toBe(false);
    }
  });

  test("R7.1.b /tutor: navigating to a lazy route loads the route's chunk", async ({ page }) => {
    const requested: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.endsWith(".js")) requested.push(url);
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // Go to /tutor (a lazy-loaded workspace page).
    await page.goto("/tutor", { waitUntil: "networkidle" });
    // The Tutor chunk must appear in the request log.
    const tutorLoaded = requested.some((u) => /\/assets\/Tutor-[^/]+\.js$/.test(u));
    expect(tutorLoaded, "/tutor navigation must trigger Tutor chunk fetch").toBe(true);
  });

  // ----- R7.2.a/b/c — Self-hosted fonts, no Google Fonts -----

  test("R7.2.c /: NO requests to fonts.googleapis.com or fonts.gstatic.com", async ({ page }) => {
    const externalFontReqs: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (
        url.includes("fonts.googleapis.com") ||
        url.includes("fonts.gstatic.com")
      ) {
        externalFontReqs.push(url);
      }
    });
    await page.goto("/", { waitUntil: "networkidle" });
    expect(
      externalFontReqs.length,
      `expected zero requests to Google Fonts but got: ${externalFontReqs.join(", ")}`,
    ).toBe(0);
  });

  test("R7.2.a /: at least one same-origin woff2 font is loaded", async ({ page }) => {
    const fontReqs: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.endsWith(".woff2")) fontReqs.push(url);
    });
    await page.goto("/", { waitUntil: "networkidle" });
    expect(fontReqs.length, "at least one woff2 must load (self-hosted Vazirmatn)").toBeGreaterThan(0);
    // Every woff2 must be same-origin (no fonts.gstatic.com).
    for (const url of fontReqs) {
      expect(
        url,
        `font url must be same-origin (digiuniversity.ir), got: ${url}`,
      ).toMatch(/digiuniversity\.ir|localhost|app\.local/);
    }
  });

  test("R7.2.a body computed font-family resolves to Vazirmatn", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // Give the font CSS a beat to register the @font-face before reading
    // the computed style (font load events fire after the @font-face CSS
    // is parsed but before the woff2 finishes downloading; computed
    // style should already include "Vazirmatn" as the first family).
    await page.waitForTimeout(200);
    const family = await page.evaluate(() => window.getComputedStyle(document.body).fontFamily);
    expect(family.toLowerCase()).toContain("vazirmatn");
  });

  // ----- R7.1.b — Suspense fallback shows briefly during lazy nav -----
  //
  // This is a soft assertion — depending on cache + connection, the
  // fallback may flash for <50ms and Playwright may miss it. We don't
  // FAIL on absence; we just confirm that when the fallback IS rendered,
  // it has the right semantic. The contract is the visible string + the
  // role=status; the timing variability is acceptable.

  test("R7.1.b RouteLoadFallback has role=status + a11y label", async ({ page }) => {
    // Slow down the lazy chunk fetch so the fallback is visible long enough
    // to assert. Block the Settings chunk briefly; the fallback should show.
    await page.route(/\/assets\/Settings-[^/]+\.js$/, async (route: Route) => {
      // 1.5s delay — gives Playwright time to see the fallback DOM.
      await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // Trigger nav to a lazy route without waiting for full load.
    const navPromise = page.goto("/settings", { waitUntil: "domcontentloaded" });
    // The fallback uses role="status" and an aria-label.
    const fallback = page.locator('[role="status"][aria-label*="بارگذاری"]');
    await expect(fallback).toBeVisible({ timeout: 2500 });
    await navPromise;
  });
});
