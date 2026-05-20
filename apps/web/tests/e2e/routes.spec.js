import { test, expect } from "@playwright/test";

const ROUTES = [
  "home", "schools", "labs", "virtuallab/ANAT", "dashboard", "course",
  "classroom", "library", "calendar", "community", "messages",
  "settings", "credential", "transcript", "registration",
  "instructor", "authoring", "search", "login",
];

for (const r of ROUTES) {
  test(`route renders without errors: ${r}`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`/#${r}`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main")).toBeVisible();
    expect(errors, `JS errors on /#${r}`).toEqual([]);
  });
}
