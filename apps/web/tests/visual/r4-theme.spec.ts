// Phase-16 R4' — theme toggle + localStorage persistence evidence.
//
// Flow per viewport:
//   1. Visit landing → assert initial theme (matches OS pref, "dark" in
//      the test browser).
//   2. Snap baseline.
//   3. Click the navbar theme toggle.
//   4. Assert data-theme flipped + localStorage now reads the new value.
//   5. Snap "after toggle".
//   6. Reload the page → assert the new theme persisted.
//   7. Snap "after reload".
//
// Output PNGs to docs/gate-2-evidence/r4-theme/ for the Gate-2 dossier.
import { test, expect } from "@playwright/test";

const OUT = "/screenshots/gate-2-evidence/r4-theme";

const viewports = [
  { name: "mobile-320", width: 320, height: 568 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1280", width: 1280, height: 800 },
];

for (const vp of viewports) {
  test(`theme toggle + persistence at ${vp.width}x${vp.height}`, async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      // Force dark as the OS preference baseline so the test is stable
      // regardless of where it runs (CI / VPS / dev).
      colorScheme: "dark",
    });
    const page = await ctx.newPage();
    await page.goto("/", { waitUntil: "networkidle" });
    // Stabilise: disable reveal/transition animations so the snaps land
    // on finished pixels instead of mid-fade.
    await page.evaluate(() =>
      document.documentElement.setAttribute("data-test-no-animation", ""),
    );
    await page.waitForTimeout(150);

    // ----- 1. Baseline -----
    const initial = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme"),
    );
    expect(initial).toBe("dark");
    await page.screenshot({
      path: `${OUT}/01-initial-dark--${vp.name}.png`,
      fullPage: false,
    });

    // ----- 2. Toggle via the navbar button -----
    const toggle = page.getByTestId("theme-toggle");
    // Nav has both a desktop and a mobile drawer button under the same
    // testid in some viewports — pick the first attached + visible.
    await expect(toggle.first()).toBeVisible();
    await toggle.first().click();
    await page.waitForFunction(
      () =>
        document.documentElement.getAttribute("data-theme") === "light",
      { timeout: 2000 },
    );
    const afterToggle = await page.evaluate(() => ({
      theme: document.documentElement.getAttribute("data-theme"),
      stored: localStorage.getItem("digiu_theme"),
    }));
    expect(afterToggle.theme).toBe("light");
    expect(afterToggle.stored).toBe("light");
    await page.screenshot({
      path: `${OUT}/02-after-toggle-light--${vp.name}.png`,
      fullPage: false,
    });

    // ----- 3. Reload → persistence -----
    await page.reload({ waitUntil: "networkidle" });
    await page.evaluate(() =>
      document.documentElement.setAttribute("data-test-no-animation", ""),
    );
    const afterReload = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme"),
    );
    expect(afterReload).toBe("light");
    await page.screenshot({
      path: `${OUT}/03-after-reload-light--${vp.name}.png`,
      fullPage: false,
    });

    // ----- 4. Toggle back to dark, verify symmetry -----
    await page.getByTestId("theme-toggle").first().click();
    await page.waitForFunction(
      () => document.documentElement.getAttribute("data-theme") === "dark",
      { timeout: 2000 },
    );

    await ctx.close();
  });
}
