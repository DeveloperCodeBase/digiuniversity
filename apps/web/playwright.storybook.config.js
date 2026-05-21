// Phase-16 R3 — Playwright config for capturing Storybook screenshots.
//
// Different from playwright.visual.config.js: that one targets the
// live SPA, this one targets a locally-served static Storybook build.
//
// Pre-step (handled by remote.ps1 visual -Service r3-storybook):
//   1. npm install
//   2. npm run build-storybook         → storybook-static/
//   3. python3 -m http.server 6006 --directory storybook-static (webServer block below)
//   4. npx playwright test --config playwright.storybook.config.js
//
// Output: 48 PNGs (16 primitives × 3 viewports) → docs/gate-2-evidence/r3-storybook/
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/visual",
  testMatch: ["r3-storybook.spec.ts"],
  fullyParallel: false,
  reporter: [["list"]],
  timeout: 120_000,
  workers: 1,
  // Spawned by the webServer block. Python is shipped with the
  // mcr.microsoft.com/playwright:v1.49.1-noble image so we don't need
  // to add another binary.
  webServer: {
    command: "python3 -m http.server 6006 --directory ./storybook-static",
    port: 6006,
    reuseExistingServer: true,
    timeout: 20_000,
  },
  use: {
    baseURL: "http://localhost:6006",
    trace: "off",
    video: "off",
    screenshot: "off",
    ignoreHTTPSErrors: true,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
