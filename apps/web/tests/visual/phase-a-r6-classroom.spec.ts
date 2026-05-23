// Phase-A R6 — Visual contract for the redesigned Classroom (Live Class + AI).
//
// D12 5-point contract per assertion:
//   1 DOM, 2 computed style, 3 viewport position, 4 no overlap, 5 baseline.
// Baselines gated behind UPDATE_BASELINES=1 (consistent with R1.4 + R3 + R5).
//
// Auth: shared BrowserContext via beforeAll (avoids the /v1/auth/login
// rate-limit bucket that bit R1.2). One login per spec run.
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

const shotIfBaseline = async (page: Page, name: string): Promise<void> => {
  if (process.env.UPDATE_BASELINES !== "1") return;
  await page.screenshot({ path: `/screenshots/phase-a-r6-classroom-evidence/${name}.png`, fullPage: true });
};

test.describe("R6 — Classroom shell", () => {
  test("classroom renders r6-classroom-shell + course head + workspace at 1280", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/classroom", { waitUntil: "domcontentloaded" });

    const shell = page.locator(".r6-classroom-shell");
    const head = page.locator(".r6-course-head");
    const workspace = page.locator(".r6-workspace");
    await expect(shell).toBeVisible();
    await expect(head).toBeVisible();
    await expect(workspace).toBeVisible();

    // D12-2 computed style: course head taller than zero
    const headBox = await head.boundingBox();
    expect(headBox).not.toBeNull();
    expect(headBox!.height).toBeGreaterThan(60);

    // D12-3 viewport position
    expect(headBox!.x).toBeGreaterThanOrEqual(0);
    expect(headBox!.y).toBeGreaterThanOrEqual(0);

    await shotIfBaseline(page, "classroom-1280");
  });

  test("stage + AI panel sit side-by-side at >=920px", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/classroom", { waitUntil: "domcontentloaded" });

    const stage = page.locator(".r6-stage");
    const ai = page.locator(".r6-ai-panel").first();
    await expect(stage).toBeVisible();
    await expect(ai).toBeVisible();

    const stageBox = await stage.boundingBox();
    const aiBox = await ai.boundingBox();
    expect(stageBox).not.toBeNull();
    expect(aiBox).not.toBeNull();
    // D12-4 no overlap — side-by-side
    const noOverlap =
      stageBox!.x + stageBox!.width <= aiBox!.x + 1 ||
      aiBox!.x + aiBox!.width <= stageBox!.x + 1;
    expect(noOverlap, "stage and AI panel must be side-by-side at >=920px").toBe(true);
  });

  test("slide canvas + slide content visible inside the stage", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/classroom", { waitUntil: "domcontentloaded" });

    const slide = page.locator(".r6-slide");
    await expect(slide).toBeVisible();
    const slideBox = await slide.boundingBox();
    expect(slideBox).not.toBeNull();
    expect(slideBox!.height).toBeGreaterThan(200);

    await expect(page.locator(".r6-slide-canvas")).toBeVisible();
    await expect(page.locator(".r6-slide-counter")).toBeVisible();
    await expect(page.locator(".r6-slide-rec")).toBeVisible();
    // Slide title is the Persian topic of slide 1 (scoped to .r6-slide-title
    // because the course-head h1 also contains the same string).
    await expect(page.locator(".r6-slide-title")).toContainText("گرادیان نزولی تصادفی");
  });

  test("participant rail visible with host + +35 overflow", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/classroom", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".r6-rail")).toBeVisible();
    // The +35 overflow chip
    await expect(page.getByText("+۳۵")).toBeVisible();
    // The host badge — first speaking tile has "HOST" label
    await expect(page.locator(".r6-rail-host").first()).toBeVisible();
  });

  test("control bar has mic/cam/screen/hand + leave button", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/classroom", { waitUntil: "domcontentloaded" });
    const controls = page.locator(".r6-controls");
    await expect(controls).toBeVisible();
    // Leave button — visible label is the short "خروج"; the longer
    // "خروج از کلاس" is only in the title attribute (which doesn't
    // contribute to the computed accessible name when text is present).
    await expect(page.locator(".r6-ctl-btn.is-danger")).toBeVisible();
    await expect(page.locator(".r6-ctl-btn.is-danger")).toContainText("خروج");
  });

  test("MockBadge appears in the course-head crumb (Phase-A stub policy)", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/classroom", { waitUntil: "domcontentloaded" });
    const badge = page.locator('.r6-course-head [data-mock="true"]').first();
    await expect(badge).toBeVisible();
  });
});

test.describe("R6 — AI panel tabs", () => {
  test("4 tabs visible: دستیار / زیرنویس / پرسش / نظرسنجی", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/classroom", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("tab", { name: /دستیار/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /زیرنویس/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /پرسش/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /نظرسنجی/ })).toBeVisible();
  });

  test("switching to Q&A tab reveals the ask-input + sorted cards", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/classroom", { waitUntil: "domcontentloaded" });
    await page.getByRole("tab", { name: /پرسش/ }).click();
    await expect(page.locator(".r6-qa-ask input")).toBeVisible();
    // At least one pre-seeded question card visible
    await expect(page.locator(".r6-qa-card").first()).toBeVisible();
  });

  test("switching to poll tab reveals options + timeline", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/classroom", { waitUntil: "domcontentloaded" });
    await page.getByRole("tab", { name: /نظرسنجی/ }).click();
    await expect(page.locator(".r6-poll-options")).toBeVisible();
    await expect(page.locator(".r6-tl-card")).toBeVisible();
    // NOW indicator on the current concept
    await expect(page.getByText(/^NOW$/)).toBeVisible();
  });
});

test.describe("R6 — Responsive", () => {
  test("classroom at 375 has no horizontal overflow", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/classroom", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".r6-classroom-shell")).toBeVisible();
    const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
    const innerW = await page.evaluate(() => window.innerWidth);
    // ≤2px slack for sub-pixel rounding
    expect(scrollW - innerW).toBeLessThanOrEqual(2);
    // Page-local FAB visible on narrow
    await expect(page.locator(".r6-page-fab")).toBeVisible();
  });

  test("classroom at 768 stacks layout but keeps stage visible", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/classroom", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".r6-stage")).toBeVisible();
    const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
    const innerW = await page.evaluate(() => window.innerWidth);
    expect(scrollW - innerW).toBeLessThanOrEqual(2);
  });

  test("page-local FAB opens the AI sheet on narrow", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/classroom", { waitUntil: "domcontentloaded" });
    const fab = page.locator(".r6-page-fab");
    await expect(fab).toBeVisible();
    await fab.click();
    // The sheet flips to is-open
    await expect(page.locator(".r6-ai-sheet.is-open")).toBeVisible();
  });
});
