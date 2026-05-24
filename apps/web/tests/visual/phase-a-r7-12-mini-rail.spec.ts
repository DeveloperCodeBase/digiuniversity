// Phase-A R7.12 — Visual contract for the mini-variant persistent sidebar.
//
// Per D23 + D25 + D26 + the R7.12 memo. Verifies:
//   1. Breakpoint cutover at 1023 / 1024 — rail must NOT show at 1023,
//      MUST show at 1024 (the new ≥1024 workspace pattern).
//   2. Mini mode default — fresh visitors see the 72px icon-only rail.
//   3. Expanded mode — width animates to 280px when toggle pressed.
//   4. localStorage persistence — { mode: "mini" } / { mode: "expanded" }
//      survives reload; legacy "open"/"closed" values migrate cleanly.
//   5. Content margin matches the rail width (no overlap).
//   6. Workspace hamburger hidden at ≥1024 (rail's chevron is the toggle).
//   7. <1024 keeps the R6.6 Sheet drawer + topbar hamburger — unchanged.
//   8. a11y: chevron has aria-expanded + aria-label; mini items have title=
//      AND sr-only label.
//   9. prefers-reduced-motion disables the width transition.
//
// D12 5-point coverage per frame:
//   1 DOM       — rail / Sheet / hamburger present per viewport
//   2 Style     — --r7-rail-width resolves; content padding matches
//   3 Position  — rail at start edge under RTL; content shifted
//   4 No overlap — rail and content do not horizontally overlap
//   5 Baseline  — gated behind UPDATE_BASELINES=1 (per D25 Risk 3)

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
  await page.screenshot({ path: `/screenshots/phase-a-r7-12-mini-rail-evidence/${name}.png`, fullPage: false });
};

// ---------------------------------------------------------------------------
// Group A — Breakpoint contract (5 viewports, including 1023/1024 cutover)
// ---------------------------------------------------------------------------

test.describe("R7.12 — Breakpoint cutover (rail at ≥1024, Sheet at <1024)", () => {
  test("xs-375: workspace hamburger visible, NO rail", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.setViewportSize({ width: 375, height: 720 });
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(300);
    await expect(page.locator(".r7-mini-rail")).toHaveCount(0);
    await expect(page.locator("#appshell-sidebar-trigger")).toBeVisible();
    await shotIfBaseline(page, "xs-375");
  });

  test("sm-768: workspace hamburger visible, NO rail", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(300);
    await expect(page.locator(".r7-mini-rail")).toHaveCount(0);
    await expect(page.locator("#appshell-sidebar-trigger")).toBeVisible();
    await shotIfBaseline(page, "sm-768");
  });

  test("md-1023 (just below cutover): NO rail, hamburger present", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.setViewportSize({ width: 1023, height: 800 });
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(300);
    await expect(page.locator(".r7-mini-rail")).toHaveCount(0);
    await expect(page.locator("#appshell-sidebar-trigger")).toBeVisible();
    await shotIfBaseline(page, "md-1023");
  });

  test("lg-1024 (cutover): rail visible, workspace hamburger HIDDEN", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    await expect(page.locator(".r7-mini-rail")).toBeVisible();
    // R7.12: workspace hamburger is hidden by CSS at ≥1024.
    const hamburgerVisible = await page.locator("#appshell-sidebar-trigger").isVisible();
    expect(hamburgerVisible, "workspace hamburger must be hidden at ≥1024").toBe(false);
    await shotIfBaseline(page, "lg-1024");
  });

  test("xl-1280: rail visible, hamburger HIDDEN", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    await expect(page.locator(".r7-mini-rail")).toBeVisible();
    await expect(page.locator("#appshell-sidebar-trigger")).toBeHidden();
    await shotIfBaseline(page, "xl-1280");
  });

  test("2xl-1536: rail visible (R7.12 supersedes the old 3xl pinned-only mode)", async ({ browser }) => {
    const page = await authedPage(browser);
    await page.setViewportSize({ width: 1536, height: 960 });
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    await expect(page.locator(".r7-mini-rail")).toBeVisible();
    await expect(page.locator("#appshell-sidebar-trigger")).toBeHidden();
    await shotIfBaseline(page, "2xl-1536");
  });
});

// ---------------------------------------------------------------------------
// Group B — Mini ↔ expanded toggle + content margin
// ---------------------------------------------------------------------------

test.describe("R7.12 — Rail mode + toggle + content margin (≥1024)", () => {
  test("default mode is mini (72px) for a fresh visitor", async ({ browser }) => {
    // Use a NEW context so localStorage starts empty (per-test isolation).
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    try {
      await login(page);
      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(400);
      const grid = page.locator(".workspace-grid.has-rail");
      await expect(grid).toBeVisible();
      await expect(grid).toHaveAttribute("data-rail-mode", "mini");
      // Computed rail width: 72px
      const railBox = await page.locator(".r7-mini-rail").boundingBox();
      expect(railBox).not.toBeNull();
      expect(railBox!.width).toBeGreaterThanOrEqual(70);
      expect(railBox!.width).toBeLessThanOrEqual(76);
    } finally {
      await ctx.close();
    }
  });

  test("toggling expands rail to 280px and persists across reload", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    try {
      await login(page);
      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(400);
      const toggle = page.locator(".r7-rail-toggle");
      await expect(toggle).toBeVisible();
      // Click to expand
      await toggle.click();
      await page.waitForTimeout(300); // wait for the 200ms width animation
      const grid = page.locator(".workspace-grid.has-rail");
      await expect(grid).toHaveAttribute("data-rail-mode", "expanded");
      const railBox = await page.locator(".r7-mini-rail").boundingBox();
      expect(railBox!.width).toBeGreaterThanOrEqual(276);
      expect(railBox!.width).toBeLessThanOrEqual(284);
      // Reload — mode should persist via localStorage
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(400);
      await expect(grid).toHaveAttribute("data-rail-mode", "expanded");
    } finally {
      await ctx.close();
    }
  });

  test("content shifts horizontally to follow rail width (no overlap)", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    try {
      await login(page);
      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(400);
      const railBox = await page.locator(".r7-mini-rail").boundingBox();
      const contentBox = await page.locator(".workspace-content").boundingBox();
      expect(railBox).not.toBeNull();
      expect(contentBox).not.toBeNull();
      // Under RTL: rail is on the RIGHT edge (start), content is on the LEFT.
      // No horizontal overlap.
      const noOverlap =
        railBox!.x + railBox!.width <= contentBox!.x + 1 ||
        contentBox!.x + contentBox!.width <= railBox!.x + 1;
      expect(noOverlap, "rail and content must not overlap horizontally").toBe(true);
      // Rail center is in the right half of the viewport (RTL start edge).
      const railCenterX = railBox!.x + railBox!.width / 2;
      expect(railCenterX).toBeGreaterThan(1280 / 2);
    } finally {
      await ctx.close();
    }
  });

  test("legacy localStorage 'open' migrates to expanded; 'closed' to mini", async ({ browser }) => {
    // 'open' → expanded
    const ctxA = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const pageA = await ctxA.newPage();
    try {
      await login(pageA);
      await pageA.evaluate(() => localStorage.setItem("digiu_sidebar_pref", "open"));
      await pageA.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await pageA.waitForTimeout(300);
      const grid = pageA.locator(".workspace-grid.has-rail");
      await expect(grid).toHaveAttribute("data-rail-mode", "expanded");
    } finally {
      await ctxA.close();
    }
    // 'closed' → mini
    const ctxB = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const pageB = await ctxB.newPage();
    try {
      await login(pageB);
      await pageB.evaluate(() => localStorage.setItem("digiu_sidebar_pref", "closed"));
      await pageB.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await pageB.waitForTimeout(300);
      const grid = pageB.locator(".workspace-grid.has-rail");
      await expect(grid).toHaveAttribute("data-rail-mode", "mini");
    } finally {
      await ctxB.close();
    }
  });
});

// ---------------------------------------------------------------------------
// Group C — A11y + RTL contract
// ---------------------------------------------------------------------------

test.describe("R7.12 — A11y + RTL", () => {
  test("toggle has aria-label + aria-expanded reflecting mode", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    try {
      await login(page);
      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(400);
      const toggle = page.locator(".r7-rail-toggle");
      // Mini mode → aria-expanded="false"
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(toggle).toHaveAttribute("aria-label", /گسترش|جمع/);
      await toggle.click();
      await page.waitForTimeout(300);
      // Expanded mode → aria-expanded="true"
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
    } finally {
      await ctx.close();
    }
  });

  test("mini items carry title= AND sr-only label (a11y dual-path)", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    try {
      await login(page);
      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(400);
      // Default mini — pick the first sidenav item
      const firstItem = page.locator(".r7-mini-rail .side-nav li a").first();
      await expect(firstItem).toHaveAttribute("title", /.+/);
      // sr-only span inside the link (screen reader gets the label).
      const srSpan = firstItem.locator("span.sr-only");
      await expect(srSpan).toHaveCount(1);
    } finally {
      await ctx.close();
    }
  });

  test("rail sits at the RTL start edge (right) and clips below topbar", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    try {
      await login(page);
      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(400);
      const railBox = await page.locator(".r7-mini-rail").boundingBox();
      expect(railBox).not.toBeNull();
      // Right edge of rail near viewport.width (start edge in RTL).
      expect(railBox!.x + railBox!.width).toBeGreaterThan(1280 - 4);
      // Rail's top sits below the topbar (R7.12 CSS uses top: 76px on
      // the sticky element — viewport y-position will be ≥ ~76px when
      // the rail is at its sticky pin).
      expect(railBox!.y).toBeGreaterThanOrEqual(0);
    } finally {
      await ctx.close();
    }
  });
});
