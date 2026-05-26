// Phase A R-Landing-v2 — D12 visual contract spec for the redesigned `/`.
//
// Per D47 (owner ack Q1.a Q2.b Q3.c, 2026-05-26):
//   - Home.tsx wrapped in `.home-shell-v2` so design CSS applies ONLY on `/`
//   - Q1.a: AGENT ARCHITECTURE preserved (existing text, design palette)
//   - Q2.b: topbar wrapped INSIDE `.home-shell-v2` scope — only renders on `/`
//   - Q3.c: hero co-brand chips = Jahad + AIRAC (design); Footer untouched
//
// This spec verifies via SEMANTIC assertions (per R7.12 lesson — avoid
// brittle snapshot baselines). DOM contract + computed style + navigation:
//   1. Scope: .home-shell-v2 wrapper exists on /, absent on /login + /programs
//   2. DOM: topbar with Jahad badge text rendered inside .home-shell-v2 on /
//   3. DOM: hero crown with 2 logo cards (Jahad + AIRAC) present
//   4. DOM: existing hero title text preserved verbatim
//   5. DOM: existing CTAs route to /admissions and /schools
//   6. DOM: AGENT ARCHITECTURE 5 pillars present (Q1.a)
//   7. Computed: .home-shell-v2 background = white paper #fff
//   8. Scope isolation: /login body color NOT navy-blue (scope didn't leak)
//   9. Animation: [data-reveal] elements present in hero (IntersectionObserver
//      target selector)
//  10. SW dispose: no active service worker after page load (D45 + D47)
//
// Tagged @gate-a so the existing gate-a sweep picks it up.

import { test, expect } from "@playwright/test";

test.describe("@gate-a R-Landing-v2 — Home redesign D12 contract", () => {

  // ----- Scope -----

  test("Scope: .home-shell-v2 renders on / and nowhere else", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".home-shell-v2")).toBeVisible();
    // /login must NOT carry the home wrapper.
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    expect(await page.locator(".home-shell-v2").count()).toBe(0);
    // /programs must NOT carry the home wrapper either.
    await page.goto("/programs", { waitUntil: "domcontentloaded" });
    expect(await page.locator(".home-shell-v2").count()).toBe(0);
  });

  // ----- DOM contract: topbar (Q2.b) -----

  test("DOM: topbar with Jahad badge renders INSIDE .home-shell-v2 on /", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const topbar = page.locator(".home-shell-v2 .topbar");
    await expect(topbar).toBeVisible();
    // Jahad badge text must be present (institutional brand statement)
    await expect(topbar).toContainText("جهاد دانشگاهی");
    // Autumn admission notice
    await expect(topbar).toContainText("ثبت‌نام دور پاییز ۱۴۰۵");
    // Email + 24/7 support on the other side
    await expect(topbar).toContainText("info@digiuniversity.ir");
    await expect(topbar).toContainText("پشتیبانی ۲۴ / ۷");
  });

  test("DOM: topbar must NOT render on /login (Q2.b scope isolation)", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    // The .home-shell-v2 .topbar selector should match zero elements
    // because .home-shell-v2 wrapper is absent on /login.
    expect(await page.locator(".home-shell-v2 .topbar").count()).toBe(0);
    // Defensive: there should be no bare `.topbar` outside the wrapper either,
    // since no other route renders one.
    expect(await page.locator("body > .topbar").count()).toBe(0);
  });

  // ----- DOM contract: hero co-brand (Q3.c) -----

  test("DOM: hero co-brand cards (Jahad + AIRAC) present in .hero-crown", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const crown = page.locator(".home-shell-v2 .hero-crown");
    await expect(crown).toBeVisible();
    // Two .logo-card children, one for each institutional partner
    const cards = crown.locator(".logo-card");
    expect(await cards.count()).toBe(2);
    // First card: Jahad
    await expect(cards.nth(0)).toContainText("جهاد دانشگاهی");
    await expect(cards.nth(0)).toContainText("بنیان‌گذار از سال ۱۳۵۹");
    // Second card: AIRAC research center
    await expect(cards.nth(1)).toContainText("مرکز راهبری پژوهش و پیشرفت");
    await expect(cards.nth(1)).toContainText("AIRAC");
  });

  // ----- DOM contract: preserved content (per owner «نوشته‌های قبلی نگه دار») -----

  test("DOM: existing hero title text preserved verbatim", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const heroTitle = page.locator(".home-shell-v2 .hero-title");
    await expect(heroTitle).toBeVisible();
    // The outcome-first headline owner approved in Phase-16 R2 (B-08).
    await expect(heroTitle).toContainText("دانشگاه آنلاین هوشمند ایران");
    await expect(heroTitle).toContainText("۲۴۸ برنامه");
    await expect(heroTitle).toContainText("گواهی قابل اثبات");
  });

  test("DOM: AGENT ARCHITECTURE preserved (Q1.a — content, restyled palette)", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // Eyebrow text from existing Home.tsx
    await expect(page.locator(".home-shell-v2")).toContainText("AGENT ARCHITECTURE");
    // Section title
    await expect(page.locator(".home-shell-v2")).toContainText("یک تیم آموزشی");
    // 5 pillars per Q1.a (existing content)
    const pillars = page.locator(".home-shell-v2 .pillar-grid .pillar");
    expect(await pillars.count()).toBeGreaterThanOrEqual(5);
    // Pillar text checks (some content-text-preserve evidence)
    await expect(pillars.first()).toContainText("موتور یادگیری");
  });

  // ----- Navigation contract -----

  test("CTA → /admissions: existing «درخواست پذیرش» button works", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /درخواست پذیرش/ }).first().click();
    await page.waitForURL((u) => u.pathname.startsWith("/admissions"), { timeout: 5000 });
    expect(page.url()).toMatch(/\/admissions$/);
  });

  test("CTA → /schools: existing «دانشکده‌ها و برنامه‌ها» button works", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /دانشکده‌ها و برنامه‌ها/ }).first().click();
    await page.waitForURL((u) => u.pathname.match(/\/(schools|programs)/), { timeout: 5000 });
    expect(page.url()).toMatch(/\/(schools|programs)$/);
  });

  // ----- Computed style contract -----

  test("Computed style: .home-shell-v2 background is design's paper (#fff)", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const wrapper = page.locator(".home-shell-v2").first();
    const bg = await wrapper.evaluate((n) => window.getComputedStyle(n).backgroundColor);
    // Design's --paper = #ffffff. Accept either pure white or rgb(255,255,255).
    expect(bg).toMatch(/rgb\(\s*255\s*,\s*255\s*,\s*255\s*\)/);
  });

  test("Scope isolation: /login body color is NOT design ink (#0a1830)", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    // Design's --ink = #0a1830 = rgb(10, 24, 48). On /login the wrapper isn't
    // in DOM, so home-v2.css can't apply. body color should resolve from the
    // R6.5 global navy palette (rgb(11, 36, 71) per R6.5-D14) — NOT #0a1830.
    const bodyColor = await page.evaluate(() => window.getComputedStyle(document.body).color);
    expect(bodyColor).not.toMatch(/rgb\(\s*10\s*,\s*24\s*,\s*48\s*\)/);
  });

  // ----- Animation contract -----

  test("Animation: hero crown has [data-reveal] for IntersectionObserver", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // The reveal observer hooks into [data-reveal] elements. Confirm
    // at least one such element exists in the hero (the co-brand row).
    const reveal = page.locator(".home-shell-v2 [data-reveal]");
    expect(await reveal.count()).toBeGreaterThan(0);
  });

  // ----- SW dispose contract (D45 + D47) -----

  test("SW dispose: no active service worker after page load", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // Give main.tsx's unregister IIFE a moment to fire-and-forget.
    await page.waitForTimeout(800);
    const swCount = await page.evaluate(async () => {
      if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return 0;
      const regs = await navigator.serviceWorker.getRegistrations();
      return regs.length;
    });
    // After D45+D47 dispose: any prior SW gets unregistered by main.tsx
    // on every load, and VitePWA is disabled (vite.config.js) so no new
    // SW gets registered. Net count must be 0.
    expect(swCount).toBe(0);
  });
});
