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
  // Contract evolution:
  //   R1.1 (Phase 14.7) — inline sidebar visible at lg+, hamburger hidden.
  //   R1.3 D9         — sidebar always a Sheet drawer except 3xl+pref=open;
  //                      hamburger visible at every workspace viewport.
  //   R7.12 (D23+D25)  — at ≥1024: persistent rail INLINE in workspace-grid
  //                      (mini default 72px). Workspace hamburger HIDDEN
  //                      at ≥1024 (its job is taken by the rail's chevron).
  //                      <1024 stays D9 (hamburger + Sheet drawer overlay).
  //   This assertion now matches the R7.12 contract.
  test("WORKSPACE ≥lg: rail visible inline (R7.12), workspace hamburger HIDDEN", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await login(page);
    await page.goto("/dashboard");
    // R7.12 — rail is always in the DOM at ≥1024px workspace.
    await expect(page.locator(".r7-mini-rail")).toBeVisible();
    // R7.12 — workspace hamburger hidden at ≥1024 (rail chevron is the toggle).
    await expect(page.locator("#appshell-sidebar-trigger")).toBeHidden();
    // Sheet drawer NOT mounted at ≥1024 (was mounted before R7.12).
    await expect(page.locator(".appshell-sidebar-drawer")).toHaveCount(0);
  });
  test("PUBLIC ≥lg: inline nav-links visible", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/about");
    await expect(page.locator(".nav-links")).toBeVisible();
  });
});

test.describe("R1.1 — A11y", () => {
  test("workspace hamburger exposes aria-label + disclosure-widget ARIA (aria-expanded + aria-haspopup)", async ({ page }) => {
    // R7.5 updated the ARIA pattern: aria-controls dropped (the IDREF
    // couldn't resolve when Radix Sheet was lazy-mounted-closed),
    // replaced with the canonical disclosure-widget pattern of
    // aria-expanded + aria-haspopup="dialog". Same a11y semantics,
    // axe-clean.
    await page.setViewportSize({ width: 768, height: 1024 });
    await login(page);
    await page.goto("/dashboard");
    const btn = page.locator("button.nav-toggle").first();
    await expect(btn).toHaveAttribute("aria-label", "منو");
    await expect(btn).toHaveAttribute("aria-haspopup", "dialog");
    // aria-expanded reflects sidebar state; starts closed.
    await expect(btn).toHaveAttribute("aria-expanded", "false");
    // Opening the drawer flips it to true.
    await btn.click();
    await expect(btn).toHaveAttribute("aria-expanded", "true");
    // aria-controls is no longer set (R7.5 — was the source of all 53
    // workspace-route axe critical violations).
    await expect(btn).not.toHaveAttribute("aria-controls", /./);
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
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // R7.1+R7.2 timing fix: wait for the page to fully hydrate before
    // pressing Tab. The skip-link is rendered client-side (AppShell);
    // before React commits, pressing Tab focuses the browser chrome
    // (URL bar, etc) which Playwright reports as "no element focused".
    // Pre-R7.1 the slower font load forced an implicit wait that this
    // test relied on; post-R7.1+R7.2 the page paints faster and the
    // race becomes visible. Wait for the skip-link element to exist
    // AND wait for networkidle to ensure full hydration. Then click
    // the body once to ensure the document has focus (some browsers
    // require an interaction before keyboard.press registers).
    await page.locator("a.skip-link").waitFor({ state: "attached", timeout: 5000 });
    await page.waitForLoadState("networkidle");
    await page.locator("body").click();
    // Clicking body focuses the body element; pressing Tab from there
    // moves to the first focusable element, which is the skip-link.
    await page.keyboard.press("Tab");
    await expect(page.locator("a.skip-link")).toBeFocused();
  });
});
