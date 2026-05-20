import { test, expect } from "@playwright/test";

test("AI FAB opens panel and accepts message", async ({ page }) => {
  await page.goto("/#home");
  await page.locator(".ai-fab").click();
  await expect(page.locator(".ai-panel")).toBeVisible();
  await page.locator(".ai-panel input").fill("کلاس بعدی من کیه؟");
  await page.locator(".ai-panel button[type='submit']").click();
  await page.waitForTimeout(800);
  await expect(page.locator(".ai-msg")).toHaveCount(3);
});

test("Theme toggle switches data-theme", async ({ page }) => {
  await page.goto("/#home");
  const before = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.locator('button[aria-label*="تم"]').first().click();
  await page.waitForTimeout(200);
  const after = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(after).not.toBe(before);
});

test("Command palette opens on Ctrl+K and navigates", async ({ page }) => {
  await page.goto("/#home");
  await page.keyboard.press("Control+K");
  await expect(page.locator(".cmdk-panel")).toBeVisible();
  await page.locator(".cmdk-input-wrap input").fill("کلاس");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
  expect(page.url()).toMatch(/classroom|course/);
});

test("Classroom shows lobby then transitions to live", async ({ page }) => {
  await page.goto("/#classroom");
  await expect(page.locator(".lobby-card")).toBeVisible();
  await page.locator("button:has-text('ورود به کلاس')").click();
  await expect(page.locator(".stage-screen")).toBeVisible();
});
