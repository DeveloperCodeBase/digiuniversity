# Phase A R1 — Combined Review (R1.1 + R1.2)

> Pause point per user instruction. Cannot proceed to R2 without your ack.

## What shipped

### R1.1 — AppShell 3-mode chrome composer

**Commits:**
- `a301fae` — docs: R1 memo + Phase A running logs (memo before code, per rule)
- `de3cde5` — code: AppShell + route-classification extracted + useMediaQuery hook + Nav 3-mode plumbing + workspace-grid breakpoint 980→1023
- `3942656` — test: 13 assertions across 4 groups (3-mode topology, logo target, responsive, a11y)
- `81e3b68` — docs: VPS cleanup lessons recorded (R1.1-D8 — never use `find -newer .git/HEAD`)
- `f2958d3` — fix: restore focus to hamburger on workspace drawer close (test 13 brought green)

**Owns:**
- `apps/web/src/layouts/AppShell.tsx` (101 lines): 3-mode discriminated render (PUBLIC / AUTH_FLOW / WORKSPACE), context-aware sidebar (fixed lg+, Sheet drawer <lg via `side="start"` → RTL right edge), `onCloseAutoFocus` callback restores focus to `#appshell-sidebar-trigger`, auth gate preserved verbatim, BottomNav narrowed to authenticated+workspace.
- `apps/web/src/router/route-classification.ts` (40 lines): `getRouteKind(id) → "PUBLIC"|"AUTH_FLOW"|"WORKSPACE"` extracted from the inline truth table in router.tsx.
- `apps/web/src/hooks/useMediaQuery.ts` (26 lines): SSR-safe `matchMedia` hook used by AppShell + R1.2 Breadcrumbs.
- `apps/web/src/shared.tsx` Nav extended: `mode` + `onWorkspaceMenuClick` props, `data-mode` attribute, context-aware brand target (workspace → /dashboard, public+authed → /dashboard, public+anon → /, auth_flow → /), hamburger hidden on auth_flow.
- `apps/web/styles.css`: `.workspace-grid` breakpoint 980 → 1023, `.appshell-sidebar-drawer` styling, `data-mode` rules for Nav.

**Test evidence:** 13/13 assertions pass at `docs/phase-a-r1-1-appshell-evidence/` (PNGs land via the visual docker bind mount; SCP back was flaky on last run but VPS-side artefacts confirmed via Playwright stdout — all 13 green at deploy `f2958d3`+).

### R1.2 — Breadcrumbs row

**Commits:**
- `a63fd3c` — docs: R1.2 memo
- `aab62fc` — code+test: Breadcrumbs.tsx + breadcrumb-map.ts + AppShell injection + styles + 10 assertions
- `8171be1` — fix: share authed context across tests to dodge 10/min auth rate limit
- `c607cf5` — docs: log post-Gate-A test-infra task (shared auth helper for all future specs)

**Owns:**
- `apps/web/src/layouts/Breadcrumbs.tsx` (77 lines): assembles trail from `useCurrentRoute()` + label map; `<md` truncation via `useMediaQuery("(min-width: 768px)")` collapses to `first › … › last-2` with Radix Popover on the … hop; U+203A `›` separator (RTL-natural); aria-label="مسیر صفحه" + aria-current="page" on tail.
- `apps/web/src/router/breadcrumb-map.ts` (26 lines): static route-id → Persian label dictionary + `breadcrumbLabel(id)` helper. Dynamic context-aware labels (Phase-B `useBreadcrumbResolver` for course-title-from-cache) deferred.
- `apps/web/src/layouts/AppShell.tsx` modified: `<Breadcrumbs />` injected below topbar on WORKSPACE routes only.
- `apps/web/styles.css`: `.breadcrumb-row` (36px sticky band, OKLCh tokens), `.breadcrumb-sep`, `.breadcrumb-ellipsis button` (44px touch target — WCAG 2.5.5), `.breadcrumb-popover` shell.

**Test evidence:** 9 passed, 1 intentionally skipped (the truncation-popover assertion is conditional on a 4-deep workspace URL existing; the current 49-route table has none, so the test asserts the popover wiring at the right viewport and skips when no ellipsis is rendered). Test run at deploy `c607cf5` took 7 seconds total — vs 1 minute on the pre-fix run when each test re-logged in.

## Self-critique (what surfaced + what we did)

1. **Test 13 (focus return after Escape) failed on first pass.** The hamburger lives in Nav and calls `onWorkspaceMenuClick` as a controlled-mode callback — not a Radix DialogTrigger — so Radix had no element to restore focus to. **Fix:** tag the workspace hamburger with `id="appshell-sidebar-trigger"` and add `onCloseAutoFocus={(e) => { e.preventDefault(); document.getElementById(...).focus(); }}` on SheetContent. Tested green.
2. **R1.2 tests timed out on logins.** The 10/min auth throttler is per-IP and the visual docker shares one IP. R1.1's 13 logins + R1.2's first few exhausted the bucket. **Fix:** one beforeAll login + sharedContext for all login-required R1.2 tests. Public-only tests stay on the default fixture. This pattern is needed for every future spec; logged as a post-Gate-A test-infra task to extract into a shared global setup.
3. **VPS docs-sweep was broken.** `remote.ps1`'s `git checkout -- docs/; git clean -fd docs/` prefix silently failed because Playwright PNGs are owned by a UID the VPS user can't unlink. Owner manually unblocked. **Logged:** R1.1-D6 + R1.1-D8 (and the rule "never use `find -newer .git/HEAD`" saved to memory `feedback_git_clean_find_newer.md`).
4. **R1.1 came in at 443 added lines** — over the 300 target. Per R1.1-D7 (also saved to memory), the cap is a target not a ceiling, and code+test must ship together. Tried trimming comments aggressively; further trimming would hurt readability. R1.2 came in at 297 added — under target.

## Deferred to out-of-scope log (`docs/PHASE_A_OUT_OF_SCOPE.md`)

| Entry | Destination |
|---|---|
| Shared "auth-once" Playwright helper (visual specs) | post-Gate-A test-infra PR |
| `remote.ps1` docs-sweep hardening (`sudo git clean -fdx`) | post-Gate-A infra PR |

Neither blocks R2; both are real but isolated from AppShell.

## Metrics before/after

| Metric | Before R1 | After R1.2 | Δ |
|---|---|---|---|
| Web bundle JS | 823.48 KB | 830.70 KB | +7.22 KB (Breadcrumbs + Radix Popover) |
| Web bundle JS (gzip) | 242.16 KB | 244.67 KB | +2.51 KB |
| Web bundle CSS | 137.15 KB | 138.97 KB | +1.82 KB (breadcrumb + appshell rules) |
| Modules transformed | 187 | 190 | +3 (Breadcrumbs.tsx, breadcrumb-map.ts, useMediaQuery.ts) |
| `@ts-nocheck` count | 46 | 46 | 0 (none added; R2 retires) |
| Playwright assertions (workspace shell) | 0 | 23 | +23 (13 R1.1 + 10 R1.2) |
| Lighthouse mobile | not yet measured | not yet measured | Gate A captures |
| axe-core violations | not yet measured | not yet measured | Gate A captures |

Bundle growth = +1% gzipped. Well within Phase 11's hard rule of ≤5% bundle growth per sprint.

## Manual smoke (60-second checklist for you)

Go to **https://digiuniversity.ir** on the device of your choice:

1. **/login** at 768x1024 (tablet) — should show topbar with brand + theme + user popover, NO hamburger, NO nav-links.
2. **/about** at 480x800 (small phone) — should show hamburger on the topbar. Tap → drawer slides in from the right with Home/About/Catalog/Pricing/Login links. Press Esc → drawer closes, focus returns to hamburger.
3. Log in as **student1@digiuniversity.ir / StudentPass!1 / tenant `demo`** at 1280x800 → land on /dashboard. Expect: topbar (brand only, no nav-links), breadcrumb row (`خانه › میز کار`), sidebar fixed on the right with student routes, content takes the rest. No console errors.
4. Same login at 768x1024 → sidebar is gone from the inline grid. Tap hamburger → sidebar Sheet slides in from the right. Press Esc → closes, focus returns.
5. While logged in, click brand logo → goes to /dashboard regardless of where you were. Open `/about` while logged in → logo now also points to /dashboard (back-to-workspace shortcut).

If any of 1-5 looks off, tell me which step and what you see. I won't start R2 until you ack.

## If an outsider saw this repo, would R1 feel professional? Honestly.

**Yes for R1.1.** The AppShell composition, 3-mode discriminated render, RTL-aware Sheet drawer, and 13-assertion test suite read like considered work. The focus-restore fix in particular shows the kind of a11y completeness a reviewer expects: the failure surfaced via test, the root cause was traced to controlled-mode trigger tracking, and the fix is documented inline.

**Mostly yes for R1.2.** The truncation contract is correct (logical at ≤3 crumbs, popover at >3), the resolver hook is deferred honestly (Phase-B will need it; we don't lie about shipping it), and the spec acknowledges the missing 4-deep route by skipping the popover-content assertion rather than faking the trigger. **Where it could read better:** the breadcrumb labels are a flat dictionary, not a per-route component — a Phase-B route might want bespoke chrome (e.g., a course-page breadcrumb that puts the course code before the title). The current shape supports it via the resolver hook but the hook is empty.

**Where it would read poorly:** the R1.2 spec skipping its truncation test deserves a comment in the review (here) to explain that it's not a hidden bug. The shared-context auth workaround is also a "we noticed and worked around it" rather than "we fixed the underlying" — but R1's scope says the underlying fix is a separate post-Gate-A PR.

## Awaiting

Your ack on the 60-second smoke. If green, I start R2 (retire 46 `@ts-nocheck` files into real types). If anything looks off, tell me which step and I'll fix before R2.
