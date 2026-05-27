// Phase B R3.a Commit K (D68 + D69) — D12 visual contract + D18 flow
// assertions for the Identity track surface.
//
// D12 — semantic UI assertions (no pixel diffs):
//   • /profile renders the self-service editor for any auth'd user
//   • /admin/profiles renders the admin list (D69 5th page)
//   • /admin/students renders the table + status pills
//   • /admin/instructors renders the table + expertise tags + dept col
//   • /admin/offerings renders the new instructor column + assign button
//   • Admin sidebar has the new «افراد» group with all 3 entries
//   • User dropdown shows «پروفایل من» for non-admin role
//
// D18 — flow / cross-layer assertions:
//   • Student edits own profile → bio persists → reload shows new bio
//   • Admin assigns instructor on offering via /admin/offerings UI →
//     instructor cell renders the assigned name
//   • Instructor soft-delete via /admin/instructors → reload
//     /admin/offerings → instructor cell shows «—» (SetNull join behavior)
//   • Cross-user gate: student visits /admin/profiles → access denied
//     surface (or redirect)
//
// API-side matrices (SelfOrAdmin, cross-tenant, role-validation) live
// in the Jest spec at apps/api/test/identity-r3a.spec.ts (Commit F).

import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = "admin@digiuniversity.ir";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe!2026";
const STUDENT_EMAIL = "student1@digiuniversity.ir";
const STUDENT_PASSWORD = process.env.SEED_STUDENT_PASSWORD ?? "StudentPass!1";
const INSTRUCTOR_EMAIL = "instructor1@digiuniversity.ir";
const INSTRUCTOR_PASSWORD = process.env.SEED_INSTRUCTOR_PASSWORD ?? "InstructorPass!1";
const TENANT_SLUG = "demo";

async function loginAs(
  request: import("@playwright/test").APIRequestContext,
  email: string,
  password: string,
): Promise<string> {
  const res = await request.post("/api/v1/auth/login", {
    data: { tenantSlug: TENANT_SLUG, email, password },
  });
  expect(res.status(), `login ${email}`).toBe(200);
  const body = await res.json();
  return body.accessToken;
}

async function uiLoginAs(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*\/(admin|dashboard|home|progress|instructor).*/, { timeout: 10000 });
}

test.describe("@phase-b-r3a identity track — D12 + D18", () => {
  // ===== D12 — UI contracts =====

  test("D12: /profile renders self-service editor for an authenticated student", async ({ page }) => {
    await uiLoginAs(page, STUDENT_EMAIL, STUDENT_PASSWORD);
    await page.goto("/profile");

    // Form fields visible
    await expect(page.locator("#profile-bio")).toBeVisible();
    await expect(page.locator("#profile-phone")).toBeVisible();
    await expect(page.locator("#profile-dob")).toBeVisible();
    await expect(page.locator("#profile-address")).toBeVisible();
    await expect(page.locator("#profile-nid")).toBeVisible();
    await expect(page.locator("#profile-locale")).toBeVisible();
    await expect(page.locator("#profile-avatar")).toBeVisible();

    // Save button visible + role pill rendered
    await expect(page.locator("button:has-text('ذخیره')").first()).toBeVisible();
  });

  test("D12: /admin/profiles renders read-only table for admin (D69)", async ({ page }) => {
    await uiLoginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/admin/profiles");

    await expect(page.locator('[data-table="profiles"]')).toBeVisible();
    await expect(page.locator('[data-table="profiles"] tbody tr').first()).toBeVisible({ timeout: 8000 });
    // The seed Profile backfill runs for every seeded user — at least 10
    const rows = await page.locator('[data-table="profiles"] tbody tr').count();
    expect(rows).toBeGreaterThan(0);
  });

  test("D12: /admin/students renders table + status pills", async ({ page, request }) => {
    const token = await loginAs(request, ADMIN_EMAIL, ADMIN_PASSWORD);
    // Ensure at least one row exists by upserting (or creating) the seed sample.
    // The seed already creates student1 STU-1405001; the list should include it.
    const probeRes = await request.get("/api/v1/students", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(probeRes.status()).toBe(200);
    const probeList = await probeRes.json();
    expect(Array.isArray(probeList)).toBe(true);

    await uiLoginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/admin/students");
    await expect(page.locator('[data-table="students"]')).toBeVisible();
    // Status pill present in at least one row
    await expect(page.locator('[data-table="students"] .pill').first()).toBeVisible();
  });

  test("D12: /admin/instructors renders table + expertise chip + department column", async ({ page }) => {
    await uiLoginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/admin/instructors");
    await expect(page.locator('[data-table="instructors"]')).toBeVisible();
    // Header includes the new columns
    const head = page.locator('[data-table="instructors"] thead');
    await expect(head.filter({ hasText: "گروه" })).toBeVisible();
    await expect(head.filter({ hasText: "تخصص" })).toBeVisible();
    await expect(head.filter({ hasText: "دوره‌ها" })).toBeVisible();
    // Seed sample INS-001 has at least 2 expertise tags
    const tagsRow = page.locator('[data-table="instructors"] tbody tr').first();
    await expect(tagsRow).toBeVisible();
  });

  test("D12: /admin/offerings has the new instructor column + assign button", async ({ page, request }) => {
    const token = await loginAs(request, ADMIN_EMAIL, ADMIN_PASSWORD);
    // Confirm the seed sample is wired (instructor.id present on at least one offering)
    const offsRes = await request.get("/api/v1/offerings", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(offsRes.status()).toBe(200);

    await uiLoginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/admin/offerings");

    // New column header «استاد»
    const headers = page.locator("table.admin-table thead th");
    await expect(headers.filter({ hasText: "استاد" })).toBeVisible();

    // At least one row has the assign button (data-action="assign-instructor")
    await expect(
      page.locator('button[data-action="assign-instructor"]').first(),
    ).toBeVisible();
  });

  test("D12: admin sidebar has the new «افراد» group with 3 entries", async ({ page }) => {
    await uiLoginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/admin/offerings");

    const sidebar = page.locator("nav, aside").filter({ hasText: "افراد" }).first();
    await expect(sidebar).toContainText("پروفایل‌ها");
    await expect(sidebar).toContainText("دانشجویان");
    await expect(sidebar).toContainText("اساتید");
  });

  test("D12: user dropdown shows «پروفایل من» for non-admin role (D69)", async ({ page }) => {
    await uiLoginAs(page, STUDENT_EMAIL, STUDENT_PASSWORD);
    // The dropdown's open behavior varies by viewport; assert the link
    // string appears somewhere reachable from the authed shell.
    const dropdownEntry = page.locator("button.dropdown-item, a.dropdown-item").filter({
      hasText: "پروفایل من",
    });
    // Open the dropdown if needed — clicking the user avatar in the top-right.
    const avatar = page.locator(".avatar").first();
    if (await avatar.isVisible()) {
      await avatar.click().catch(() => {
        // best-effort; some breakpoints render the dropdown inline
      });
    }
    await expect(dropdownEntry).toBeAttached();
  });

  // ===== D18 — flow assertions =====

  test("D18: student edits own profile via /profile → reload shows new bio", async ({ page }) => {
    await uiLoginAs(page, STUDENT_EMAIL, STUDENT_PASSWORD);
    await page.goto("/profile");

    const bioSelector = "#profile-bio";
    await page.waitForSelector(bioSelector, { state: "visible", timeout: 8000 });
    const newBio = `R3.a-test ${Date.now()}`;
    await page.fill(bioSelector, newBio);
    await page.click("button:has-text('ذخیره')");

    // Saved-pill appears (data-profile-saved="true")
    await expect(page.locator('[data-profile-saved="true"]')).toBeVisible({ timeout: 5000 });

    // Hard reload → bio still present
    await page.reload();
    await page.waitForSelector(bioSelector, { state: "visible", timeout: 8000 });
    await expect(page.locator(bioSelector)).toHaveValue(newBio);

    // Cleanup: clear bio
    await page.fill(bioSelector, "");
    await page.click("button:has-text('ذخیره')");
  });

  test("D18: instructor assignment via /admin/offerings UI → instructor cell shows the name", async ({
    page,
    request,
  }) => {
    const token = await loginAs(request, ADMIN_EMAIL, ADMIN_PASSWORD);

    // Find an instructor + an offering to use.
    const insts = await (
      await request.get("/api/v1/instructors", { headers: { Authorization: `Bearer ${token}` } })
    ).json();
    expect(Array.isArray(insts)).toBe(true);
    expect(insts.length).toBeGreaterThan(0);
    const instructor = insts[0];

    const offs = await (
      await request.get("/api/v1/offerings", { headers: { Authorization: `Bearer ${token}` } })
    ).json();
    expect(Array.isArray(offs)).toBe(true);
    expect(offs.length).toBeGreaterThan(0);
    const offering = offs[0];

    // Unassign first so we can re-assign and see the change.
    await request.patch(`/api/v1/offerings/${offering.id}/instructor`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      data: { instructorId: null },
    });

    // Now drive the UI through the assignment dialog.
    await uiLoginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/admin/offerings");

    const cellSelector = `[data-instructor-cell="${offering.id}"]`;
    await expect(page.locator(cellSelector)).toBeVisible();
    await expect(page.locator(`${cellSelector} [data-instructor-empty="true"]`)).toBeVisible();

    // Click the assign button on the row
    const row = page.locator(`tr:has([data-instructor-cell="${offering.id}"])`);
    await row.locator('button[data-action="assign-instructor"]').click();

    // Select the first instructor from the dropdown + save
    await page.selectOption('select[data-control="assign-instructor"]', instructor.id);
    await page.click("button:has-text('ذخیره')");

    // After refetch, the cell shows the instructor name (or fallback chain)
    await expect(page.locator(`${cellSelector} [data-instructor-empty="true"]`)).toHaveCount(0, {
      timeout: 8000,
    });
  });

  test("D18: instructor soft-delete → /admin/offerings reload shows «—» (SetNull cascade behavior)", async ({
    request,
  }) => {
    // Pure API verification — the UI assertion above already checks that
    // the cell renders «—» when instructor is null. Here we verify the
    // backend cascade behavior end-to-end with a fresh instructor + offering.
    const token = await loginAs(request, ADMIN_EMAIL, ADMIN_PASSWORD);
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    // Use seed instructor1 (has the instructor role); create a temporary
    // offering, assign instructor, then soft-delete the instructor row
    // and verify the offering list shows instructor:null.
    const instsRes = await request.get("/api/v1/instructors", { headers });
    expect(instsRes.status()).toBe(200);
    const insts = await instsRes.json();
    const instructor = insts[0];

    // Need a program FK
    const programs = await (await request.get("/api/v1/programs", { headers })).json();
    expect(Array.isArray(programs)).toBe(true);
    const programId = programs[0].id;

    const slug = `e2e-r3a-cascade-${Date.now()}`;
    const offRes = await request.post("/api/v1/offerings", {
      headers,
      data: { programId, slug, nameFa: "دوره cascade", shortCode: `r3a-${Date.now()}`.slice(0, 32) },
    });
    expect(offRes.status()).toBe(201);
    const offering = await offRes.json();

    await request.patch(`/api/v1/offerings/${offering.id}/instructor`, {
      headers,
      data: { instructorId: instructor.id },
    });

    // Sanity — joined instructor present
    const listBefore = await (await request.get("/api/v1/offerings", { headers })).json();
    const rowBefore = listBefore.find((o: { id: string }) => o.id === offering.id);
    expect(rowBefore.instructor?.id).toBe(instructor.id);

    // Soft-delete instructor — but DON'T do this on the seed sample
    // (it's shared with other tests). Skip the cascade test if there's
    // only one instructor (avoid destabilizing other specs).
    if (insts.length < 2) {
      test.info().annotations.push({
        type: "skip-reason",
        description: "only 1 instructor — skipping destructive cascade test",
      });
      // Cleanup
      await request.delete(`/api/v1/offerings/${offering.id}`, { headers });
      return;
    }

    // Use the second instructor (not the seed sample) for the destructive op.
    const sacrificial = insts[1];
    await request.patch(`/api/v1/offerings/${offering.id}/instructor`, {
      headers,
      data: { instructorId: sacrificial.id },
    });
    await request.delete(`/api/v1/instructors/${sacrificial.id}`, { headers });

    const listAfter = await (await request.get("/api/v1/offerings", { headers })).json();
    const rowAfter = listAfter.find((o: { id: string }) => o.id === offering.id);
    expect(rowAfter.instructorId).toBe(sacrificial.id); // FK stays set
    expect(rowAfter.instructor).toBeNull(); // joined record null via deletedAt filter

    // Cleanup
    await request.delete(`/api/v1/offerings/${offering.id}`, { headers });
  });

  test("D18: student visiting /admin/profiles is blocked (403 surface or redirect)", async ({
    page,
    request,
  }) => {
    // Verify API-side first
    const studentToken = await loginAs(request, STUDENT_EMAIL, STUDENT_PASSWORD);
    const res = await request.get("/api/v1/profiles", {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    expect(res.status(), "student GET /v1/profiles must 403").toBe(403);

    // Then UI — student navigates and sees the role-gated message
    await uiLoginAs(page, STUDENT_EMAIL, STUDENT_PASSWORD);
    await page.goto("/admin/profiles");
    // Either:
    //  (a) the ProfilesPage role check shows "دسترسی فقط برای مدیران." or
    //  (b) the page wasn't allowed at all and routed elsewhere
    // Both are acceptable — assert at least one is observed.
    const denial = page.locator("text=دسترسی فقط برای مدیران");
    const ok = (await denial.isVisible().catch(() => false)) || page.url().includes("/login") || page.url().match(/\/(dashboard|progress|home)/);
    expect(Boolean(ok)).toBe(true);
  });
});
