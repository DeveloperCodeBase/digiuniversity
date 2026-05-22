# Phase A R1.3 — Review (post-smoke fixes + sidebar redesign + brand)

> Pause point per owner. Cannot proceed to R2 until manual re-smoke passes.

## What shipped (commit map)

| # | Commit | Summary |
|---|---|---|
| 1 | `75408a7` | docs: memo + D9 + D10 + B6 out-of-scope |
| 2 | `d3e5abe` | **B5** — landing privacy leak fix (AppShell skeleton gate) + first R1.3 spec |
| 3 | `28f0695` | **B1** — sticky-nav scroll-aware shadow + opacity boost |
| 4 | `e494c73` | **B4 + D9** — hamburger-toggle sidebar on every viewport, localStorage `digiu_sidebar_pref`, ≥3xl pinned-inline exception |
| 5 | `1e537b4` | **B3** — Dashboard + Profile minimum responsive (overflow-x-hidden, stat-row single col, profile grid stacks) |
| 6 | `c70103f` | **B2** — login role-tabs 2-col at <md, form-side max-width 420/480, padding |
| 7 | `49c0dd1` | **Brand** — OrgAttribution component, theme-aware logos, footer + AppShell + About page |
| 8 | `19d4dec` | R1.1 spec test 9 updated to D9 contract (hamburger visible at lg+, no inline sidebar by default) |
| 9 | `9d0b140` | R1.3 test fixes round 1: B5 logic, B2 specificity, D9 localStorage timing, About regex |
| 10 | `a553177` | R1.3 test fixes round 2: B5 → frame-poll for nav.nav on landing; B2 → assert child positions with diagnostic dump |
| 11 | `08ee4e6` | R1.3 fix 3: B2 — remove inline gridTemplateColumns; let `.login-role-tabs` class own the column count |

## Assertion suites (post-R1.3 deploy)

| Spec | Pass | Skip | Fail |
|---|---|---|---|
| `phase-a-r1-1-appshell.spec.ts` | 13 | 0 | 0 |
| `phase-a-r1-2-breadcrumbs.spec.ts` | 9 | 1 (intentional — no 4-deep route exists) | 0 |
| `phase-a-r1-3-fixes.spec.ts` | 17 | 0 | 0 |
| **Total** | **39** | **1** | **0** |

## Self-critique (what surfaced + how it was fixed)

1. **The test that "passed" but didn't prove the contract.** R1's 23 assertions all returned green but the owner's manual smoke found 6 bugs. R1.3 raised this to a project-wide rule (R1.3-D10) saved to memory: Playwright `toBeVisible()` is necessary but not sufficient — owner manual smoke gates every sub-R.
2. **Privacy test catching marketing copy.** First B5 attempt string-matched "نسرین" in HTML and flagged the testimonial on Home.tsx (a legitimate marketing name, no real user). Switched to asserting the actual contract: `nav.nav` element MUST NOT co-render with pathname "/" or "/home". Browser-side requestAnimationFrame loop, race-free, resolves on URL change.
3. **CSS specificity war on inline styles.** B2 fought a flock of `[style*="grid-template-columns: repeat(5"]` attribute selectors across 6 different media-query blocks. The final fix removed the inline gridTemplateColumns entirely so the `.login-role-tabs` class owns columns at every breakpoint without competing.
4. **D9 changed R1.1's contract.** R1.1 test 9 ("inline sidebar visible at lg+") became invalid the moment D9 made the sidebar hamburger-only at every viewport. Updated the test to the new contract — D9's positive assertion (pinned-inline at ≥3xl with pref="open") lives in the R1.3 spec.
5. **Visual-run uses the LIVE app container.** When CSS changed but I forgot to redeploy, the visual run hit the stale bundle. Discovered the hard way; future runs after CSS or component changes must `up` first, then `visual`. Recorded informally; the existing rule already covers it ("PR push → up → logs → visual").

## Out-of-scope deferrals (logged this round)

| Item | Destination |
|---|---|
| B6 — Live classroom mobile rewrite | Phase D R1 (LiveKit ground-up) |
| Shared "auth-once" Playwright helper | post-Gate-A test-infra PR |
| `remote.ps1` docs-sweep hardening (`sudo git clean -fdx`) | post-Gate-A infra PR |

## Metrics before/after R1.3

| Metric | Before R1.3 | After R1.3 | Δ |
|---|---|---|---|
| Web bundle JS | 830.70 KB | 833.68 KB | +2.98 KB |
| Web bundle JS (gzip) | 244.67 KB | 245.73 KB | +1.06 KB |
| Web bundle CSS | 138.97 KB | 141.70 KB | +2.73 KB |
| Modules transformed | 190 | 191 | +1 (OrgAttribution) |
| Active `@ts-nocheck` | 46 | 46 | 0 (R2's job) |
| Playwright assertions | 23 | 39 | +16 (R1.3's 17 minus the 1 intentional skip) |
| Lighthouse mobile | not measured | not measured | Gate A captures |

JS bundle growth: +0.4% gzipped. Well under Phase 11's 5% cap.

## Logos status

You haven't dropped the two logo files yet. The integration is wired and waiting:

- `apps/web/public/logos/jdo-light.png` — referenced by the `.is-light` `<img>` tag; shown on light theme.
- `apps/web/public/logos/jdo-dark.png` — referenced by the `.is-dark` `<img>` tag; shown on dark theme (default).

Until those files land, every `<img class="org-attribution-logo">` shows the browser's broken-image placeholder. The layout reserves space via `min-height` so nothing jumps when the assets arrive. After you drop them in, just `.\scripts\remote.ps1 up` and the logos appear.

## Manual smoke checklist (60 seconds)

The actual point of this review. Go to **https://digiuniversity.ir** and verify each:

1. **/login at 375 wide** — role chips ("دانشجو", "استاد", "مدیر", "والد", "سازمان") form a 2-col grid (3 rows of 2+2+1), centered horizontally + vertically, form side ≤420px wide. No horizontal scroll. Compact JDO attribution at the bottom.
2. **Scroll the landing** (`/`) at any width — the navbar stays at the top throughout. After scrolling ~4px down, a subtle shadow appears under the nav and the background gets slightly more opaque (depth cue). Scroll back to top → shadow fades.
3. **Log in as `student1@digiuniversity.ir / StudentPass!1 / demo`** at 375 — drawer should be visibly closed. Tap hamburger → sidebar slides in from the right (RTL natural). The sidebar contains workspace items ("میز کار", "دروس من", "تقویم", "کارنامه", etc.) — NOT public marketing links. Tap any item → drawer closes + navigation lands.
4. **Same login at 1280** — workspace shows topbar + breadcrumb + content (no inline sidebar by default). Hamburger is visible in the topbar (D9). Tap hamburger → Sheet drawer slides from right with the sidebar.
5. **Same login at 1536+** — IF you previously had `digiu_sidebar_pref="open"` in localStorage, the sidebar pins inline beside content. Otherwise still drawer-only. Toggle the hamburger to flip between pinned/drawer.
6. **Visit `/` while logged in** — should redirect to `/dashboard` essentially instantly. The fleeting holding state is "در حال انتقال به داشبورد..." with a spinner. NO Nav with user data visible during the transit.
7. **Bottom of every page** (`/about`, `/dashboard`, `/login`, etc.) — JDO copyright attribution row is present. On marketing pages it's the full block with the logo + long-form text. On workspace/auth-flow it's the compact 1-line variant.

If any step looks off, tell me which one + what you see. R2 (retire `@ts-nocheck`) stays gated until you ack R1.3.

## Honest "would an outsider call this professional"

The R1.3 sub-phase exposed real holes in R1 — and they were caught the right way (manual smoke, not optimism). The fixes themselves are honest: B5 acknowledges the AppShell skeleton gate as the primary mechanism (Home.tsx's old useEffect is now belt-and-suspenders); B1 documents that the existing sticky was correct and only the visual depth was missing; D9 is a real paradigm shift and the docs say so. The shared `OrgAttribution` component is reusable across the three placement sites and the Persian copy is finally formal.

Where it would still read rough: most page TSX files still carry `@ts-nocheck` (R2 retires them); the B3 + B2 fixes are CSS-only minimum-viable patches that R3/R5 will replace with real responsive design; the org logos themselves are placeholders pending the owner's file drop. The platform is more honest than it was a few hours ago, but it's still mid-renovation.

## Awaiting

Your manual re-smoke on the 7-step checklist. Green light → R2 (retire `@ts-nocheck` across 46 files). Red on any step → tell me which.
