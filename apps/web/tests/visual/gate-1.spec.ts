// Phase-16 Gate-1 visual evidence.
//
// What this proves:
//   1. The landing renders cleanly at 320 / 768 / 1280 (owner viewport set).
//   2. A logged-in user hitting "/" is bounced to /dashboard — closes B-01.
//
// Output goes to `/screenshots/gate-1/` which is bind-mounted on the host
// to `docs/gate-1-evidence/` by the web-visual compose service.
//
// Runs in CI-like context inside the docker network. See
// `apps/web/playwright.visual.config.js` and `scripts/remote.ps1 visual`.
import { test, expect } from "@playwright/test";

const OUT = "/screenshots/gate-1"; // container path; host = docs/gate-1-evidence/

// Demo student credentials — fixed in the seed (apps/api/src/...).
// Same values appear in security-probe in scripts/remote.ps1.
const STUDENT = {
  tenantSlug: "demo",
  email: "student1@digiuniversity.ir",
  password: "StudentPass!1",
};

const viewports = [
  { name: "mobile-320", width: 320, height: 568 },   // iPhone SE 1st gen
  { name: "tablet-768", width: 768, height: 1024 },  // iPad portrait
  { name: "desktop-1280", width: 1280, height: 800 },
];

test.describe("Gate 1 — landing responsive + redirect", () => {
  for (const vp of viewports) {
    test(`landing logged-out at ${vp.width}x${vp.height}`, async ({ browser }) => {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await ctx.newPage();
      await page.goto("/", { waitUntil: "networkidle" });
      // Let the aurora / hero-3d animation settle for a deterministic shot.
      await page.waitForTimeout(800);

      // The new outcome-first headline must be visible — proves R2 shipped.
      await expect(page.locator("h1.hero-title")).toContainText("۲۴۸ برنامه");

      // Body must not horizontally overflow at this viewport (B-02 sanity).
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(vp.width + 2);

      await page.screenshot({
        path: `${OUT}/gate-1-landing-${vp.name}.png`,
        fullPage: false,
      });
      await ctx.close();
    });
  }

  test("logged-in user is redirected from / to /dashboard", async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const page = await ctx.newPage();

    // Drive the UI to login. We could POST to /api/v1/auth/login directly,
    // but the SPA stores the session in localStorage via sessionStore.set,
    // and replicating that from outside is fragile. Going through the form
    // exercises the same code path a real user does.
    await page.goto("/login", { waitUntil: "networkidle" });

    // Tenant + email + password fields are by `name`.
    const tenantInput = page.locator('input[placeholder="demo"]').first();
    if (await tenantInput.isVisible().catch(() => false)) {
      await tenantInput.fill(STUDENT.tenantSlug);
    }
    await page.locator('input[name="email"]').fill(STUDENT.email);
    await page.locator('input[name="password"]').fill(STUDENT.password);
    await page.locator('button[type="submit"]').click();

    // Wait for the SPA to leave /login.
    await page.waitForURL((u) => !u.pathname.includes("/login"), {
      timeout: 20_000,
    });

    // Now explicitly navigate to "/" and assert the auth redirect bounces
    // us to /dashboard. This is the core B-01 fix.
    await page.goto("/");
    await page.waitForURL((u) => u.pathname.startsWith("/dashboard"), {
      timeout: 10_000,
    });
    expect(page.url()).toMatch(/\/dashboard/);

    await page.screenshot({
      path: `${OUT}/gate-1-redirect-1280.png`,
      fullPage: false,
    });
    await ctx.close();
  });
});
