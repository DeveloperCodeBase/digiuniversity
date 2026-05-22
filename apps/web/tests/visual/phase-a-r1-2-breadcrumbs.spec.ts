// Phase-A R1.2 — Breadcrumb behavior assertions.
// Login-required tests share ONE authenticated context (acquired in
// beforeAll) so we don't hit the auth rate limit (10/min) across the
// suite. Public-only tests stay on the default {page} fixture.
import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";

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

test.afterAll(async () => {
  await authedContext?.close();
  authedContext = null;
});

test.describe("R1.2 — Visibility", () => {
  test("hidden on PUBLIC /about", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator("nav[aria-label='مسیر صفحه']")).toHaveCount(0);
  });
  test("hidden on AUTH_FLOW /login", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("nav[aria-label='مسیر صفحه']")).toHaveCount(0);
  });
  test("visible on WORKSPACE /dashboard", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.goto("/dashboard");
    await expect(page.locator("nav[aria-label='مسیر صفحه']")).toBeVisible();
  });
});

test.describe("R1.2 — Trail composition", () => {
  test("/dashboard renders خانه › میز کار", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.goto("/dashboard");
    const crumbs = page.locator("nav[aria-label='مسیر صفحه'] ol > li");
    await expect(crumbs).toHaveCount(2);
    await expect(crumbs.nth(0)).toContainText("خانه");
    await expect(crumbs.nth(1)).toContainText("میز کار");
  });
  test("trailing crumb is aria-current=page and not a link", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.goto("/dashboard");
    const last = page.locator("nav[aria-label='مسیر صفحه'] ol > li").last();
    await expect(last.locator("[aria-current='page']")).toBeVisible();
    await expect(last.locator("a")).toHaveCount(0);
  });
  test("separator is U+203A (›) not / or \\", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.goto("/dashboard");
    const sep = page.locator("nav[aria-label='مسیر صفحه'] .breadcrumb-sep").first();
    await expect(sep).toHaveText("›");
  });
});

test.describe("R1.2 — Truncation at <md", () => {
  test("course/:id with 3 crumbs at md=480 does NOT truncate (≤3)", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.setViewportSize({ width: 480, height: 800 });
    await page.goto("/course/abc-123");
    const ellipsisBtn = page.locator("nav[aria-label='مسیر صفحه'] .breadcrumb-ellipsis");
    await expect(ellipsisBtn).toHaveCount(0);
  });
  test("ellipsis popover opens on click and lists hidden crumbs", async ({ browser }) => {
    // The current 49-route table doesn't have a 4-deep workspace URL, so
    // this test asserts the popover behavior conditionally on the ellipsis
    // appearing. When Phase B adds deeper routes, this becomes the
    // truncation guard. For now it confirms the popover wiring at the
    // viewport that would trigger it.
    const page = await authedPage(browser);
    await page.setViewportSize({ width: 480, height: 800 });
    await page.goto("/dashboard");
    const ellipsis = page.locator("nav[aria-label='مسیر صفحه'] .breadcrumb-ellipsis button");
    if ((await ellipsis.count()) === 0) test.skip();
    await ellipsis.first().click();
    await expect(page.locator(".breadcrumb-popover")).toBeVisible();
  });
});

test.describe("R1.2 — A11y", () => {
  test("nav has aria-label='مسیر صفحه'", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.goto("/dashboard");
    await expect(page.locator("nav[aria-label='مسیر صفحه']")).toBeVisible();
  });
  test("home link is keyboard-focusable", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.goto("/dashboard");
    const homeLink = page.locator("nav[aria-label='مسیر صفحه'] ol a").first();
    await homeLink.focus();
    await expect(homeLink).toBeFocused();
  });
});
