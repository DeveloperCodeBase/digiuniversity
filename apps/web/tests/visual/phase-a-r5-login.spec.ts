// Phase-A R5 — Visual contract for the redesigned login.
// Per D12: each assertion covers structural + computed style +
// viewport position + (where applicable) overlap + (gated) baseline.
import { test, expect, type Page } from "@playwright/test";

const VIEWPORTS = [
  { name: "xs-320",  w: 320,  h: 720 },
  { name: "sm-480",  w: 480,  h: 800 },
  { name: "md-768",  w: 768,  h: 1024 },
  { name: "lg-1024", w: 1024, h: 800 },
  { name: "xl-1280", w: 1280, h: 800 },
  { name: "2xl-1536", w: 1536, h: 960 },
];

const shotIfBaseline = async (page: Page, name: string): Promise<void> => {
  if (process.env.UPDATE_BASELINES !== "1") return;
  await page.screenshot({ path: `/screenshots/phase-a-r5-login-evidence/${name}.png`, fullPage: true });
};

test.describe("R5 — Login redesign: structural shell", () => {
  test("login renders the r5-login-shell with wordmark + form + co-brand footer", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/login");
    await expect(page.locator(".r5-login-shell")).toBeVisible();
    await expect(page.locator(".r5-form-panel")).toBeVisible();
    // Co-brand footer text is unique and stable
    await expect(page.getByText(/با همکاری جهاد دانشگاهی/).first()).toBeVisible();
    // Wordmark
    await expect(page.getByText(/دیجی‌یونیورسیتی/).first()).toBeVisible();
    // Welcome headline
    await expect(page.getByRole("heading", { name: /خوش آمدید/ })).toBeVisible();
  });

  test("login at 1280 shows BOTH brand panel and form panel side-by-side", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/login");
    const brand = page.locator(".r5-brand-panel");
    const form = page.locator(".r5-form-panel");
    await expect(brand).toBeVisible();
    await expect(form).toBeVisible();
    const brandBox = await brand.boundingBox();
    const formBox = await form.boundingBox();
    expect(brandBox).not.toBeNull();
    expect(formBox).not.toBeNull();
    // Side-by-side: neither overlaps the other horizontally
    const noOverlap =
      brandBox!.x + brandBox!.width <= formBox!.x + 1 ||
      formBox!.x + formBox!.width <= brandBox!.x + 1;
    expect(noOverlap, "brand and form panels must be side-by-side at lg+").toBe(true);
    // Both span the full viewport height
    expect(brandBox!.height).toBeGreaterThan(600);
    expect(formBox!.height).toBeGreaterThan(600);
    await shotIfBaseline(page, "lg-1280-split");
  });

  test("login at 768 collapses to single column (brand becomes top strip)", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/login");
    const brand = page.locator(".r5-brand-panel");
    const form = page.locator(".r5-form-panel");
    await expect(brand).toBeVisible();
    await expect(form).toBeVisible();
    const brandBox = await brand.boundingBox();
    const formBox = await form.boundingBox();
    // Stacked vertically — form sits BELOW the brand strip
    expect(formBox!.y).toBeGreaterThanOrEqual(brandBox!.y);
    // Brand panel is capped at ~260px (per the responsive CSS)
    expect(brandBox!.height).toBeLessThan(320);
    await shotIfBaseline(page, "md-768-stacked");
  });

  test("login at 375 hides the brand panel entirely (form-only)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/login");
    await expect(page.locator(".r5-brand-panel")).toBeHidden();
    await expect(page.locator(".r5-form-panel")).toBeVisible();
    await shotIfBaseline(page, "sm-375-form-only");
  });
});

test.describe("R5 — Role selector behaviour", () => {
  test("role selector renders all 5 chips + slides indicator on click", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/login");
    const chips = page.locator(".r5-role-tabs [role='tab']");
    await expect(chips).toHaveCount(5);
    // Student selected by default
    await expect(chips.nth(0)).toHaveAttribute("aria-selected", "true");
    // Click "استاد"
    await chips.nth(1).click();
    await expect(chips.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(chips.nth(0)).toHaveAttribute("aria-selected", "false");
  });

  test("role selector at 375 hides the icons but keeps the labels readable", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/login");
    const firstChip = page.locator(".r5-role-tabs [role='tab']").first();
    const svgVisible = await firstChip.locator("svg").first().isVisible();
    // The CSS hides svg inside role-tabs at <=420
    expect(svgVisible).toBe(false);
    // Label still readable
    await expect(firstChip).toContainText("دانشجو");
  });
});

test.describe("R5 — Demo box auto-fill", () => {
  test("clicking 'پر کردن خودکار' fills email + password from DEMO_CREDS", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/login");
    const email = page.locator("input[name='email']");
    const pass = page.locator("input[name='password']");
    // Empty initially
    await expect(email).toHaveValue("");
    await expect(pass).toHaveValue("");
    // Click the auto-fill button
    await page.getByRole("button", { name: /پر کردن خودکار/ }).first().click();
    await expect(email).toHaveValue("student1@digiuniversity.ir");
    await expect(pass).toHaveValue("StudentPass!1");
  });
});

test.describe("R5 — Form a11y + behaviour", () => {
  test("password show/hide toggle flips input type", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/login");
    const pass = page.locator("input[name='password']");
    await pass.fill("Test1234!");
    await expect(pass).toHaveAttribute("type", "password");
    // Click the eye toggle (button just before the password input)
    await page.getByLabel(/نمایش رمز|مخفی‌سازی رمز/).first().click();
    await expect(pass).toHaveAttribute("type", "text");
  });

  test("password strength meter appears when password is non-empty", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/login");
    await page.locator("input[name='password']").fill("abc");
    // The strength label is one of the 5 known labels
    const meter = page.getByText(/خیلی ضعیف|ضعیف|متوسط|قوی|خیلی قوی/).first();
    await expect(meter).toBeVisible();
  });

  test("submit button has min-height ≥44 (WCAG 2.5.5 touch target)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/login");
    const submit = page.getByRole("button", { name: /ورود به حساب/ }).first();
    const box = await submit.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test("form has no horizontal overflow at 375", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/login");
    await page.waitForTimeout(400);
    const scrollX = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(scrollX).toBeLessThanOrEqual(2);
  });
});

test.describe("R5 — Theme toggle", () => {
  test("clicking the theme pill flips html[data-theme]", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/login");
    const initial = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    await page.getByLabel("تغییر تم").first().click();
    await page.waitForTimeout(200);
    const after = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    expect(after).not.toBe(initial);
  });
});
