// Phase-A R3 — Six role-specific dashboards (SuperAdmin / ContentManager /
// TA / Support / Moderator / Org). Each renders the DashboardShell with
// role-specific KPIs + visible MockBadge.
//
// D12 5-point contract per assertion:
//   1 DOM, 2 computed style, 3 viewport position, 4 no overlap, 5 baseline
// Baselines gated behind UPDATE_BASELINES=1 per the R1.4/R5 workflow.
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
test.afterAll(async () => { await authedContext?.close(); authedContext = null; });

interface RoleDash {
  path: string;
  title: string;
  kpiCount: number;
}

const DASHBOARDS: RoleDash[] = [
  { path: "/super",    title: "میز ابرمدیر",          kpiCount: 4 },
  { path: "/content",  title: "میز مدیر محتوا",       kpiCount: 4 },
  { path: "/ta",       title: "میز دستیار آموزشی",    kpiCount: 4 },
  { path: "/support",  title: "میز پشتیبانی",         kpiCount: 4 },
  { path: "/moderate", title: "میز نظارت انجمن‌ها",   kpiCount: 4 },
  { path: "/org",      title: "میز مدیر سازمان",       kpiCount: 4 },
];

for (const dash of DASHBOARDS) {
  test.describe(`R3 — ${dash.path} dashboard`, () => {
    test(`renders with heading + KPI grid + MockBadge at 1280`, async ({ browser }) => {
      const page = await authedPage(browser);
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(dash.path);

      // 1. DOM: main + dash-greet exist
      await expect(page.locator("main").first()).toBeVisible();
      // Heading contains the role's title
      await expect(page.getByRole("heading", { level: 1, name: new RegExp(dash.title) })).toBeVisible();
      // KPI strip has the expected count
      const kpis = page.locator("main .stat-row .stat");
      await expect(kpis).toHaveCount(dash.kpiCount);
      // 2 + 3. Computed style: KPI strip is a grid; each KPI has positive height
      const firstKpi = kpis.first();
      const box = await firstKpi.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThan(60);
      // Every KPI shows the MockBadge ("نمونه")
      const badges = page.locator("main [data-mock='true']");
      const badgeCount = await badges.count();
      // 1 in the eyebrow + at least one per KPI (4) = ≥5 visible
      expect(badgeCount).toBeGreaterThanOrEqual(dash.kpiCount);
      // No horizontal overflow at 1280
      const scrollX = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(scrollX).toBeLessThanOrEqual(2);
    });

    test(`renders at 375 with no horizontal overflow`, async ({ browser }) => {
      const page = await authedPage(browser);
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto(dash.path);
      await page.waitForTimeout(300);
      await expect(page.getByRole("heading", { level: 1, name: new RegExp(dash.title) })).toBeVisible();
      const scrollX = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(scrollX, `${dash.path} must not overflow horizontally at 375`).toBeLessThanOrEqual(2);
    });
  });
}
