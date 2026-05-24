// Phase A R7.9 — Gate A flow regression spec (the first D18 instance).
//
// Per D18 (flow assertions on multi-step user journeys) + D21 (R8
// subsumed by R7.9): every demo user logs in and must reach BOTH
// (1) their role's expected homeRoute (catches the apiRoleToLocal
// mapper drift that was Gate A §5's root cause) AND (2) their
// role-tailored sidebar (catches future regressions of the per-role
// nav data in NAV_ITEMS_BY_ROLE / SIDEBAR_BY_ROLE).
//
// Tagged @gate-a so a future CI step can pick the whole gate-a
// suite without picking unrelated specs.

import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";

interface RoleConfig {
  /** Local RoleId slug; matches role.tsx and the api seed. */
  slug:
    | "student" | "instructor" | "admin" | "parent" | "org"
    | "ta" | "content_manager" | "support" | "moderator" | "super_admin";
  /** Persian label (for the test title). */
  fa: string;
  email: string;
  password: string;
  /** Expected URL after login — must match role.tsx::ROLES[slug].homeRoute. */
  expectedHomeRoute: string;
  /**
   * Role-distinctive sidebar item id (the D18 sentinel). Must be a
   * route id that appears in SIDEBAR_BY_ROLE[slug] in
   * apps/web/src/sidenav.tsx. Picked per the R7.9 memo's analysis:
   * sentinels in student's sidebar (calendar, classroom, community)
   * are acceptable because the URL-match assertion above is the
   * primary catch for student-fallback bugs; the sentinel just
   * proves the per-role nav data wasn't accidentally wiped.
   */
  sentinel: string;
}

const ROLES: RoleConfig[] = [
  { slug: "student",         fa: "دانشجو",        email: "student1@digiuniversity.ir",    password: "StudentPass!1",    expectedHomeRoute: "/progress", sentinel: "registration" },
  { slug: "instructor",      fa: "استاد",         email: "instructor1@digiuniversity.ir", password: "InstructorPass!1", expectedHomeRoute: "/progress", sentinel: "instructor" },
  { slug: "admin",           fa: "مدیر",          email: "admin@digiuniversity.ir",       password: "ChangeMe!2026",    expectedHomeRoute: "/progress", sentinel: "schools" },
  { slug: "parent",          fa: "والد",          email: "parent1@digiuniversity.ir",     password: "ParentPass!1",     expectedHomeRoute: "/parent",   sentinel: "calendar" },
  { slug: "org",             fa: "سازمان",        email: "org1@digiuniversity.ir",        password: "OrgPass!1",        expectedHomeRoute: "/org",      sentinel: "faculty" },
  { slug: "ta",              fa: "دستیار آموزشی", email: "ta1@digiuniversity.ir",         password: "TaPass!1",         expectedHomeRoute: "/ta",       sentinel: "classroom" },
  { slug: "content_manager", fa: "مدیر محتوا",    email: "cm1@digiuniversity.ir",         password: "ContentPass!1",    expectedHomeRoute: "/content",  sentinel: "authoring" },
  { slug: "support",         fa: "پشتیبانی",      email: "support1@digiuniversity.ir",    password: "SupportPass!1",    expectedHomeRoute: "/support",  sentinel: "audit" },
  { slug: "moderator",       fa: "نظارت",         email: "moderator1@digiuniversity.ir",  password: "ModeratorPass!1",  expectedHomeRoute: "/moderate", sentinel: "community" },
  { slug: "super_admin",     fa: "ابرمدیر",       email: "superadmin@digiuniversity.ir",  password: "SuperAdminPass!1", expectedHomeRoute: "/super",    sentinel: "audit" },
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function login(page: Page, role: RoleConfig): Promise<void> {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  // Direct credential entry (skip the demo role selector which only
  // wires 5 of 10 roles in LoginPage's currentRole map).
  await page.locator('input[name="tenantSlug"]').fill("demo");
  await page.locator('input[name="email"]').fill(role.email);
  await page.locator('input[name="password"]').fill(role.password);
  await page.getByRole("button", { name: /ورود به حساب/ }).first().click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 20000 });
}

test.describe("@gate-a — Role-routing flow (D18 ROLE_DISTINCTIVE spec)", () => {
  test.describe.configure({ mode: "serial" });

  // Throttle-bucket safety: the api throttles /v1/auth/login at 10/min
  // per IP. With 10 demo logins back-to-back from the same docker
  // container IP, we can hit the bucket if a previous visual run also
  // left logins in the rolling 60s window. Small inter-test pause keeps
  // us comfortably under the limit (10 roles × 6.5s = 65s + ~2s each
  // for the actual test work = ~85s total spec runtime — acceptable).
  // The first test runs immediately; subsequent ones wait.
  let testIndex = 0;
  test.beforeEach(async () => {
    if (testIndex > 0) {
      await new Promise((r) => setTimeout(r, 6500));
    }
    testIndex++;
  });

  for (const role of ROLES) {
    test(`${role.slug} (${role.fa}) lands on ${role.expectedHomeRoute} + sidebar contains /${role.sentinel}`, async ({ browser }) => {
      // Fresh context per role — no leakage of localStorage / role
      // state from the previous test.
      const ctx: BrowserContext = await browser.newContext({
        viewport: { width: 1024, height: 800 },
      });
      const page = await ctx.newPage();
      try {
        await login(page, role);

        // D18 assertion #1 — URL match. The primary catch for
        // apiRoleToLocal mapper drift. If this fails, role mapper
        // bucketed the user wrong → wrong post-login redirect.
        const pattern = new RegExp(escapeRegex(role.expectedHomeRoute) + "$");
        await expect(
          page,
          `${role.slug}: post-login URL must end with ${role.expectedHomeRoute}`,
        ).toHaveURL(pattern, { timeout: 10000 });

        // D18 assertion #2 — sidebar contains the role-distinctive
        // item. Catches future regressions of the per-role nav data
        // in SIDEBAR_BY_ROLE even if the mapper is correct.
        //
        // R7.12 partially supersedes R6.6 at ≥1024: the sidebar now
        // lives in the persistent rail (`.r7-mini-rail`) rather than
        // the Sheet drawer (`.appshell-sidebar-drawer`). The test runs
        // at 1024×800 which IS the rail breakpoint — so the rail path
        // is the primary one. <1024 viewports keep the Sheet drawer
        // (R6.6 unchanged) but the spec doesn't exercise those today.
        const railVisible = await page.locator(".r7-mini-rail").isVisible();
        if (railVisible) {
          // ≥1024 — rail is always-in-DOM; sentinel link is in rail's side-nav.
          // In mini mode the link's text is sr-only but the <a> element is
          // visible (icon renders).
          const sentinelLink = page.locator(
            `.r7-mini-rail .side-nav a[href="/${role.sentinel}"]`,
          );
          await expect(
            sentinelLink,
            `${role.slug}: rail side-nav must contain link to /${role.sentinel} (D18 sentinel)`,
          ).toBeVisible({ timeout: 5000 });
        } else {
          // <1024 — Sheet drawer path (R6.6 unchanged). Click hamburger
          // to open the drawer, then assert the sentinel link.
          const trigger = page.locator("#appshell-sidebar-trigger");
          await expect(trigger).toBeVisible();
          await trigger.click();
          const sidebar = page.locator(".appshell-sidebar-drawer .side-nav");
          await expect(sidebar).toBeVisible({ timeout: 5000 });
          const sentinelLink = sidebar.locator(`a[href="/${role.sentinel}"]`);
          await expect(
            sentinelLink,
            `${role.slug}: Sheet sidebar must contain link to /${role.sentinel} (D18 sentinel)`,
          ).toBeVisible({ timeout: 5000 });
        }
      } finally {
        await ctx.close();
      }
    });
  }
});
