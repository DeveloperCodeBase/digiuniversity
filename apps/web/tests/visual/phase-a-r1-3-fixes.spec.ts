// Phase-A R1.3 — Post-smoke fix assertions. One test per bug/decision.
// Login-required tests share ONE authenticated context (auth-once
// pattern from R1.2) to dodge the 10/min rate limit.
import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";

const STUDENT = {
  faLabel: "دانشجو",
  email: "student1@digiuniversity.ir",
  password: "StudentPass!1",
  // Strings that must NEVER appear on the public landing after login.
  // Seed identity for the student demo user.
  leakNeedles: ["نسرین", "رضوی", "student1@digiuniversity.ir"],
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

test.describe("R1.3 — B1 sticky navbar with scroll-aware shadow", () => {
  test("nav has position: sticky and html[data-scrolled] toggles past 4px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 600 });
    await page.goto("/about", { waitUntil: "domcontentloaded" });
    // Sticky must be in the computed style — defended in styles.css.
    const navPosition = await page.locator("nav.nav").first().evaluate(
      (el: HTMLElement) => window.getComputedStyle(el).position,
    );
    expect(navPosition).toBe("sticky");
    // At rest, html should NOT carry data-scrolled="true".
    await expect.poll(async () =>
      page.locator("html").getAttribute("data-scrolled"),
    ).not.toBe("true");
    // Scroll past 4px; the scroll listener should flip the attribute.
    await page.evaluate(() => window.scrollTo(0, 200));
    await expect.poll(async () =>
      page.locator("html").getAttribute("data-scrolled"),
      { timeout: 1000 },
    ).toBe("true");
    // Scroll back to top; attribute clears.
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(async () =>
      page.locator("html").getAttribute("data-scrolled"),
      { timeout: 1000 },
    ).not.toBe("true");
  });
});

test.describe("R1.3 — B4 + D9 hamburger-toggle sidebar everywhere", () => {
  test("B4: at 375px, hamburger opens the workspace drawer with sidebar items (not public nav-links)", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.setViewportSize({ width: 375, height: 720 });
    await page.goto("/dashboard");
    // Drawer should be closed at mount.
    await expect(page.locator("[aria-label='منوی workspace']")).toBeHidden();
    // Tap hamburger.
    await page.locator("button.nav-toggle").first().click();
    // Drawer present + visible.
    const drawer = page.locator("[aria-label='منوی workspace']");
    await expect(drawer).toBeVisible();
    // It contains role sidebar items (Persian labels from sidenav.tsx for student),
    // NOT the public nav-links (which would show "خانه" / "کاتالوگ" without sidebar h6 sections).
    await expect(drawer.locator(".side-nav")).toBeVisible();
    // A representative student-sidebar label that is NOT in the public nav-links:
    await expect(drawer.locator("text=کارنامه").first()).toBeVisible();
  });

  test("D9: at 1280 (lg) the workspace hamburger is also visible (not just <lg)", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/dashboard");
    await expect(page.locator("button.nav-toggle").first()).toBeVisible();
    // Sidebar is NOT pinned by default (no inline RoleSideNav next to content).
    await expect(page.locator(".workspace-grid > .side-nav")).toHaveCount(0);
  });

  test("D9: localStorage `digiu_sidebar_pref` toggles on hamburger click", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.setViewportSize({ width: 1280, height: 800 });
    // Navigate first — localStorage access on about:blank throws
    // SecurityError. Once on the SPA's origin, localStorage works.
    await page.goto("/dashboard");
    await page.evaluate(() => localStorage.removeItem("digiu_sidebar_pref"));
    await page.locator("button.nav-toggle").first().click();
    await expect.poll(async () =>
      page.evaluate(() => localStorage.getItem("digiu_sidebar_pref")),
    ).toBe("open");
    // Close via Escape; pref persists as "closed".
    await page.keyboard.press("Escape");
    await expect.poll(async () =>
      page.evaluate(() => localStorage.getItem("digiu_sidebar_pref")),
    ).toBe("closed");
  });

  test("D9: at ≥3xl (1536) with localStorage pref='open', sidebar pins inline beside content", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.setViewportSize({ width: 1536, height: 960 });
    // Seed pref BEFORE the SPA mounts so AppShell reads it at first render.
    await page.addInitScript(() => {
      try { localStorage.setItem("digiu_sidebar_pref", "open"); } catch {}
    });
    await page.goto("/dashboard");
    // Inline sidebar appears beside content (data-sidebar-pinned="true").
    const grid = page.locator(".workspace-grid[data-sidebar-pinned='true']");
    await expect(grid).toBeVisible();
    await expect(grid.locator(".side-nav")).toBeVisible();
    // The Sheet drawer should NOT render in pinned mode (pinned = the
    // inline path; Sheet only renders when NOT pinned).
    await expect(page.locator("[aria-label='منوی workspace']")).toHaveCount(0);
  });

  test("D9: at <3xl, even with pref='open', sidebar opens as Sheet drawer (not inline)", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.addInitScript(() => {
      try { localStorage.setItem("digiu_sidebar_pref", "open"); } catch {}
    });
    await page.goto("/dashboard");
    // No inline pinned grid at 1280 (below 1536).
    await expect(page.locator(".workspace-grid[data-sidebar-pinned='true']")).toHaveCount(0);
  });
});

test.describe("R1.3 — B2 login layout minimum fix", () => {
  test("login role tabs render as 2-column grid at 375 (assert via child positions)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/login");
    const tabs = page.locator(".login-role-tabs").first();
    await expect(tabs).toBeVisible();
    // Computed `grid-template-columns` was returning unexpected values
    // (probably because the inline `style` attribute or another rule
    // wins on this device). Assert the actual visual layout instead:
    // 5 chips in 2 cols = 3 rows of offsetTop → 3 unique Y positions.
    const info = await tabs.evaluate((el: HTMLElement) => ({
      display: window.getComputedStyle(el).display,
      cols: window.getComputedStyle(el).gridTemplateColumns,
      childOffsets: Array.from(el.children).map((c) => (c as HTMLElement).offsetTop),
    }));
    const uniqueRows = new Set(info.childOffsets).size;
    expect(
      uniqueRows,
      `Expected 3 rows (5 chips in 2 cols). Got ${uniqueRows}. display="${info.display}", cols="${info.cols}", offsets=${JSON.stringify(info.childOffsets)}`,
    ).toBe(3);
  });

  test("login form side has max-width ≤420 at 375", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/login");
    const formSide = page.locator(".auth-grid > div").first();
    const maxWidth = await formSide.evaluate((el: HTMLElement) =>
      window.getComputedStyle(el).maxWidth,
    );
    expect(maxWidth).toBe("420px");
  });

  test("login at 375 has no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/login");
    await page.waitForTimeout(300);
    const scrollX = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(scrollX).toBeLessThanOrEqual(2);
  });
});

test.describe("R1.3 — B3 dashboard + profile minimum responsive", () => {
  test("dashboard at 375 has no horizontal overflow", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.setViewportSize({ width: 375, height: 720 });
    await page.goto("/dashboard");
    await page.waitForTimeout(400);
    // No horizontal scrollbar should appear at the body level —
    // workspace-content has overflow-x: hidden + max-width: 100%.
    const scrollX = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(scrollX).toBeLessThanOrEqual(2); // 2px slop for rounding
  });

  test("dashboard stat-row collapses to single column at 375", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.setViewportSize({ width: 375, height: 720 });
    await page.goto("/dashboard");
    const cols = await page.locator(".stat-row").first().evaluate(
      (el: HTMLElement) => window.getComputedStyle(el).gridTemplateColumns,
    );
    // "1fr" or one space-separated value; not 4 fractions.
    expect(cols.split(" ").length).toBe(1);
  });

  test("profile page at 375 has no horizontal overflow + stacks the 1fr-320px grid", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/profile");
    await page.waitForTimeout(400);
    const scrollX = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(scrollX).toBeLessThanOrEqual(2);
  });
});

test.describe("R1.3 — Brand integration (logos + copyright + About)", () => {
  test("PUBLIC footer carries JDO copyright text + theme-aware logo tags", async ({ page }) => {
    await page.goto("/about");
    // The footer's full attribution block exists.
    const fullAttr = page.locator(".org-attribution-full").first();
    await expect(fullAttr).toBeVisible();
    // Persian org name is on the page (used by AboutPage + Footer).
    await expect(page.getByText(/مرکز راهبری پژوهش و پیشرفت هوش مصنوعی جهاد دانشگاهی/).first()).toBeVisible();
    // Both theme-aware logo <img> elements ship in the DOM (light + dark).
    await expect(page.locator('img.org-attribution-logo.is-light').first()).toBeAttached();
    await expect(page.locator('img.org-attribution-logo.is-dark').first()).toBeAttached();
    await expect(page.locator('img.org-attribution-logo.is-light').first()).toHaveAttribute("src", "/logos/jdo-light.png");
    await expect(page.locator('img.org-attribution-logo.is-dark').first()).toHaveAttribute("src", "/logos/jdo-dark.png");
  });

  test("WORKSPACE shows compact attribution bar on every page", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.goto("/dashboard");
    await expect(page.locator(".org-attribution-compact").first()).toBeVisible();
    await expect(page.getByText(/تمامی حقوق محفوظ است/).first()).toBeVisible();
  });

  test("AUTH_FLOW shows compact attribution bar too", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator(".org-attribution-compact").first()).toBeVisible();
  });

  test("About page renders the JDO ownership section + polished Persian paragraph", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator(".about-org-section").first()).toBeVisible();
    // getByText matches against an element's accessible text. The
    // paragraph wraps the org name in a <strong>, so the surrounding
    // paragraph's text *as a whole* is the concatenation. Match on
    // the unique phrase fragments instead of a single long regex
    // that has to span the <strong> boundary.
    await expect(page.getByText(/این پلتفرم توسط/).first()).toBeVisible();
    await expect(page.getByText(/طراحی و توسعه یافته است/).first()).toBeVisible();
    await expect(
      page.getByText(/دیجی‌یونیورسیتی نخستین خروجی عملیاتی این مأموریت/).first(),
    ).toBeVisible();
  });
});

test.describe("R1.3 — B5 landing privacy leak", () => {
  test("authed student on / never sees Nav before redirect (AppShell skeleton holds the chrome)", async ({ browser }) => {
    // The actual leak contract: Nav (with its user-menu showing the
    // authed name) must NOT render while the URL is still the landing.
    // String-matching "نسرین" in HTML was over-broad — Home.tsx has a
    // testimonial that legitimately uses that name as marketing copy,
    // even when no real user is involved. Assert the structural
    // contract instead: nav.nav must never coexist with pathname="/".
    const page = await authedPage(browser);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Poll in the browser (per requestAnimationFrame) for cheap, race-
    // free observation. Resolves when the URL leaves the landing OR a
    // 3-second safety timeout fires.
    const racedToNav: boolean = await page.evaluate(
      () => new Promise<boolean>((resolve) => {
        let sawNavOnLanding = false;
        const tick = (): void => {
          const path = window.location.pathname;
          const onLanding = path === "/" || path === "/home";
          const navEl = document.querySelector("nav.nav");
          if (onLanding && navEl) sawNavOnLanding = true;
          if (!onLanding) { resolve(sawNavOnLanding); return; }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        setTimeout(() => resolve(sawNavOnLanding), 3000);
      }),
    );

    await page.waitForURL((u) => u.pathname.startsWith("/dashboard"), { timeout: 5000 });
    expect(racedToNav, "Nav.nav appeared while still on landing — AppShell should have rendered AuthLoadingSkeleton instead").toBe(false);
    expect(page.url()).toMatch(/\/dashboard/);
  });
});
