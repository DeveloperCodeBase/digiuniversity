// Phase-16 Gate-1 visual evidence.
//
// What this proves:
//   1. The landing renders at 320 / 768 / 1280 (owner viewport set).
//   2. The new outcome-first headline shipped (R2).
//   3. A logged-in user hitting "/" is bounced to /dashboard — closes B-01.
//
// Why we go through production (https://digiuniversity.ir) instead of
// the in-network nginx container:
//   - The app container's nginx does NOT proxy /api/* — that's the host
//     Caddy's job. Hitting http://app/ would cause the SPA's login fetch
//     to land on the SPA fallback and return index.html instead of JSON.
//   - Production URL exercises the full live path (CDN → Caddy → app +
//     api), which is exactly what we want to verify after each deploy.
//
// Trade-off: production rate limiters see these requests. We make < 5
// total requests per gate, well under the 10/min /v1/auth/login bucket.
//
// Output goes to `/screenshots/gate-1/` which is bind-mounted on the
// host to `docs/gate-1-evidence/` by the web-visual compose service.
import { test, expect } from "@playwright/test";

// Container path. The docker-compose web-visual service bind-mounts
// ./docs (repo) → /screenshots (container), so writing to
// /screenshots/gate-1-evidence/ lands in docs/gate-1-evidence/ on the host.
const OUT = "/screenshots/gate-1-evidence";

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

      // Take the screenshot FIRST so we get evidence even if a later
      // assertion fails. Subsequent assertions are regression guards but
      // not blockers for capturing what the owner wants to see.
      await page.screenshot({
        path: `${OUT}/gate-1-landing-${vp.name}.png`,
        fullPage: false,
      });

      // The new outcome-first headline must be visible — proves R2 shipped.
      await expect(page.locator("h1.hero-title")).toContainText("۲۴۸ برنامه");

      // B-02 sanity: the page must NOT actually horizontally scroll.
      // R11 (commit 25ad4b8) closed this on the live URL: the residual
      // body.scrollWidth artefacts (marquee track, snap-scroll cards,
      // glow blobs) are clipped by `html { overflow-x: clip }` and
      // their parent containers' overflow:hidden. The check below
      // measures the canSCROLL property, not the dormant scrollWidth.
      const canScrollHoriz = await page.evaluate(() => {
        const before = window.scrollX;
        window.scrollTo(99999, 0);
        const after = window.scrollX;
        window.scrollTo(before, 0);
        return after > 0;
      });
      expect(canScrollHoriz).toBe(false);

      await ctx.close();
    });
  }

  test("logged-in user is redirected from / to /dashboard", async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const page = await ctx.newPage();

    // Drive the UI to login. The SPA writes to localStorage via
    // sessionStore.set, and the cleanest way to reproduce that state is
    // to go through the form (which is the same code path real users hit).
    await page.goto("/login", { waitUntil: "networkidle" });
    await page.waitForTimeout(400);

    // Form selectors from apps/web/src/pages/Auth.tsx:
    //   - tenant input has placeholder="demo"
    //   - email field has name="email"
    //   - password field has name="password"
    //   - submit button labelled "ورود به حساب"
    const tenantInput = page.locator('input[placeholder="demo"]').first();
    if (await tenantInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tenantInput.fill(STUDENT.tenantSlug);
    }
    await page.locator('input[name="email"]').fill(STUDENT.email);
    await page.locator('input[name="password"]').fill(STUDENT.password);
    // Capture pre-submit state so we have a debugging breadcrumb if
    // login flakes on the next CI iteration.
    await page.screenshot({
      path: `${OUT}/gate-1-login-form-pre-submit.png`,
      fullPage: false,
    });
    await page.locator('button[type="submit"]').click();

    // Wait for the SPA to leave /login.
    await page.waitForURL((u) => !u.pathname.includes("/login"), {
      timeout: 25_000,
    });

    // Now explicitly navigate to "/" and assert the auth redirect bounces
    // us to /dashboard. This is the core B-01 proof.
    await page.goto("/");
    await page.waitForURL((u) => u.pathname.startsWith("/dashboard"), {
      timeout: 10_000,
    });
    expect(page.url()).toMatch(/\/dashboard/);

    await page.waitForTimeout(600);
    await page.screenshot({
      path: `${OUT}/gate-1-redirect-1280.png`,
      fullPage: false,
    });
    await ctx.close();
  });
});
