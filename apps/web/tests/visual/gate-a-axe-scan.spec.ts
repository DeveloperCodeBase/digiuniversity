// Gate A TASK B — axe-core route × violation scan.
//
// Walks every route in apps/web/src/router.tsx, runs @axe-core/playwright
// against it, filters to critical + serious violations (Gate A
// criterion 2 only counts these severities), and emits an aggregated
// JSON to docs/gate-a-evidence/axe-scan.json on the host via the
// volume-mounted docs/ dir (visual docker bind mount).
//
// Pass criteria (Compass §Gate A): 0 critical + 0 serious per route.
// If any route violates, the test still completes — we want the full
// table for the dossier. Aggregated results live in
// docs/gate-a-evidence/axe-scan.json which the dossier §2 reads.
//
// Auth strategy: workspace routes need a logged-in session. We share
// a BrowserContext via beforeAll (one login per spec run) — same
// pattern as R3 / R5 / R6 / R6.6 to dodge the auth rate-limit bucket.

import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import * as fs from "node:fs";
import * as path from "node:path";

const STUDENT = {
  faLabel: "دانشجو",
  email: "student1@digiuniversity.ir",
  password: "StudentPass!1",
};

async function login(page: Page): Promise<void> {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  try { await page.getByRole("button", { name: STUDENT.faLabel }).first().click({ timeout: 1500 }); } catch {}
  try { await page.getByRole("button", { name: /پر کردن خودکار/ }).first().click({ timeout: 1500 }); }
  catch {
    await page.locator('input[name="tenantSlug"]').fill("demo");
    await page.locator('input[name="email"]').fill(STUDENT.email);
    await page.locator('input[name="password"]').fill(STUDENT.password);
  }
  await page.getByRole("button", { name: /ورود به حساب/ }).first().click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15000 });
}

let authedContext: BrowserContext | null = null;
async function authedPage(browser: Browser): Promise<Page> {
  if (!authedContext) {
    authedContext = await browser.newContext();
    const setup = await authedContext.newPage();
    await login(setup);
    await setup.close();
  }
  return await authedContext.newPage();
}
test.afterAll(async () => { await authedContext?.close(); authedContext = null; });

interface RouteSpec {
  path: string;
  kind: "PUBLIC" | "AUTH_FLOW" | "WORKSPACE";
  /** For routes with a :param, the rendered path with a sample value. */
  rendered?: string;
}

// Mirrors route-classification.ts. Public routes per the PUBLIC_ROUTE_IDS set.
const PUBLIC_ROUTES: string[] = [
  "/",
  "/home",
  "/about",
  "/admissions",
  "/pricing",
  "/help",
  "/honor-code",
  "/programs",
];

// AUTH_FLOW per the AUTH_FLOW_ROUTE_IDS set.
const AUTH_FLOW_ROUTES: string[] = [
  "/login",
  "/register",
  "/forgot",
  "/verify-email",
  "/2fa-setup",
  "/onboarding",
];

// Everything else in the router that isn't public or auth-flow. Static
// paths only — dynamic-param routes go in PARAM_ROUTES below.
const WORKSPACE_ROUTES: string[] = [
  "/dashboard",
  "/admin",
  "/super",
  "/content",
  "/ta",
  "/support",
  "/moderate",
  "/org",
  "/parent",
  "/instructor",
  "/teach",         // alias — likely 404s, included for completeness
  "/catalog",
  "/my-courses",
  "/progress",
  "/tutor",
  "/calendar",
  "/community",
  "/inbox",
  "/messages",
  "/profile",
  "/settings",
  "/credential",
  "/transcript",
  "/career",
  "/wellness",
  "/library",
  "/labs",
  "/virtuallab",
  "/research",
  "/officehours",
  "/hackathons",
  "/alumni",
  "/events",
  "/schools",
  "/faculty",
  "/registration",
  "/degree-audit",
  "/financial-aid",
  "/audit",
  "/analytics",
  "/authoring",
  "/assessment",
  "/bookmarks",
  "/classroom",
  "/course",
  "/recordings",
  "/submission",
  "/achievements",
  "/search",
];

const PARAM_ROUTES: RouteSpec[] = [
  { path: "/course/:courseId", kind: "WORKSPACE", rendered: "/course/c-cs410" },
  { path: "/course-live/:courseId", kind: "WORKSPACE", rendered: "/course-live/c-cs410" },
  { path: "/assessment-live/:assessmentId", kind: "WORKSPACE", rendered: "/assessment-live/a-1" },
  { path: "/virtuallab/:labId", kind: "WORKSPACE", rendered: "/virtuallab/lab-1" },
];

interface ScanResult {
  path: string;
  kind: string;
  scanned_at: string;
  url: string;
  critical_count: number;
  serious_count: number;
  moderate_count: number;
  minor_count: number;
  /** Top rule ids that fired at critical/serious severity. */
  top_rules: string[];
  /** Title of the rendered page (sanity check that nav landed). */
  page_title?: string;
  /** True if the route returned a 404-shell or auth-redirect. */
  redirect_or_404?: boolean;
}

const ALL_RESULTS: ScanResult[] = [];

async function scanOne(page: Page, spec: RouteSpec): Promise<ScanResult> {
  const url = spec.rendered ?? spec.path;
  const scanned_at = new Date().toISOString();
  let result: ScanResult = {
    path: spec.path,
    kind: spec.kind,
    scanned_at,
    url,
    critical_count: 0,
    serious_count: 0,
    moderate_count: 0,
    minor_count: 0,
    top_rules: [],
  };
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(400);
    result.page_title = await page.title().catch(() => undefined);
    // Detect auth-redirect (workspace + not authed lands on /login)
    const finalUrl = page.url();
    if (spec.kind === "WORKSPACE" && finalUrl.includes("/login")) {
      result.redirect_or_404 = true;
      return result;
    }
    const axe = new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]);
    const r = await axe.analyze();
    const bySeverity: Record<string, string[]> = { critical: [], serious: [], moderate: [], minor: [] };
    for (const v of r.violations) {
      const sev = v.impact || "minor";
      if (sev in bySeverity) bySeverity[sev].push(v.id);
    }
    result.critical_count = bySeverity.critical.length;
    result.serious_count = bySeverity.serious.length;
    result.moderate_count = bySeverity.moderate.length;
    result.minor_count = bySeverity.minor.length;
    result.top_rules = [...new Set([...bySeverity.critical, ...bySeverity.serious])].slice(0, 5);
  } catch (err) {
    result.top_rules = [`scan-error:${err instanceof Error ? err.message.slice(0, 60) : "unknown"}`];
  }
  ALL_RESULTS.push(result);
  return result;
}

test.afterAll(async () => {
  // Write the aggregated JSON to the bind-mounted docs dir on the VPS,
  // which scp's back to the workspace post-run.
  const outDir = "/work/docs/gate-a-evidence";
  try { fs.mkdirSync(outDir, { recursive: true }); } catch {}
  const outPath = path.join(outDir, "axe-scan.json");
  const summary = {
    scanned_at: new Date().toISOString(),
    total_routes: ALL_RESULTS.length,
    routes_with_critical: ALL_RESULTS.filter((r) => r.critical_count > 0).length,
    routes_with_serious: ALL_RESULTS.filter((r) => r.serious_count > 0).length,
    routes_clean: ALL_RESULTS.filter((r) => r.critical_count === 0 && r.serious_count === 0).length,
    routes_redirected: ALL_RESULTS.filter((r) => r.redirect_or_404).length,
    results: ALL_RESULTS,
  };
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(`Wrote axe-scan summary to ${outPath} — ${summary.total_routes} routes, ${summary.routes_clean} clean, ${summary.routes_with_critical} with critical, ${summary.routes_with_serious} with serious`);
});

test.describe("Gate A axe-scan — PUBLIC routes", () => {
  for (const p of PUBLIC_ROUTES) {
    test(`axe scan: ${p}`, async ({ page }) => {
      const r = await scanOne(page, { path: p, kind: "PUBLIC" });
      // Don't fail the test — we want the FULL table even with violations.
      // Gate A pass/fail is decided in the dossier after all routes scan.
      expect(r.path).toBe(p);
    });
  }
});

test.describe("Gate A axe-scan — AUTH_FLOW routes", () => {
  for (const p of AUTH_FLOW_ROUTES) {
    test(`axe scan: ${p}`, async ({ page }) => {
      const r = await scanOne(page, { path: p, kind: "AUTH_FLOW" });
      expect(r.path).toBe(p);
    });
  }
});

test.describe("Gate A axe-scan — WORKSPACE routes (static)", () => {
  for (const p of WORKSPACE_ROUTES) {
    test(`axe scan: ${p}`, async ({ browser }) => {
      const page = await authedPage(browser);
      const r = await scanOne(page, { path: p, kind: "WORKSPACE" });
      expect(r.path).toBe(p);
    });
  }
});

test.describe("Gate A axe-scan — WORKSPACE routes (dynamic-param)", () => {
  for (const spec of PARAM_ROUTES) {
    test(`axe scan: ${spec.path}`, async ({ browser }) => {
      const page = await authedPage(browser);
      const r = await scanOne(page, spec);
      expect(r.path).toBe(spec.path);
    });
  }
});
