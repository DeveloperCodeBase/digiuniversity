// Phase-16 R9 + R10 — full landing redesign evidence.
//
// Captures the full landing page at 320 / 768 / 1280 — hero + new
// sections (trust strip, stats band, faculty showcase, catalog
// teaser, testimonials + dual CTA) all on one scroll.
//
// We capture `fullPage: true` here because the new sections live
// below the fold — owner needs to see the whole scroll, not just
// the hero. ~50 KB per PNG (gzipped landing assets stay around 80 KB).
import { test, expect } from "@playwright/test";

const OUT = "/screenshots/gate-2-evidence/r10-landing";

const viewports = [
  { name: "mobile-320", width: 320, height: 568 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1280", width: 1280, height: 800 },
];

for (const vp of viewports) {
  test(`landing full-scroll at ${vp.width}x${vp.height}`, async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    const page = await ctx.newPage();
    await page.goto("/", { waitUntil: "networkidle" });
    // Let the stats-band count-up + reveal animations finish.
    await page.waitForTimeout(2200);
    await page.screenshot({
      path: `${OUT}/landing-fullpage--${vp.name}.png`,
      fullPage: true,
    });

    // Sanity: the new headline + at least one new section title rendered.
    await expect(page.locator("h1.hero-title")).toContainText("۲۴۸ برنامه");
    await expect(page.getByText("سازمان‌های همکار").first()).toBeVisible();
    await expect(page.getByText("از پیشنهادهای", { exact: false }).first()).toBeVisible();

    await ctx.close();
  });
}
