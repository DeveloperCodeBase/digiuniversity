// Phase A R7.3 — Focused a11y assertions per fix (Lighthouse subset).
//
// Complements gate-a-axe-scan.spec.ts (axe-core surface across 67
// routes) by pinning the SPECIFIC fixes from the R7.3 memo. Each
// assertion targets a single Lighthouse-flagged surface so a future
// regression that re-introduces the same bug shape (icon-only button
// without aria-label, h4 directly under h2, gold-as-text on white,
// etc.) surfaces as a focused test failure rather than a Lighthouse
// score drift.
//
// Tagged @gate-a so a future CI step can pick the whole gate-a suite.
//
// Auth: most R7.3 fixes are on PUBLIC / AUTH_FLOW routes which don't
// need a session. Only the user-btn aria-label assertion has both
// anonymous and authed branches; the authed branch shares the same
// login helper R7.7 used.

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
    authedContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const setup = await authedContext.newPage();
    await login(setup);
    await setup.close();
  }
  return await authedContext.newPage();
}
test.afterAll(async () => { await authedContext?.close(); authedContext = null; });

test.describe("@gate-a R7.3 — Per-fix Lighthouse a11y assertions", () => {
  // ----- Page / (landing) -----

  test("A.1 anonymous /: .user-btn has aria-label='منوی حساب'", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const btn = page.locator("button.user-btn").first();
    await expect(btn).toBeVisible();
    // "منوی حساب" not "ورود به حساب" — the latter is the form's submit
    // button text. Picking a distinct string avoids breaking the shared
    // Playwright login helper that uses
    // getByRole("button", { name: /ورود به حساب/ }).first().
    await expect(btn).toHaveAttribute("aria-label", "منوی حساب");
  });

  test("A.1 authed /: .user-btn has aria-label='منوی کاربر'", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const btn = page.locator("button.user-btn").first();
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute("aria-label", "منوی کاربر");
  });

  test("A.2.i /: footer brand-description <p> has NO inline color attr", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const p = page.locator(".footer .footer-grid > div").first().locator("p").first();
    await expect(p).toBeVisible();
    const style = await p.getAttribute("style");
    // The element must not declare a color via inline style — the
    // `.footer p { color: rgba(255,255,255,0.7) }` rule should win.
    expect(style ?? "").not.toMatch(/color\s*:/i);
  });

  test("A.2.ii /: footer .org-attribution-copyright computed color is the dark-bg token", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const el = page.locator(".footer .org-attribution-copyright").first();
    await expect(el).toBeVisible();
    const color = await el.evaluate((n) => window.getComputedStyle(n).color);
    // `--fg-mute-on-dark` is #aab0c4 in light theme + #6a708a in dark (still readable on the navy footer).
    // Computed color is rgb(...) so assert it's NOT the failing #4a5a76 (rgb(74,90,118)).
    expect(color).not.toMatch(/rgb\(\s*74\s*,\s*90\s*,\s*118\s*\)/);
  });

  test("A.3.i /: heading order has no h2→h4 skip (course-card title is now h3)", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // The course-card body title (was <h4>) should now be <h3>.
    const h3 = page.locator(".course-body h3").first();
    await expect(h3).toBeVisible();
    // No <h4> inside .course-body anymore.
    const h4Count = await page.locator(".course-body h4").count();
    expect(h4Count, "no remaining <h4> inside .course-body").toBe(0);
  });

  test("A.3.ii /: footer column headers are <h3>, not <h5>", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // At least one footer column h3 must exist (e.g. "محصول").
    const h3 = page.locator(".footer h3").first();
    await expect(h3).toBeVisible();
    const h5Count = await page.locator(".footer h5").count();
    expect(h5Count, "no remaining <h5> inside .footer").toBe(0);
  });

  // ----- Page /login -----

  test("B.1 /login: span-checkboxes have aria-label", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    const spans = page.locator('span[role="checkbox"]');
    const count = await spans.count();
    expect(count, "/login should render at least 1 span-checkbox").toBeGreaterThanOrEqual(1);
    for (let i = 0; i < Math.min(count, 4); i++) {
      const label = await spans.nth(i).getAttribute("aria-label");
      expect(label, `span-checkbox #${i} must have a non-empty aria-label`).toBeTruthy();
      expect((label ?? "").length, `span-checkbox #${i} aria-label must be > 1 char`).toBeGreaterThan(1);
    }
  });

  test("B.3 /login: .org-attribution-compact uses --fg-mute (not --fg-dim)", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    const compact = page.locator(".org-attribution-compact").first();
    await expect(compact).toBeVisible();
    const color = await compact.evaluate((n) => window.getComputedStyle(n).color);
    // Assert it's NOT the failing #768094 (rgb(118,128,148)) — should be the darker #4a5a76 token.
    expect(color).not.toMatch(/rgb\(\s*118\s*,\s*128\s*,\s*148\s*\)/);
  });

  test("B.4 /login: language toggle aria-label includes visible 'FA' text", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    // The language toggle is the PillButton with visible "FA".
    const btn = page.locator("button[aria-label*='تغییر زبان']").first();
    await expect(btn).toBeVisible();
    const label = await btn.getAttribute("aria-label");
    expect(label, "language toggle must include visible 'FA' in aria-label").toContain("FA");
  });

  // ----- Page /programs -----

  test("C.2.i /programs: .prog-card .num is aria-hidden", async ({ page }) => {
    await page.goto("/programs", { waitUntil: "domcontentloaded" });
    const num = page.locator(".prog-card .num").first();
    await expect(num).toBeVisible();
    await expect(num).toHaveAttribute("aria-hidden", "true");
  });

  test("C.2.ii /programs: .card-flat eyebrow uses --fg (not gold/rose)", async ({ page }) => {
    await page.goto("/programs", { waitUntil: "domcontentloaded" });
    // The delivery-modes panel: 4 .card-flat divs, each has an eyebrow div with "تأخیر"/"any-time"/etc.
    const cards = page.locator(".card-flat");
    const cardCount = await cards.count();
    expect(cardCount, "/programs delivery-modes panel should render 4 cards").toBeGreaterThanOrEqual(1);
    for (let i = 0; i < Math.min(cardCount, 4); i++) {
      const eyebrow = cards.nth(i).locator("div").first();
      const color = await eyebrow.evaluate((n) => window.getComputedStyle(n).color);
      // Assert it's NOT the gold-ish #e7c87a that the failing var(--rose) resolves to.
      expect(color).not.toMatch(/rgb\(\s*231\s*,\s*200\s*,\s*122\s*\)/);
    }
  });

  test("C.3.i /programs: <h2> exists before any <h3> (heading-order ladder valid)", async ({ page }) => {
    await page.goto("/programs", { waitUntil: "domcontentloaded" });
    // After the page's h1 (hero), there should be an h2 before any h3.
    const allHeadings = await page.locator("h1, h2, h3, h4, h5, h6").evaluateAll((els) =>
      els.map((e) => e.tagName.toLowerCase()),
    );
    // Find the first h3 index.
    const firstH3 = allHeadings.indexOf("h3");
    if (firstH3 === -1) {
      // No h3 means the page has no skip — pass.
      return;
    }
    // There must be an h2 BEFORE firstH3.
    const h2Before = allHeadings.slice(0, firstH3).includes("h2");
    expect(h2Before, "an <h2> must appear before any <h3> on /programs").toBe(true);
  });

  test("C.3.ii /programs: .card-flat title is <h3> (not <h4>)", async ({ page }) => {
    await page.goto("/programs", { waitUntil: "domcontentloaded" });
    const cardFlatH3 = page.locator(".card-flat h3").first();
    await expect(cardFlatH3).toBeVisible();
    const cardFlatH4Count = await page.locator(".card-flat h4").count();
    expect(cardFlatH4Count, "no remaining <h4> inside .card-flat").toBe(0);
  });

  test("C.4 /programs: .prog-card buttons do NOT carry aria-label (let visible text speak)", async ({ page }) => {
    await page.goto("/programs", { waitUntil: "domcontentloaded" });
    const cards = page.locator("button.prog-card");
    const count = await cards.count();
    expect(count, "/programs should render at least 1 prog-card").toBeGreaterThanOrEqual(1);
    for (let i = 0; i < Math.min(count, 6); i++) {
      const label = await cards.nth(i).getAttribute("aria-label");
      expect(label, `.prog-card #${i} must NOT carry aria-label`).toBeNull();
    }
  });

  // ----- Shared cross-page assertions -----

  test("Shared: .user-btn aria-label persists on /login and /programs", async ({ page }) => {
    for (const route of ["/login", "/programs"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      const btn = page.locator("button.user-btn").first();
      const label = await btn.getAttribute("aria-label");
      expect(label, `${route}: .user-btn must have aria-label (anonymous = منوی حساب)`).toBe("منوی حساب");
    }
  });
});
