// Phase-16 Honest-Audit — capture the live production state per role
// per viewport per page. Observation only — NO assertions.
//
// Why this exists: Gate 2's smoke spec reported 9/9 pass but the owner
// confirmed the live site is broken for logged-in users across all roles
// and devices. The smoke spec only checked logged-out landing overflow,
// theme toggle, auth-gate redirect, and BottomNav presence — none of
// which exercise the authenticated workspace surface. This spec closes
// that gap by walking every (role × viewport × page) combination and
// emitting one PNG each.
//
// Errors are caught and a screenshot is still taken so the dossier
// captures broken states, login failures, 404s, etc. — those ARE the
// observation.
//
// Output: /screenshots/audit-logged-in-evidence/{role}/{viewport}/{page}.png
// (the bind mount lands them at docs/audit-logged-in-evidence/ on the host).
//
// Credentials: seed.ts defaults. The VPS may override via
// SEED_*_PASSWORD env vars — if so, login fails and the failure is
// itself the audit observation.
import { test, type Page, type BrowserContext } from "@playwright/test";

const OUT_BASE = "/screenshots/audit-logged-in-evidence";

interface Role {
  id: string;
  faLabel: string; // chip text in Persian
  email: string;
  password: string;
  workspace: string; // role-distinctive secondary route
}

// Mirrors apps/web/src/pages/Auth.tsx DEMO_CREDS + the role chip labels
// in the login form. If VPS env overrides any password, login will fail
// and the failure screenshot becomes the audit observation.
const ROLES: Role[] = [
  { id: "student",      faLabel: "دانشجو", email: "student1@digiuniversity.ir",    password: "StudentPass!1",    workspace: "/my-courses" },
  { id: "instructor",   faLabel: "استاد",  email: "instructor1@digiuniversity.ir", password: "InstructorPass!1", workspace: "/instructor"   },
  { id: "admin",        faLabel: "مدیر",   email: "admin@digiuniversity.ir",       password: "ChangeMe!2026",    workspace: "/admin"        },
  { id: "parent",       faLabel: "والد",   email: "parent1@digiuniversity.ir",     password: "ParentPass!1",     workspace: "/parent"       },
  { id: "organization", faLabel: "سازمان", email: "org1@digiuniversity.ir",        password: "OrgPass!1",        workspace: "/admin"        },
];

const VIEWPORTS = [320, 375, 768, 1024, 1280, 1536];

const safeShot = async (page: Page, path: string, fullPage = false): Promise<void> => {
  try {
    // Disable animations + give last paint a moment.
    await page.evaluate(() =>
      document.documentElement.setAttribute("data-test-no-animation", ""),
    ).catch(() => undefined);
    await page.waitForTimeout(250);
    await page.screenshot({ path, fullPage });
  } catch {
    /* swallow — the audit is observation, not enforcement */
  }
};

const loginAs = async (page: Page, role: Role): Promise<boolean> => {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  // wait for hydration so React renders the chip buttons.
  await page.waitForTimeout(500);
  try {
    // Click the role chip by Persian label.
    const chip = page.getByRole("button", { name: role.faLabel }).first();
    await chip.click({ timeout: 3000 });
  } catch {
    /* chip not clickable — fall through to manual fill */
  }
  try {
    // Click the "پر کردن خودکار ←" auto-fill button if present.
    await page.getByRole("button", { name: /پر کردن خودکار/ }).first().click({ timeout: 2000 });
  } catch {
    // Manual fill fallback.
    try {
      await page.locator('input[name="tenantSlug"]').fill("demo");
      await page.locator('input[name="email"]').fill(role.email);
      await page.locator('input[name="password"]').fill(role.password);
    } catch {
      return false;
    }
  }
  // Submit.
  try {
    const submit = page.getByRole("button", { name: /ورود به حساب/ }).first();
    await submit.click({ timeout: 3000 });
  } catch {
    return false;
  }
  // Wait for navigation off /login.
  try {
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
      timeout: 8000,
    });
    return true;
  } catch {
    return false;
  }
};

for (const role of ROLES) {
  for (const vp of VIEWPORTS) {
    test(`audit ${role.id} @ ${vp}`, async ({ browser }) => {
      // tall viewport so fullPage captures land; width is the variable.
      const ctx: BrowserContext = await browser.newContext({
        viewport: { width: vp, height: 812 },
        // Browser locale: leave default (en-US) — the site is RTL Persian
        // regardless of accept-language. Faster + matches prod CDN cache.
        hasTouch: vp < 768,
        isMobile: vp < 768,
      });
      const page: Page = await ctx.newPage();

      const dir = `${OUT_BASE}/${role.id}/${vp}`;

      // ----- 01-login (form with chips visible, BEFORE submit) -----
      try {
        await page.goto("/login", { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(500);
        // Click the role chip so the role-aware hint + demo creds panel reflect this role.
        try {
          await page.getByRole("button", { name: role.faLabel }).first().click({ timeout: 2000 });
        } catch {
          /* chip missing — capture login as-is */
        }
        await safeShot(page, `${dir}/01-login.png`, false);
      } catch {
        await safeShot(page, `${dir}/01-login-ERROR.png`, false);
      }

      // ----- Login flow -----
      const loggedIn = await loginAs(page, role);

      // ----- 02-dashboard (post-login or post-failure) -----
      try {
        await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(700); // hydrate + skeletons
        await safeShot(
          page,
          `${dir}/02-dashboard${loggedIn ? "" : "-LOGIN_FAILED"}.png`,
          true,
        );
      } catch {
        await safeShot(page, `${dir}/02-dashboard-ERROR.png`, false);
      }

      // ----- 03-sidebar (mobile: hamburger open; desktop: visible) -----
      try {
        await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(500);
        if (vp < 768) {
          // Mobile: open hamburger drawer
          try {
            await page.locator(".nav-toggle").first().click({ timeout: 2000 });
            await page.waitForTimeout(400);
          } catch {
            /* hamburger missing or hidden — capture as-is */
          }
        }
        await safeShot(page, `${dir}/03-sidebar.png`, false);
      } catch {
        await safeShot(page, `${dir}/03-sidebar-ERROR.png`, false);
      }

      // ----- 04-workspace (role-distinctive main work surface) -----
      try {
        await page.goto(role.workspace, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(700);
        await safeShot(page, `${dir}/04-workspace.png`, true);
      } catch {
        await safeShot(page, `${dir}/04-workspace-ERROR.png`, false);
      }

      // ----- 05-classroom (the worst page per user) -----
      try {
        await page.goto("/classroom", { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(800); // classroom hydrates aurora + WebRTC stubs
        await safeShot(page, `${dir}/05-classroom.png`, false);
      } catch {
        await safeShot(page, `${dir}/05-classroom-ERROR.png`, false);
      }

      await ctx.close();
    });
  }
}
