// Phase B R6 (D80–D82) — D18 flow assertions for the public applicant
// self-service journey (anon, no login). Runs against the deployed site
// (playwright.visual.config.js baseURL) as a post-deploy smoke.
//
// D18 — the multi-step journey (not just "a page renders"):
//   visit /apply (anon) → program picker populated (public catalog, D82)
//   → submit → confirmation shows reference (APP-XXXXXX) + /track?token=
//   link → open /track → status SUBMITTED + stepper + withdraw enabled →
//   withdraw → status WITHDRAWN + withdraw gone (D70 explicit withdraw)
//   → forged token → error (no leak).
//
// API-side coverage (token mint, PII-mask, forged 404, terminal 400,
// idempotency) lives in the Jest spec apps/api/test/applications-r6-tracking.spec.ts.

import { expect, test } from "@playwright/test";

// Unique per run so the (tenant, email, program) idempotency key never
// collides with a prior run, and we never touch real applicant data.
const RUN = Date.now();

test.describe("@phase-b-r6 applicant self-service journey — D18", () => {
  test("anon apply → confirmation → track → withdraw", async ({ page }) => {
    // ---- 1. /apply renders anon (no login redirect) ----
    await page.goto("/apply");
    await expect(page).toHaveURL(/\/apply/);
    const programSelect = page.locator("select#programId");
    await expect(programSelect).toBeVisible({ timeout: 10000 });

    const optionCount = await programSelect.locator("option").count();
    if (optionCount <= 1) {
      test.skip(true, "no public programs available — run remote.ps1 seed on the target");
    }

    // ---- 2. Fill + submit (student variant) ----
    const email = `e2e-r6-${RUN}@example.test`;
    await programSelect.selectOption({ index: 1 });
    await page.fill("input#fullName", "E2E R6 Applicant");
    await page.fill("input#email", email);
    await page.click('button[type="submit"]');

    // ---- 3. Confirmation: reference + /track link with a token ----
    const trackLink = page.locator("#track-link");
    await expect(trackLink).toBeVisible({ timeout: 12000 });
    await expect(page.locator("[data-apply-reference], .h-display")).toBeVisible();

    const trackUrl = await trackLink.inputValue();
    expect(trackUrl).toContain("/track?token=");
    expect(trackUrl).toContain("type=student");
    // The reference (APP-XXXXXX) is shown on the confirmation.
    await expect(page.locator("body")).toContainText(/APP-[A-Z0-9]{6}/);

    // ---- 4. /track → SUBMITTED + stepper + withdraw enabled ----
    await page.goto(trackUrl);
    const loaded = page.locator('[data-track-state="loaded"]');
    await expect(loaded).toBeVisible({ timeout: 12000 });
    await expect(loaded).toHaveAttribute("data-track-status", "SUBMITTED");
    await expect(page.locator("[data-track-stepper]")).toBeVisible();
    await expect(page.locator("[data-track-stepper] [data-step='SUBMITTED']")).toHaveAttribute(
      "data-step-state",
      "current",
    );

    // Security: the masked email is shown, never the raw submitted address.
    const bodyText = await page.locator("[data-track-state='loaded']").innerText();
    expect(bodyText).not.toContain(email);
    expect(bodyText).toContain("***");

    const withdrawBtn = page.locator("[data-track-withdraw]");
    await expect(withdrawBtn).toBeVisible();

    // ---- 5. Withdraw (D70 explicit destructive op) → WITHDRAWN ----
    await withdrawBtn.click();
    await page.locator("[data-track-withdraw-confirm]").click();
    await expect(page.locator('[data-track-state="loaded"]')).toHaveAttribute(
      "data-track-status",
      "WITHDRAWN",
      { timeout: 10000 },
    );
    await expect(page.locator("[data-track-terminal='WITHDRAWN']")).toBeVisible();
    await expect(page.locator("[data-track-withdraw]")).toHaveCount(0);
  });

  test("forged token → error state, no data leak", async ({ page }) => {
    await page.goto(`/track?token=${"deadbeef".repeat(4)}&type=student`);
    await expect(page.locator('[data-track-state="error"]')).toBeVisible({ timeout: 12000 });
    // No applicant data rendered for a bad token.
    await expect(page.locator("[data-track-state='loaded']")).toHaveCount(0);
  });

  test("idempotent re-submit returns the same reference", async ({ page }) => {
    const email = `e2e-r6-idem-${RUN}@example.test`;

    const submitOnce = async (): Promise<string> => {
      await page.goto("/apply");
      const sel = page.locator("select#programId");
      await expect(sel).toBeVisible({ timeout: 10000 });
      if ((await sel.locator("option").count()) <= 1) {
        test.skip(true, "no public programs available — run remote.ps1 seed");
      }
      await sel.selectOption({ index: 1 });
      await page.fill("input#fullName", "E2E R6 Idem");
      await page.fill("input#email", email);
      await page.click('button[type="submit"]');
      await expect(page.locator("#track-link")).toBeVisible({ timeout: 12000 });
      const m = (await page.locator("body").innerText()).match(/APP-[A-Z0-9]{6}/);
      return m ? m[0] : "";
    };

    const ref1 = await submitOnce();
    const ref2 = await submitOnce();
    expect(ref1).not.toBe("");
    expect(ref2).toBe(ref1); // same (tenant,email,program) → same row → same reference
  });
});
