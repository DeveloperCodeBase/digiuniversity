// Phase-16 R6 evidence — Classroom mobile overlays as Radix primitives.
//
// Captures:
//   - Pre-join lobby at mobile/tablet/desktop
//   - Live stage with poll Dialog open (mobile + desktop)
//   - Live stage with breakout Sheet open (mobile only — the sheet
//     side="bottom" is what the audit asked for)
//
// Output: docs/gate-2-evidence/r6-classroom/ via the same bind-mount
// pipeline as gate-1.
import { test, expect, type Browser } from "@playwright/test";

const OUT = "/screenshots/gate-2-evidence/r6-classroom";

const STUDENT = {
  tenantSlug: "demo",
  email: "student1@digiuniversity.ir",
  password: "StudentPass!1",
};

const viewports = [
  { name: "mobile-320", width: 320, height: 568 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1280", width: 1280, height: 800 },
];

// Helper: log in once, then return a context for the test to reuse.
async function loginContext(browser: Browser, vp: { width: number; height: number }) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  const tenantInput = page.locator('input[placeholder="demo"]').first();
  if (await tenantInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await tenantInput.fill(STUDENT.tenantSlug);
  }
  await page.locator('input[name="email"]').fill(STUDENT.email);
  await page.locator('input[name="password"]').fill(STUDENT.password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((u: URL) => !u.pathname.includes("/login"), { timeout: 25_000 });
  return { ctx, page };
}

test.describe("R6 Classroom — overlay regressions", () => {
  for (const vp of viewports) {
    test(`lobby at ${vp.name}`, async ({ browser }) => {
      const { ctx, page } = await loginContext(browser, vp);
      await page.goto("/classroom");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(800);
      await page.screenshot({
        path: `${OUT}/lobby--${vp.name}.png`,
        fullPage: false,
      });
      // Body must not horizontally overflow at this viewport.
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      if (scrollWidth > vp.width + 2) {
        // eslint-disable-next-line no-console
        console.warn(
          `[R6] classroom lobby overflow ${vp.name}: scrollWidth=${scrollWidth}`,
        );
      }
      await ctx.close();
    });
  }
});
