// Phase-16 — visual-evidence Playwright config.
//
// Runs inside the `web-visual` docker compose service against the live
// nginx container (digiuniversity-app) on the digiuniversity_web bridge.
// Output PNGs land under `/screenshots/<gate>/` which is bind-mounted to
// `docs/<gate>-evidence/` on the host so a follow-up `git add` picks
// them up.
//
// Local Windows use is blocked because the host can't download the
// Playwright Chromium binaries (network policy). Use:
//     .\scripts\remote.ps1 visual -Service gate-1
// which builds + runs this config on the VPS, then scp's the screenshots
// back to apps/web/docs/<gate>-evidence/ for commit.
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: false, // deterministic screenshot ordering
  reporter: [["list"]],
  timeout: 90_000,
  workers: 1,
  // No webServer — the nginx container is already up before we run.
  use: {
    // Inside the docker network the SPA container is just `app`.
    // Override via env if you want to point at staging / prod.
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://app",
    trace: "off",
    video: "off",
    screenshot: "off", // each test takes its own screenshot deliberately
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
