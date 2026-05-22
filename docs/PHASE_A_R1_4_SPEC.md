# Phase A R1.4 — Per-bug fix spec (gated on owner approval)

> R1.3 failed manual smoke (D13). Owner sent 5 screenshots. This document is the plan for R1.4 — what each bug is, what assertion would have caught it, what the exact fix is, and what visual baseline becomes ground truth.
>
> **NO CODE YET.** I commit this spec, owner reviews, owner says go, then I execute one bug per commit per D13.

## Definitively confirmed bugs (from the 5 screenshots)

### Bug #1 — B4 sidebar drawer renders as 3 horizontal pills

**Screenshot:** screenshot 1 (8:38) — dark workspace page, drawer overlay on top, three pills visible at the top of the drawer reading "ثبت‌نام", "تقویم", "دروس من". No vertical list, no section headers, no other items.

**What the assertion verified (and passed):**
```ts
// phase-a-r1-3-fixes.spec.ts:70
await page.locator("button.nav-toggle").first().click();
await expect(page.locator("[aria-label='منوی workspace']")).toBeVisible();
await expect(page.locator("[aria-label='منوی workspace'] .side-nav")).toBeVisible();
```
The Sheet element rendered. The `.side-nav` element was present inside it. Both `toBeVisible()` passed.

**Why the assertion missed the bug:** `toBeVisible()` does not check internal layout. The `.side-nav` was there, but at `<720px` viewport, `styles.css:3598-3641` transforms it into a horizontal flex container with `flex-direction: row; overflow-x: auto; ... !important`. The element rendered horizontally — Playwright still calls that "visible".

**Root cause:** the horizontal-pill transform was authored for the LEGACY inline sidebar on `.dash` pages (pre-AppShell). After R1.1 introduced the Sheet drawer, the same `.side-nav` class is reused inside the drawer but the rule wasn't scoped.

**Exact code change:**
- **`apps/web/styles.css:3598`** — change the unscoped `@media (max-width: 720px) { .side-nav { ... } }` block (rows ~3598-3641) to `.dash .side-nav` (only applies to legacy inline `.dash` usage).
- **`apps/web/styles.css` (new rule, after the drawer-existing one)** — add:
  ```css
  /* Phase-A R1.4 B4 — the Sheet drawer must use the vertical layout
     regardless of viewport. Undo any inherited mobile pill transforms. */
  .appshell-sidebar-drawer .side-nav,
  .appshell-sidebar-drawer .side-nav ul {
    display: block !important;
    flex-direction: column !important;
    overflow-x: visible !important;
    overflow-y: auto !important;
    max-height: none !important;
    padding: 0 !important;
    gap: 0 !important;
  }
  .appshell-sidebar-drawer .side-nav li { flex-shrink: 1 !important; }
  .appshell-sidebar-drawer .side-nav li a {
    display: flex !important;
    padding: 10px 12px !important;
    border-radius: 8px !important;
    background: transparent !important;
    border: none !important;
    font-size: 14px !important;
    white-space: normal !important;
  }
  .appshell-sidebar-drawer .side-nav h6 { display: block !important; }
  ```

**D12 assertion (5-point contract):**
```ts
test("B4: drawer sidebar is a tall vertical list, not a pill row", async ({ browser }) => {
  const page = await authedPage(browser);
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/dashboard");
  await page.locator("button.nav-toggle").first().click();
  const drawer = page.locator("[aria-label='منوی workspace']");

  // 1. DOM present
  await expect(drawer).toBeAttached();

  // 2. Computed style — block display, vertical flow
  const styles = await drawer.locator(".side-nav").first().evaluate((el) => ({
    display: getComputedStyle(el).display,
    flexDirection: getComputedStyle(el).flexDirection,
    overflowX: getComputedStyle(el).overflowX,
  }));
  expect(styles.display).toMatch(/^(block|flex)$/);
  expect(styles.flexDirection).not.toBe("row");

  // 3. Viewport position — drawer is tall, items stack
  const box = await drawer.locator(".side-nav").first().boundingBox();
  expect(box!.height).toBeGreaterThan(300);

  // 4. Items stack vertically — each item's Y is greater than the previous
  const itemYs = await drawer.locator(".side-nav a").evaluateAll(
    (els) => els.map((e) => (e as HTMLElement).getBoundingClientRect().top)
  );
  for (let i = 1; i < itemYs.length; i++) {
    expect(itemYs[i]).toBeGreaterThan(itemYs[i - 1]);
  }

  // 5. Pixel-diff baseline
  await expect(drawer).toHaveScreenshot("b4-drawer-mobile-375.png", { threshold: 0.001 });
});
```

**Visual baseline:** `docs/visual-baselines/b4-drawer-mobile-375.png` — captured on first green run, committed as ground truth.

**Estimated diff size:** ~20 lines of CSS (one rule scoped, one new rule added). No TSX changes. ≤ 1 file modified.

---

### Bug #2 — B5 avatar leak ("نر" visible on landing + login)

**Screenshot:** screenshots 4 (landing) and 5 (login). The top navbar shows a cyan circle with "نر" — the mock student-role initials. This is `role.avatar` from `apps/web/src/role.tsx:104`, rendered unconditionally by Nav's user-menu trigger.

**What the assertion verified (and passed):**
```ts
// phase-a-r1-3-fixes.spec.ts:262
const racedToNav = await page.evaluate(/* polls nav.nav presence on landing */);
expect(racedToNav).toBe(false);
```
The R1.3 fix gated AppShell from rendering Nav when an authed user lands on `/`. The assertion confirms Nav is hidden while the redirect is in flight — that part works.

**Why the assertion missed the bug:** the leak isn't about Nav being rendered or not. It's that whenever Nav DOES render (anonymous on PUBLIC, or anyone on AUTH_FLOW), it shows `role.avatar = "نر"` because the user-menu trigger uses it unconditionally. Phase 14.8 fixed `user-name` (falls back to `role.label`) but did not fix `user-avatar`.

**Root cause:** `apps/web/src/shared.tsx` lines around the `<button className="user-btn">` — renders `<div className={"avatar " + role.color}>{role.avatar}</div>` even when `auth.user` is null. The mock role-avatar leaks to every anonymous visitor.

**Exact code change:**
- **`apps/web/src/shared.tsx`** — locate the `.user-btn` render around line ~233 (the `<button onClick={() => setUserOpen(!userOpen)}>`). Change the avatar div from:
  ```tsx
  <div className={"avatar " + role.color}>{role.avatar}</div>
  ```
  to:
  ```tsx
  <div className={"avatar " + (auth.user ? role.color : "")}>
    {auth.user
      ? (auth.user.fullName?.split(" ").map((p) => p[0]).slice(0, 2).join("") || auth.user.email?.[0]?.toUpperCase() || "•")
      : <Icon name="user" size={16} />}
  </div>
  ```
  Anonymous visitor sees a neutral icon. Authed user sees their own initials (fullName) or email-first-char. Never the mock `role.avatar`.

- **Same file, same component, UserDropdown render** (line ~358) — already uses `displayName` correctly (Phase 14.8). The avatar inside the dropdown (`<div className={"avatar " + role.color}>{role.avatar}</div>` at line ~358) needs the same change.

**D12 assertion (5-point contract):**
```ts
test("B5: anonymous visitor on /about never sees the mock role-avatar 'نر'", async ({ page }) => {
  await page.goto("/about");
  const avatar = page.locator("nav.nav .user-btn .avatar").first();

  await expect(avatar).toBeAttached();                          // 1 DOM
  await expect(avatar).not.toContainText("نر");                  // (the leak)
  await expect(avatar).not.toContainText("نسرین");
  await expect(avatar).not.toContainText("AA");                  // instructor mock
  await expect(avatar).not.toContainText("AM");                  // admin mock
  // 2 computed style — when anon, the colour class is empty
  const cls = await avatar.evaluate((el) => el.className);
  expect(cls).toMatch(/avatar(\s|$)/);
  expect(cls).not.toMatch(/cyan|amber|violet|rose/);
  // 3 in viewport
  const box = await avatar.boundingBox();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeLessThan(80);
  // 4 no overlap with brand — they're siblings in the nav, never visually stacked
  // (skipped — trivially true in flex row layout)
  // 5 baseline
  await expect(avatar).toHaveScreenshot("b5-anon-avatar.png", { threshold: 0.001 });
});
```

Plus an authed version that asserts the user's OWN initials show, not "نر":
```ts
test("B5: authed student on /about sees their own initials, not 'نر'", async ({ browser }) => {
  const page = await authedPage(browser);
  await page.goto("/about");
  const avatar = page.locator("nav.nav .user-btn .avatar").first();
  const text = await avatar.textContent();
  expect(text).not.toBe("نر");        // mock leak guard
  // The demo seed for student1 is "نسرین رضوی" → initials "نر" is COINCIDENTALLY the same.
  // For this assertion, use a non-student demo to disambiguate, OR seed the test user with
  // an unmistakable name.
  // (Document this limitation in the test.)
});
```

**Visual baseline:** `docs/visual-baselines/b5-anon-avatar.png` and `b5-authed-avatar.png`.

**Estimated diff size:** ~15 lines of TSX. 1 file modified.

---

### Bug #3 — Brand logos broken on production (deploy timing artifact, not code)

**Screenshot:** screenshot 3 (8:37) — footer org section shows the broken-image "?" placeholder where the JDO logo should be.

**What's actually wrong:** Nothing in the code. The logo files (`apps/web/public/logos/jdo-{light,dark}.png`) landed in commit `6018ed6` at ~8:36. Screenshot 3 was taken at 8:37 against the OLD nginx container, which was built before the logos. The fix is simply: rebuild the nginx image so the new public/ assets are baked in.

**Exact action:** Run `.\scripts\remote.ps1 up` after the B4 + B5 commits land. The vite build copies `public/logos/*` into `dist/logos/*` and nginx serves them.

**D12 assertion (5-point contract):**
```ts
test("Brand: JDO logo loads (not broken-image placeholder)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/about");
  const logo = page.locator("img.org-attribution-logo.is-dark").first();
  await expect(logo).toBeAttached();
  // 2 — the image actually loaded (naturalWidth > 0)
  const { naturalWidth, naturalHeight, src } = await logo.evaluate((el) => ({
    naturalWidth: (el as HTMLImageElement).naturalWidth,
    naturalHeight: (el as HTMLImageElement).naturalHeight,
    src: (el as HTMLImageElement).src,
  }));
  expect(naturalWidth, `logo failed to load. src=${src}`).toBeGreaterThan(0);
  expect(naturalHeight).toBeGreaterThan(0);
  // 3 visible in viewport (after scrolling to footer)
  await logo.scrollIntoViewIfNeeded();
  const box = await logo.boundingBox();
  expect(box!.width).toBeGreaterThan(40);
  expect(box!.height).toBeGreaterThan(40);
  // 5 baseline
  await expect(logo).toHaveScreenshot("brand-jdo-dark.png", { threshold: 0.001 });
});
```

**Visual baseline:** `docs/visual-baselines/brand-jdo-dark.png` + `brand-jdo-light.png`.

**Estimated diff size:** zero code. One deploy.

---

## Unverified bugs (need more screenshots)

### B1 sticky navbar
None of the 5 screenshots captures scroll behavior. The R1.3 assertion verified `position: sticky` is the computed style but never simulated real iOS scroll past the URL-bar collapse. **I cannot tell from this set whether B1 actually works on a real device or not.** Marked UNVERIFIED.

Request: scroll-down screenshot on the landing or /catalog at 375px on real iOS.

### B2 login layout (partial)
Screenshot 5 shows role chips ARE 2-col (the R1.3 fix worked there). But the navbar at top of /login appears to be missing — iOS URL bar sits directly above the "خوش آمدید" hero. **I cannot tell whether the Nav element is in the DOM but visually empty (e.g., 0 height because nav-actions are all hidden) or hidden entirely.** Marked PARTIAL — chips OK, navbar visibility on /login unknown.

Request: confirm by scrolling to the very top of /login.

### B3 dashboard + profile responsive
Not in the screenshot set. **Cannot evaluate.** Marked UNVERIFIED.

Request: /dashboard and /profile mobile screenshots after B4 sidebar fix lands (so the user can actually reach those pages).

### B6 classroom mobile
Screenshot 2 confirms broken. Already deferred to Phase D per the prior agreement.

---

## Order of execution (when owner approves this spec)

1. **Bug #1 (B4 sidebar)** — CSS scope fix + new drawer override rule. One commit. Run the new D12 assertion. Commit visual baseline `b4-drawer-mobile-375.png` if owner says it looks right.
2. **Bug #2 (B5 avatar)** — TSX change in shared.tsx Nav (2 spots). One commit. Run the new D12 assertion. Commit visual baselines.
3. **`.\scripts\remote.ps1 up`** — rebuild with all three changes + the logo files.
4. **Re-run all specs** — phase-a-r1-1-appshell, phase-a-r1-2-breadcrumbs, phase-a-r1-3-fixes, phase-a-r1-4-fixes.
5. **Send owner the new screenshots** for:
   - Drawer at 375 (B4 fix)
   - Avatar at landing + login (B5 fix)
   - Footer logo (brand deploy)
6. **PAUSE for owner manual re-smoke.** Per D13, automated green ≠ shipped. Owner says go or red. If red: STOP and audit again.

---

## What does not happen in R1.4

- No B1/B3/B6 work — pending more screenshots and/or already deferred.
- No R2 (retire @ts-nocheck) — gated until R1.3 + R1.4 finally pass manual smoke.
- No R3 / R4 / R5 — same gate.

---

## Owner approval needed before I write any code

Specifically:
- Is the B4 CSS scope fix (`.dash .side-nav` for legacy, `.appshell-sidebar-drawer .side-nav` for the drawer) acceptable, or do you want a different scoping (e.g., remove the legacy rule entirely since `.dash` pages are deprecated)?
- Is the B5 fallback (icon for anonymous, fullName-initials for authed) right, or do you want a specific glyph?
- For the visual baselines: I'll capture them on the first green run; you eyeball each baseline PNG when committed and reject if visually wrong. Is that the workflow you want?

Once you reply: I execute commits 1 → 2 → 3 → 4, then pause for manual smoke per D13.
