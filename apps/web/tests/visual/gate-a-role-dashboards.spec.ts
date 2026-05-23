// Gate A TASK C — 10 role dashboards composite.
//
// Logs in as each of the 10 demo users (per the api seed at
// apps/api/src/prisma/seed.ts) and screenshots their post-login
// landing surface at viewport 1024×800. Each PNG lands under
// docs/gate-a-evidence/role-dashboards/<role>.png via the visual
// docker bind mount.
//
// The dossier §5 reads these PNGs into a 5×2 markdown table; the
// composite montage (if assembled later via ImageMagick) lives at
// docs/gate-a-evidence/role-dashboards-grid.png.
//
// Pass criteria (Compass §Gate A criterion 5): the 10 role surfaces
// are visually distinct (unique chrome OR content per role). This
// spec asserts only "screenshot landed for each of 10 roles"; the
// visual-distinct verdict is in the dossier after owner inspection.

import { test, type Page } from "@playwright/test";
import * as fs from "node:fs";

interface RoleSeed {
  /** Display name for the file + table */
  slug: string;
  /** Persian label (for diagnostics) */
  fa: string;
  email: string;
  password: string;
  /** Expected post-login landing route (per role.homeRoute) */
  expectedHomeRoute: string;
}

// Mirrors the api seed at apps/api/src/prisma/seed.ts and the role
// catalogue at apps/web/src/role.tsx. All 10 demo roles + their
// home-route landings.
const ROLES: RoleSeed[] = [
  { slug: "student",         fa: "دانشجو",            email: "student1@digiuniversity.ir",    password: "StudentPass!1",     expectedHomeRoute: "/progress" },
  { slug: "instructor",      fa: "استاد",             email: "instructor1@digiuniversity.ir", password: "InstructorPass!1",  expectedHomeRoute: "/progress" },
  { slug: "admin",           fa: "مدیر",              email: "admin@digiuniversity.ir",       password: "ChangeMe!2026",     expectedHomeRoute: "/progress" },
  { slug: "parent",          fa: "والد",              email: "parent1@digiuniversity.ir",     password: "ParentPass!1",      expectedHomeRoute: "/parent" },
  { slug: "org",             fa: "سازمان",            email: "org1@digiuniversity.ir",        password: "OrgPass!1",         expectedHomeRoute: "/org" },
  { slug: "ta",              fa: "دستیار آموزشی",     email: "ta1@digiuniversity.ir",         password: "TaPass!1",          expectedHomeRoute: "/ta" },
  { slug: "content_manager", fa: "مدیر محتوا",        email: "cm1@digiuniversity.ir",         password: "ContentPass!1",     expectedHomeRoute: "/content" },
  { slug: "support",         fa: "پشتیبانی",          email: "support1@digiuniversity.ir",    password: "SupportPass!1",     expectedHomeRoute: "/support" },
  { slug: "moderator",       fa: "نظارت انجمن‌ها",    email: "moderator1@digiuniversity.ir",  password: "ModeratorPass!1",   expectedHomeRoute: "/moderate" },
  { slug: "super_admin",     fa: "ابرمدیر",           email: "superadmin@digiuniversity.ir",  password: "SuperAdminPass!1",  expectedHomeRoute: "/super" },
];

const EVIDENCE_DIR = "/work/docs/gate-a-evidence/role-dashboards";
try { fs.mkdirSync(EVIDENCE_DIR, { recursive: true }); } catch {}

async function login(page: Page, role: RoleSeed): Promise<void> {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  // Direct credential entry (skip the demo role selector, which only
  // wires 5 of 10 roles in LoginPage's currentRole map).
  await page.locator('input[name="tenantSlug"]').fill("demo");
  await page.locator('input[name="email"]').fill(role.email);
  await page.locator('input[name="password"]').fill(role.password);
  await page.getByRole("button", { name: /ورود به حساب/ }).first().click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 20000 });
}

test.describe("Gate A — 10 role dashboards screenshot grid", () => {
  test.describe.configure({ mode: "serial" });

  for (const role of ROLES) {
    test(`role ${role.slug} (${role.fa})`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: 1024, height: 800 } });
      const page = await ctx.newPage();
      try {
        await login(page, role);
        // Settle: let any post-login redirect + first paint finish.
        await page.waitForTimeout(1500);
        const landedUrl = page.url();
        const outPath = `${EVIDENCE_DIR}/${role.slug}.png`;
        await page.screenshot({ path: outPath, fullPage: false });
        console.log(`[role-grid] ${role.slug.padEnd(16)} landed=${landedUrl}  saved=${outPath}`);
      } finally {
        await ctx.close();
      }
    });
  }
});
