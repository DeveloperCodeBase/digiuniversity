// Phase-16 R3 — Storybook snapshot evidence.
//
// Loads the static Storybook build (served by python3 http.server,
// see playwright.storybook.config.js) and captures one screenshot per
// (primitive × viewport). Output goes to docs/gate-2-evidence/r3-storybook/
// via the docker bind-mount ./docs → /screenshots.
//
// Story IDs follow Storybook's "title-as-kebab--name-as-kebab" rule.
// Stories defined under `title: "UI/Button"` with export name `Primary`
// → ID `ui-button--primary` and URL `/iframe.html?id=ui-button--primary`.
// We use the iframe URL (not the manager UI) so the screenshot is the
// pure component without Storybook's chrome.
import { test } from "@playwright/test";

const OUT = "/screenshots/gate-2-evidence/r3-storybook";

interface Story {
  /** Storybook story ID (lowercase, kebab, "--" between title and story). */
  id: string;
  /** PNG filename stem (no extension). */
  name: string;
  /** Some interactive stories need a click to "open" the overlay. */
  openSelector?: string;
}

// One representative story per primitive — keep the matrix small so
// review stays scannable. Adding more variants here is cheap; the
// spec scales linearly.
const STORIES: Story[] = [
  { id: "ui-button--all-variants", name: "01-button-all-variants" },
  { id: "ui-button--loading", name: "02-button-loading" },
  { id: "ui-card--default", name: "03-card-default" },
  { id: "ui-card--bordered", name: "04-card-bordered" },
  { id: "ui-input--default", name: "05-input-default" },
  { id: "ui-input--invalid", name: "06-input-invalid" },
  { id: "ui-label--required", name: "07-label-required" },
  { id: "ui-textarea--default", name: "08-textarea-default" },
  // Overlay primitives — needs to be opened via the trigger button.
  {
    id: "ui-dialog--default",
    name: "09-dialog-default",
    openSelector: 'button:has-text("باز کردن دیالوگ")',
  },
  {
    id: "ui-sheet--bottom-sheet",
    name: "10-sheet-bottom",
    openSelector: 'button:has-text("باز کردن از پایین")',
  },
  { id: "ui-tabs--default", name: "11-tabs-default" },
  {
    id: "ui-dropdown-menu--default",
    name: "12-dropdown-default",
    openSelector: 'button:has-text("اقدامات درس")',
  },
  { id: "ui-badge--all-variants", name: "13-badge-all-variants" },
  { id: "ui-avatar--sizes", name: "14-avatar-sizes" },
  { id: "ui-separator--horizontal", name: "15-separator-horizontal" },
  { id: "ui-skeleton--card-skeleton", name: "16-skeleton-card" },
  { id: "ui-empty-state--default", name: "17-empty-state-default" },
  { id: "ui-error-state--default", name: "18-error-state-default" },
];

const VIEWPORTS = [
  { name: "mobile-320", width: 320, height: 568 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1280", width: 1280, height: 800 },
];

for (const story of STORIES) {
  for (const vp of VIEWPORTS) {
    test(`${story.name} @ ${vp.name}`, async ({ browser }) => {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await ctx.newPage();
      const url = `/iframe.html?id=${story.id}&viewMode=story`;
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForTimeout(400);
      if (story.openSelector) {
        await page.locator(story.openSelector).first().click();
        // Let the open animation settle before snapping the overlay.
        await page.waitForTimeout(400);
      }
      await page.screenshot({
        path: `${OUT}/${story.name}--${vp.name}.png`,
        fullPage: false,
      });
      await ctx.close();
    });
  }
}
