// Phase-A R6.6 — Visual contract for the navbar RTL chrome fix.
//
// User-reported bug: in workspace mode, the hamburger was rendered
// inside `.nav-actions` which under RTL sits at the END edge (left
// in Persian). The expected pattern is hamburger at the START edge
// (right in Persian). Fix moves the workspace hamburger to be the
// first child of `.nav-inner`.
//
// D12 5-point contract (DOM, computed style, viewport position,
// no overlap, baseline). Baselines gated behind UPDATE_BASELINES=1.
//
// 6 viewports × 2 auth states = 12 assertions:
//   - PUBLIC (anonymous): xs / sm / md / lg / xl / 2xl
//   - WORKSPACE (authed): xs / sm / md / lg / xl / 2xl
import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";

const VIEWPORTS = [
  { name: "xs-375",  w: 375,  h: 720 },
  { name: "sm-480",  w: 480,  h: 800 },
  { name: "md-768",  w: 768,  h: 1024 },
  { name: "lg-1024", w: 1024, h: 800 },
  { name: "xl-1280", w: 1280, h: 800 },
  { name: "2xl-1536", w: 1536, h: 960 },
];

const STUDENT = {
  faLabel: "دانشجو",
  email: "student1@digiuniversity.ir",
  password: "StudentPass!1",
};

async function login(page: Page): Promise<void> {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  try { await page.getByRole("button", { name: STUDENT.faLabel }).first().click({ timeout: 1500 }); } catch {}
  try { await page.getByRole("button", { name: /پر کردن خودکار/ }).first().click({ timeout: 1500 }); }
  catch {
    await page.locator('input[name="tenantSlug"]').fill("demo");
    await page.locator('input[name="email"]').fill(STUDENT.email);
    await page.locator('input[name="password"]').fill(STUDENT.password);
  }
  await page.getByRole("button", { name: /ورود به حساب/ }).first().click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15000 });
}

let authedContext: BrowserContext | null = null;
async function authedPage(browser: Browser): Promise<Page> {
  if (!authedContext) {
    authedContext = await browser.newContext();
    const setup = await authedContext.newPage();
    await login(setup);
    await setup.close();
  }
  return await authedContext.newPage();
}
test.afterAll(async () => { await authedContext?.close(); authedContext = null; });

const shotIfBaseline = async (page: Page, name: string): Promise<void> => {
  if (process.env.UPDATE_BASELINES !== "1") return;
  await page.screenshot({ path: `/screenshots/phase-a-r6-6-navbar-rtl-evidence/${name}.png`, fullPage: false });
};

/** D12 helper: assert that <html dir="rtl"> is set. Without this every
 *  other RTL assertion would silently fail because flex-row would lay
 *  out left-to-right. */
async function assertHtmlDirRtl(page: Page): Promise<void> {
  const dir = await page.evaluate(() => document.documentElement.dir);
  expect(dir, "html[dir] must be rtl for Persian layout").toBe("rtl");
}

/** D12-3 viewport position: brand/hamburger lives in the right half
 *  (x > viewport.width / 2) under RTL. The user menu lives in the
 *  left half (x < viewport.width / 2). */
async function assertElementOnRightHalf(page: Page, selector: string, viewportW: number, why: string): Promise<void> {
  const box = await page.locator(selector).first().boundingBox();
  expect(box, `${why}: ${selector} must have a bounding box`).not.toBeNull();
  const centerX = box!.x + box!.width / 2;
  expect(centerX, `${why}: ${selector} center x=${centerX} must be > viewport.width/2 (${viewportW / 2})`)
    .toBeGreaterThan(viewportW / 2);
}

async function assertElementOnLeftHalf(page: Page, selector: string, viewportW: number, why: string): Promise<void> {
  const box = await page.locator(selector).first().boundingBox();
  expect(box, `${why}: ${selector} must have a bounding box`).not.toBeNull();
  const centerX = box!.x + box!.width / 2;
  expect(centerX, `${why}: ${selector} center x=${centerX} must be < viewport.width/2 (${viewportW / 2})`)
    .toBeLessThan(viewportW / 2);
}

test.describe("R6.6 — Public navbar (logged out): logo right, user-menu left", () => {
  for (const v of VIEWPORTS) {
    test(`public @ ${v.name}: <html dir=rtl> + brand on right + user-menu on left`, async ({ page }) => {
      await page.setViewportSize({ width: v.w, height: v.h });
      await page.goto("/home", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(200);

      // D12-1 DOM
      await expect(page.locator("nav.nav")).toBeVisible();
      await expect(page.locator("nav.nav .brand")).toBeVisible();
      await expect(page.locator("nav.nav .user-wrap")).toBeVisible();

      // D12 prerequisite: html dir
      await assertHtmlDirRtl(page);

      // D12-3 viewport position — brand on RIGHT half (start in RTL)
      await assertElementOnRightHalf(page, "nav.nav .brand", v.w, "public brand");

      // D12-3 viewport position — user-menu trigger on LEFT half (end in RTL)
      await assertElementOnLeftHalf(page, "nav.nav .user-wrap", v.w, "public user-menu");

      // D12-4 no overlap — brand and user-wrap do not overlap horizontally
      const brandBox = await page.locator("nav.nav .brand").boundingBox();
      const userBox = await page.locator("nav.nav .user-wrap").boundingBox();
      expect(brandBox).not.toBeNull();
      expect(userBox).not.toBeNull();
      const noOverlap =
        brandBox!.x + brandBox!.width <= userBox!.x + 1 ||
        userBox!.x + userBox!.width <= brandBox!.x + 1;
      expect(noOverlap, `public navbar: brand and user-menu must not overlap horizontally`).toBe(true);

      await shotIfBaseline(page, `public-${v.name}`);
    });
  }
});

test.describe("R6.6 — Workspace navbar (logged in): hamburger right, user-menu left", () => {
  for (const v of VIEWPORTS) {
    test(`workspace @ ${v.name}: hamburger on right + brand follows + user-menu on left`, async ({ browser }) => {
      const page = await authedPage(browser);
      await page.setViewportSize({ width: v.w, height: v.h });
      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(300);

      // D12-1 DOM — workspace navbar has the new start-anchored hamburger
      await expect(page.locator("nav.nav[data-mode='workspace']")).toBeVisible();
      const hamburger = page.locator("#appshell-sidebar-trigger");
      await expect(hamburger).toBeVisible();
      await expect(page.locator("nav.nav .brand")).toBeVisible();
      await expect(page.locator("nav.nav .user-wrap")).toBeVisible();

      // D12 prerequisite
      await assertHtmlDirRtl(page);

      // D12-3 — hamburger center on RIGHT half (start in RTL)
      await assertElementOnRightHalf(page, "#appshell-sidebar-trigger", v.w, "workspace hamburger");

      // D12-3 — user-menu trigger on LEFT half (end in RTL)
      await assertElementOnLeftHalf(page, "nav.nav .user-wrap", v.w, "workspace user-menu");

      // Extra: hamburger sits at the EXTREME right (further right than
      // brand) because it's the new start-anchored element per R6.6.
      const hBox = await hamburger.boundingBox();
      const brandBox = await page.locator("nav.nav .brand").boundingBox();
      expect(hBox).not.toBeNull();
      expect(brandBox).not.toBeNull();
      const hCenter = hBox!.x + hBox!.width / 2;
      const brandCenter = brandBox!.x + brandBox!.width / 2;
      expect(hCenter, "workspace hamburger center x must be >= brand center x (start edge in RTL)")
        .toBeGreaterThanOrEqual(brandCenter);

      // D12-4 no overlap — hamburger and brand do not overlap horizontally
      const noHBrandOverlap =
        hBox!.x + hBox!.width <= brandBox!.x + 1 ||
        brandBox!.x + brandBox!.width <= hBox!.x + 1;
      expect(noHBrandOverlap, "workspace navbar: hamburger and brand must not overlap").toBe(true);

      // D12-4 no overlap — hamburger and user-wrap do not overlap
      const userBox = await page.locator("nav.nav .user-wrap").boundingBox();
      expect(userBox).not.toBeNull();
      const noHUserOverlap =
        hBox!.x + hBox!.width <= userBox!.x + 1 ||
        userBox!.x + userBox!.width <= hBox!.x + 1;
      expect(noHUserOverlap, "workspace navbar: hamburger and user-menu must not overlap").toBe(true);

      // Hamburger opens the drawer (a11y wiring sanity)
      await hamburger.click();
      await expect(page.locator(".appshell-sidebar-drawer")).toBeVisible();
      // Close via Escape so subsequent tests don't inherit an open drawer
      await page.keyboard.press("Escape");

      await shotIfBaseline(page, `workspace-${v.name}`);
    });
  }
});
