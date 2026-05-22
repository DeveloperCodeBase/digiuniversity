// Phase-A R1.1 — AppShell behavior assertions.
// 3-mode topology, logo target by mode+auth, responsive sidebar/hamburger,
// drawer a11y. Screenshots are produced separately by the audit-logged-in
// suite; this file is assertion-only so failures point at behavior, not pixel diffs.
import { test, expect, type Page } from "@playwright/test";

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
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 8000 });
}

test.describe("R1.1 — 3-mode topology", () => {
  test("AUTH_FLOW /login hides hamburger and nav-links", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/login");
    await expect(page.locator("nav.nav[data-mode='auth_flow']")).toBeVisible();
    await expect(page.locator("nav.nav .nav-toggle")).toBeHidden();
    await expect(page.locator("nav.nav .nav-links")).toHaveCount(0);
  });
  test("PUBLIC /about: hamburger drawer at <lg shows nav-links", async ({ page }) => {
    await page.setViewportSize({ width: 480, height: 800 });
    await page.goto("/about");
    await expect(page.locator("nav.nav[data-mode='public']")).toBeVisible();
    await page.locator("button.nav-toggle").first().click();
    await expect(page.locator(".nav-links.open")).toBeVisible();
  });
  test("WORKSPACE /dashboard: hamburger opens sidebar Sheet drawer", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await login(page);
    await page.goto("/dashboard");
    await expect(page.locator("nav.nav[data-mode='workspace']")).toBeVisible();
    await expect(page.locator("[aria-label='منوی workspace']")).toBeHidden();
    await page.locator("button.nav-toggle").first().click();
    await expect(page.locator("[aria-label='منوی workspace']")).toBeVisible();
  });
});

test.describe("R1.1 — Logo target by mode + auth", () => {
  test("PUBLIC anon → /home", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator("a.brand").first()).toHaveAttribute("href", "/home");
  });
  test("PUBLIC student authed → /dashboard", async ({ page }) => {
    await login(page);
    await page.goto("/about");
    await expect(page.locator("a.brand").first()).toHaveAttribute("href", "/dashboard");
  });
  test("WORKSPACE → /dashboard", async ({ page }) => {
    await login(page);
    await page.goto("/dashboard");
    await expect(page.locator("a.brand").first()).toHaveAttribute("href", "/dashboard");
  });
  test("AUTH_FLOW → /home", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("a.brand").first()).toHaveAttribute("href", "/home");
  });
});

test.describe("R1.1 — Responsive sidebar/hamburger", () => {
  test("WORKSPACE <lg: inline sidebar hidden, hamburger visible", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await login(page);
    await page.goto("/dashboard");
    await expect(page.locator(".workspace-grid > .side-nav")).toHaveCount(0);
    await expect(page.locator("button.nav-toggle")).toBeVisible();
  });
  // R1.1 originally asserted "inline sidebar visible, hamburger hidden"
  // at lg+. R1.3 D9 changed the contract: sidebar is ALWAYS a Sheet
  // drawer except at ≥3xl + pref="open". Hamburger is visible at every
  // viewport in workspace mode. Updated to the D9 contract; the D9 spec
  // file has the pinned-at-3xl exception test.
  test("WORKSPACE ≥lg: hamburger visible (D9), no inline sidebar by default", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await login(page);
    await page.goto("/dashboard");
    await expect(page.locator("button.nav-toggle").first()).toBeVisible();
    await expect(page.locator(".workspace-grid .side-nav")).toHaveCount(0);
  });
  test("PUBLIC ≥lg: inline nav-links visible", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/about");
    await expect(page.locator(".nav-links")).toBeVisible();
  });
});

test.describe("R1.1 — A11y", () => {
  test("workspace hamburger exposes aria-label + aria-controls", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await login(page);
    await page.goto("/dashboard");
    const btn = page.locator("button.nav-toggle").first();
    await expect(btn).toHaveAttribute("aria-label", "منو");
    await expect(btn).toHaveAttribute("aria-controls", "appshell-sidebar-drawer");
  });
  test("workspace drawer: Escape closes and returns focus to hamburger", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await login(page);
    await page.goto("/dashboard");
    const btn = page.locator("button.nav-toggle").first();
    await btn.click();
    await expect(page.locator("[aria-label='منوی workspace']")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("[aria-label='منوی workspace']")).toBeHidden();
    await expect(btn).toBeFocused();
  });
  test("skip-link receives focus on first Tab", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.locator("a.skip-link")).toBeFocused();
  });
});
