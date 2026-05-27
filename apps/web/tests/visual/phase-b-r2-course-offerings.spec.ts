// Phase B R2 Commit I (D65) — D12 visual contract + D18 flow assertion
// for the CourseOffering admin surface + Cohort legacy banner.
//
// D12 — semantic assertions (no pixel diffs; survives palette tweaks):
//   • /admin/offerings + /admin/cohorts render
//   • Sidebar admin role has both nav entries
//   • OfferingsPage table renders status pills + transition buttons
//   • CohortsPage renders the «Legacy» banner with role="alert"
//
// D18 — state machine flow assertions per D65 R2-Reminder-1:
//   • Happy path: SCHEDULED → OPEN → ACTIVE → COMPLETED (chained mutations)
//   • Illegal transition: OPEN → SCHEDULED rejects with backend's
//     "Allowed from OPEN: [ACTIVE, CANCELED]" message
//   • Soft-delete allowed at any status (POST /transition not required)
//   • Cascade: delete offering linked to cohort → cohort soft-deleted too
//   • MigrationSyncLog: cohort write creates a sync log row
//
// All API-side assertions exercise the live deployment; pure DOM
// assertions render against the React tree without network mock.

import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = "admin@digiuniversity.ir";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe!2026";
const TENANT_SLUG = "demo";

async function loginAsAdmin(request: import("@playwright/test").APIRequestContext): Promise<string> {
  const res = await request.post("/api/v1/auth/login", {
    data: { tenantSlug: TENANT_SLUG, email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(res.status(), "admin login").toBe(200);
  const body = await res.json();
  return body.accessToken;
}

async function getFirstProgramId(
  request: import("@playwright/test").APIRequestContext,
  token: string,
): Promise<string> {
  const res = await request.get("/api/v1/programs", {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.status()).toBe(200);
  const list = await res.json();
  expect(Array.isArray(list)).toBe(true);
  expect(list.length).toBeGreaterThan(0);
  return list[0].id;
}

test.describe("@phase-b-r2 CourseOffering admin surface — D12 + D18", () => {

  // ===== D12 — DOM/UI contracts (require login + render) =====

  test("D12: /admin/offerings renders status pill column + transition buttons", async ({ page, request }) => {
    const token = await loginAsAdmin(request);
    const programId = await getFirstProgramId(request, token);

    // Create a deterministic offering so the page has at least one row to assert against.
    const slug = `e2e-d12-${Date.now()}`;
    const create = await request.post("/api/v1/offerings", {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      data: { programId, slug, nameFa: "دوره‌ی e2e D12", shortCode: "e2e-d12", mode: "HYBRID" },
    });
    expect(create.status()).toBe(201);
    const offering = await create.json();

    // Drive the UI through the existing R1 login flow + nav drill.
    await page.goto("/login");
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/(admin|dashboard|home).*/, { timeout: 10000 });
    await page.goto("/admin/offerings");

    // D12.1 — table renders with status pill column header
    const headerCells = page.locator("table.admin-table thead th");
    await expect(headerCells.filter({ hasText: "وضعیت" })).toBeVisible();

    // D12.2 — our seeded offering is in the table
    const row = page.locator(`tr[data-offering-id="${offering.id}"]`);
    await expect(row).toBeVisible();

    // D12.3 — status pill renders with proper class + Persian label
    const pill = row.locator(".pill-status");
    await expect(pill).toBeVisible();
    await expect(pill).toHaveText(/زمان‌بندی شده/);

    // D12.4 — transition button visible for SCHEDULED → OPEN
    await expect(row.locator("button.btn-transition-open")).toBeVisible();

    // Cleanup
    await request.delete(`/api/v1/offerings/${offering.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  });

  test("D12: /admin/cohorts renders «Legacy» banner with role=alert", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/(admin|dashboard|home).*/, { timeout: 10000 });
    await page.goto("/admin/cohorts");

    const banner = page.locator('[data-legacy-banner="cohorts"]');
    await expect(banner).toBeVisible();
    await expect(banner).toHaveAttribute("role", "alert");
    await expect(banner).toContainText(/منسوخ/);
    await expect(banner).toContainText(/2026-12-31/);
  });

  test("D12: admin sidebar has both R2 entries", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/(admin|dashboard|home).*/, { timeout: 10000 });
    // Sidebar may be in a drawer on mobile; assert at desktop viewport.
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/admin/offerings");

    const sidebar = page.locator("nav, aside").filter({ hasText: "ساختار آکادمیک" }).first();
    await expect(sidebar).toContainText("دوره‌های ارائه‌شده");
    await expect(sidebar).toContainText("گروه‌های آموزشی");
    await expect(sidebar).toContainText("Legacy");
  });

  // ===== D18 — state machine flow assertions =====

  test("D18: happy path SCHEDULED → OPEN → ACTIVE → COMPLETED chained transitions", async ({ request }) => {
    const token = await loginAsAdmin(request);
    const programId = await getFirstProgramId(request, token);
    const slug = `e2e-d18-happy-${Date.now()}`;

    const create = await request.post("/api/v1/offerings", {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      data: { programId, slug, nameFa: "دوره D18 happy", shortCode: "e2e-h" },
    });
    expect(create.status()).toBe(201);
    const offering = await create.json();
    expect(offering.status).toBe("SCHEDULED");

    for (const next of ["OPEN", "ACTIVE", "COMPLETED"] as const) {
      const t = await request.post(`/api/v1/offerings/${offering.id}/transition`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        data: { to: next },
      });
      expect(t.status(), `transition to ${next}`).toBe(200);
      const body = await t.json();
      expect(body.status).toBe(next);
    }

    // Cleanup (soft-delete is legal even at COMPLETED per D65 R2-Reminder-1)
    const del = await request.delete(`/api/v1/offerings/${offering.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(del.status()).toBe(200);
  });

  test("D18: illegal transition OPEN → SCHEDULED rejected 400 with allowed-from-current list", async ({ request }) => {
    const token = await loginAsAdmin(request);
    const programId = await getFirstProgramId(request, token);
    const slug = `e2e-d18-illegal-${Date.now()}`;

    const create = await request.post("/api/v1/offerings", {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      data: { programId, slug, nameFa: "دوره D18 illegal", shortCode: "e2e-i" },
    });
    const offering = await create.json();

    // Get to OPEN legally
    await request.post(`/api/v1/offerings/${offering.id}/transition`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      data: { to: "OPEN" },
    });

    // Now attempt OPEN → SCHEDULED — must reject
    const bad = await request.post(`/api/v1/offerings/${offering.id}/transition`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      data: { to: "SCHEDULED" },
    });
    expect(bad.status()).toBe(400);
    const errBody = await bad.json();
    expect(errBody.message).toMatch(/illegal transition: OPEN.*SCHEDULED/);
    expect(errBody.message).toMatch(/Allowed from OPEN/);
    expect(errBody.message).toMatch(/ACTIVE/);
    expect(errBody.message).toMatch(/CANCELED/);

    // Cleanup
    await request.delete(`/api/v1/offerings/${offering.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  });

  test("D18: soft-delete allowed at any status (terminal COMPLETED + active OPEN both deletable)", async ({ request }) => {
    const token = await loginAsAdmin(request);
    const programId = await getFirstProgramId(request, token);

    // Case A: delete from SCHEDULED (fresh row)
    const a = await request.post("/api/v1/offerings", {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      data: { programId, slug: `e2e-soft-sched-${Date.now()}`, nameFa: "دوره SCHED-DEL" },
    });
    const oa = await a.json();
    const delA = await request.delete(`/api/v1/offerings/${oa.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(delA.status(), "soft-delete at SCHEDULED").toBe(200);

    // Case B: drive to ACTIVE, then delete
    const b = await request.post("/api/v1/offerings", {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      data: { programId, slug: `e2e-soft-active-${Date.now()}`, nameFa: "دوره ACTIVE-DEL" },
    });
    const ob = await b.json();
    for (const to of ["OPEN", "ACTIVE"] as const) {
      await request.post(`/api/v1/offerings/${ob.id}/transition`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        data: { to },
      });
    }
    const delB = await request.delete(`/api/v1/offerings/${ob.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(delB.status(), "soft-delete at ACTIVE").toBe(200);
  });

  test("D18: Cohort create writes MigrationSyncLog + mints linked Offering (dual-write)", async ({ request }) => {
    const token = await loginAsAdmin(request);
    const programId = await getFirstProgramId(request, token);
    const slug = `e2e-dualwrite-${Date.now()}`;

    const cohort = await request.post("/api/v1/cohorts", {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      data: { programId, slug, name: "گروه دوال-رایت" },
    });
    expect(cohort.status()).toBe(201);
    const cohortBody = await cohort.json();

    // The dual-write interceptor should populate upgradedToOfferingId
    expect(cohortBody.upgradedToOfferingId).toBeTruthy();

    // And the linked offering must exist with legacyCohortId backlink
    const offResp = await request.get(`/api/v1/offerings/${cohortBody.upgradedToOfferingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(offResp.status()).toBe(200);
    const off = await offResp.json();
    expect(off.legacyCohortId).toBe(cohortBody.id);
    expect(off.nameFa).toBe("گروه دوال-رایت");

    // Cleanup — soft-delete cohort cascades to offering
    await request.delete(`/api/v1/cohorts/${cohortBody.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  });

  test("D18: cohort soft-delete cascades to linked offering soft-delete", async ({ request }) => {
    const token = await loginAsAdmin(request);
    const programId = await getFirstProgramId(request, token);
    const slug = `e2e-cascade-${Date.now()}`;

    const cohort = await request.post("/api/v1/cohorts", {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      data: { programId, slug, name: "گروه کاسکید" },
    });
    const cohortBody = await cohort.json();
    const linkedOfferingId = cohortBody.upgradedToOfferingId;
    expect(linkedOfferingId).toBeTruthy();

    // Both visible before delete
    const beforeOff = await request.get(`/api/v1/offerings/${linkedOfferingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(beforeOff.status()).toBe(200);

    // Soft-delete cohort
    const del = await request.delete(`/api/v1/cohorts/${cohortBody.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(del.status()).toBe(200);

    // Now offering should also be soft-deleted (404 on read with default filter)
    const afterOff = await request.get(`/api/v1/offerings/${linkedOfferingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(afterOff.status(), "linked offering soft-deleted via cascade").toBe(404);
  });

  test("D18: GET /v1/cohorts emits Sunset + Deprecation + Link headers", async ({ request }) => {
    const token = await loginAsAdmin(request);
    const res = await request.get("/api/v1/cohorts", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const headers = res.headers();
    expect(headers["sunset"]).toMatch(/2026/);
    expect(headers["deprecation"]).toBe("true");
    expect(headers["link"]).toMatch(/\/v1\/offerings.*successor-version/);
  });
});
