// Phase-16 R8 evidence — mobile bottom nav lights up on workspace
// pages, hides on /classroom and at >=md.
import { test, type Browser } from "@playwright/test";

const OUT = "/screenshots/gate-2-evidence/r8-bottom-nav";

const STUDENT = {
  tenantSlug: "demo",
  email: "student1@digiuniversity.ir",
  password: "StudentPass!1",
};

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

test.describe("R8 BottomNav — visibility matrix", () => {
  test("dashboard at 320 — bottom nav visible", async ({ browser }) => {
    const { ctx, page } = await loginContext(browser, { width: 320, height: 568 });
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800);
    await page.screenshot({
      path: `${OUT}/dashboard-with-nav--mobile-320.png`,
      fullPage: false,
    });
    await ctx.close();
  });

  test("my-courses at 375 — bottom nav visible", async ({ browser }) => {
    const { ctx, page } = await loginContext(browser, { width: 375, height: 812 });
    await page.goto("/my-courses");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800);
    await page.screenshot({
      path: `${OUT}/my-courses-with-nav--mobile-375.png`,
      fullPage: false,
    });
    await ctx.close();
  });

  test("dashboard at 1280 — bottom nav HIDDEN (desktop uses sidenav)", async ({ browser }) => {
    const { ctx, page } = await loginContext(browser, { width: 1280, height: 800 });
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800);
    await page.screenshot({
      path: `${OUT}/dashboard-no-nav--desktop-1280.png`,
      fullPage: false,
    });
    await ctx.close();
  });

  test("classroom at 320 — bottom nav HIDDEN (full-screen video shell)", async ({ browser }) => {
    const { ctx, page } = await loginContext(browser, { width: 320, height: 568 });
    await page.goto("/classroom");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800);
    await page.screenshot({
      path: `${OUT}/classroom-no-nav--mobile-320.png`,
      fullPage: false,
    });
    await ctx.close();
  });
});
