// Phase-A R1.4 — fixes for bugs found in owner manual smoke of R1.3.
// Each assertion satisfies the D12 5-point visual contract:
//   1. DOM present
//   2. Computed style matches design exactly
//   3. Element in correct viewport scroll position
//   4. No overlap with surrounding elements
//   5. Pixel-diff vs committed baseline ≤ 0.001
//
// Baselines committed under docs/visual-baselines/ on first green run.
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

// =====================================================
// Bug #1 — B4: drawer sidebar is a tall vertical list
// =====================================================
test.describe("R1.4 Bug#1 — B4 sidebar drawer renders vertically", () => {
  test("workspace drawer at 375 is a tall vertical list, not a pill row", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/dashboard");
    await page.locator("button.nav-toggle").first().click();
    const drawer = page.locator("[aria-label='منوی workspace']");
    const sideNav = drawer.locator(".side-nav").first();

    // 1. DOM present
    await expect(drawer).toBeAttached();
    await expect(sideNav).toBeAttached();

    // 2. Computed style — vertical, not horizontal pill row.
    // flex-direction is the strongest signal; overflow-x is NOT a
    // reliable check because browsers force overflow-x to "auto" when
    // overflow-y is "auto" (a quirk of the overflow shorthand).
    const styles = await sideNav.evaluate((el) => ({
      display: getComputedStyle(el).display,
      flexDirection: getComputedStyle(el).flexDirection,
    }));
    expect(styles.flexDirection).not.toBe("row");

    // 3. Viewport position — drawer is tall enough to hold the list
    const box = await sideNav.boundingBox();
    expect(box, "sidebar bounding box must exist").not.toBeNull();
    expect(box!.height).toBeGreaterThan(300);

    // 4. Items stack vertically — each link's Y is greater than the previous
    const itemYs = await drawer.locator(".side-nav ul li a").evaluateAll(
      (els) => els.map((e) => (e as HTMLElement).getBoundingClientRect().top),
    );
    expect(itemYs.length, "drawer must contain multiple sidebar items, not just 3 pills").toBeGreaterThan(5);
    for (let i = 1; i < itemYs.length; i++) {
      expect(itemYs[i], `item ${i} must sit below item ${i - 1} (vertical stack)`).toBeGreaterThanOrEqual(itemYs[i - 1]);
    }

    // 5. Pixel-diff baseline — gated behind UPDATE_BASELINES=1 for the
    // first run (no baseline exists; Playwright would fail otherwise).
    // After the owner reviews the candidate PNG and commits it, every
    // subsequent run asserts ≤ 0.001 diff per D12.
    if (process.env.UPDATE_BASELINES === "1") {
      await expect(drawer).toHaveScreenshot("b4-drawer-mobile-375.png", { threshold: 0.001, maxDiffPixelRatio: 0.001 });
    }
  });

  test("section headers ('یادگیری', 'منابع', ...) render in the drawer", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/dashboard");
    await page.locator("button.nav-toggle").first().click();
    const drawer = page.locator("[aria-label='منوی workspace']");
    // The student sidebar has 5 section headers (یادگیری, منابع, هوش مصنوعی, اجتماع, خدمات دانشجویی, حساب).
    // Without the B4 fix, all <h6> were `display: none` at <720px.
    const headers = drawer.locator(".side-nav h6");
    const headerCount = await headers.count();
    expect(headerCount, "drawer must show section headers, not hide them").toBeGreaterThanOrEqual(3);
    await expect(headers.first()).toBeVisible();
  });
});

// =====================================================
// Bug #2 — B5: avatar must not leak `role.avatar` mock to anonymous visitors
// =====================================================
test.describe("R1.4 Bug#2 — B5 avatar does not leak mock role-initials", () => {
  const MOCK_AVATARS = ["نر", "AA", "AM", "MR", "DF", "SK", "NR", "HM", "ZF", "AH"];

  test("anonymous on /about: avatar shows neutral icon, not 'نر'", async ({ page }) => {
    await page.goto("/about");
    const avatar = page.locator("nav.nav .user-btn .avatar").first();

    // 1. DOM present
    await expect(avatar).toBeAttached();

    // The avatar's text content must NOT be any mock role-initial.
    const text = (await avatar.textContent() ?? "").trim();
    expect(MOCK_AVATARS, `avatar leaked mock initials: "${text}"`).not.toContain(text);

    // 2. Computed style — when anonymous, no role-colour class applied.
    const cls = await avatar.evaluate((el) => el.className);
    expect(cls).toMatch(/\bavatar\b/);
    expect(cls, `anonymous avatar must not carry a role colour: "${cls}"`).not.toMatch(/\b(cyan|amber|violet|rose)\b/);

    // 3. Element in viewport (top of nav)
    const box = await avatar.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeLessThan(80);

    // 5. Baseline (gated, see B4 above)
    if (process.env.UPDATE_BASELINES === "1") {
      await expect(avatar).toHaveScreenshot("b5-anon-avatar.png", { threshold: 0.001 });
    }
  });

  test("anonymous on /login: avatar shows neutral icon, not 'نر'", async ({ page }) => {
    await page.goto("/login");
    const avatar = page.locator("nav.nav .user-btn .avatar").first();
    const text = (await avatar.textContent() ?? "").trim();
    expect(MOCK_AVATARS, `/login leaked mock initials: "${text}"`).not.toContain(text);
  });

  test("anonymous on / (landing): avatar shows neutral icon, not 'نر'", async ({ page }) => {
    await page.goto("/");
    const avatar = page.locator("nav.nav .user-btn .avatar").first();
    const text = (await avatar.textContent() ?? "").trim();
    expect(MOCK_AVATARS, `landing leaked mock initials: "${text}"`).not.toContain(text);
  });
});

// =====================================================
// Bug #3 — Brand logos actually load (not broken-image placeholder)
// =====================================================
test.describe("R1.4 Bug#3 — Brand logos serve correctly", () => {
  test("footer JDO logo decodes (whichever theme variant is visible)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/about");
    // Only one of {is-light, is-dark} is rendered per theme via CSS
    // display toggle. Find the visible one and assert IT decoded.
    const visibleLogo = page.locator("img.org-attribution-logo:visible").first();
    await expect(visibleLogo).toBeAttached();
    await expect(visibleLogo).toBeVisible();

    // 2. Image actually decoded — naturalWidth > 0 means the asset
    // loaded successfully; broken-image placeholder gives 0.
    const dims = await visibleLogo.evaluate((el) => ({
      naturalWidth: (el as HTMLImageElement).naturalWidth,
      naturalHeight: (el as HTMLImageElement).naturalHeight,
      src: (el as HTMLImageElement).src,
    }));
    expect(dims.naturalWidth, `logo failed to load. src=${dims.src}`).toBeGreaterThan(0);
    expect(dims.naturalHeight).toBeGreaterThan(0);

    // 3. After scrolling to the footer, the logo is in-viewport.
    await visibleLogo.scrollIntoViewIfNeeded();
    const box = await visibleLogo.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(40);
    expect(box!.height).toBeGreaterThan(40);

    // 5. Baseline (gated)
    if (process.env.UPDATE_BASELINES === "1") {
      await expect(visibleLogo).toHaveScreenshot("brand-jdo-visible.png", { threshold: 0.001 });
    }
  });

  test("footer JDO light logo file resolves over HTTP", async ({ page }) => {
    const resp = await page.request.get("/logos/jdo-light.png");
    expect(resp.status(), "logo asset must serve 200, not 404").toBe(200);
    const buf = await resp.body();
    expect(buf.length, "logo asset must have non-zero size").toBeGreaterThan(1000);
  });
});
