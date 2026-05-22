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

test.describe("R1.3 — B5 landing privacy leak", () => {
  test("authed student visiting / redirects to /dashboard without name leak", async ({ browser }) => {
    const page = await authedPage(browser);
    // Sample the page content several times in the redirect window;
    // if the student's name appears in ANY sample, that's the leak we
    // claim is fixed. The needles list covers first name, last name,
    // and the demo email.
    let leakFound: string | null = null;
    await page.goto("/", { waitUntil: "domcontentloaded" });
    for (let i = 0; i < 8; i++) {
      const html = await page.content();
      for (const needle of STUDENT.leakNeedles) {
        if (html.includes(needle)) {
          leakFound = needle;
          break;
        }
      }
      if (leakFound) break;
      // The redirect should land within a few hundred ms; sample
      // every 75ms × 8 = 600ms total to cover the gap.
      await page.waitForTimeout(75);
    }
    // After the redirect lands, URL must be /dashboard (no /home).
    await page.waitForURL((u) => u.pathname.startsWith("/dashboard"), { timeout: 5000 });
    expect(leakFound, `leak detected: "${leakFound}" appeared on landing before redirect`).toBeNull();
    expect(page.url()).toMatch(/\/dashboard/);
  });
});
