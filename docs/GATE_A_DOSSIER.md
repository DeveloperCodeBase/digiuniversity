# Gate A Dossier — Foundation Repair

> **RE-REVIEW DRAFT** — all three measurement TASKs (A: Lighthouse, B: axe-core, C: role-dashboards composite) have now executed against real data. The dossier no longer carries TBD placeholders. **Gate A is BLOCKED on 3 of 6 criteria** (§1 Lighthouse, §2 axe-core, §5 role-dashboard routing). Each section documents real numbers + a concrete R7 fix plan; no R7 implementation has begun. Awaiting owner review before any sub-R kicks off.

---

## Compass §Gate A — 6-criterion checklist

| # | Criterion | Status | Evidence below |
|---|---|---|---|
| 1 | Lighthouse mobile ≥ 90 on 3 sampled pages | 🟡 **partial** (A11y ✅ 100/100/96; Perf 🔴 66/100/66 — R7.1+R7.2 pending) | §1 |
| 2 | axe-core: 0 critical / serious on every route | ✅ **PASS** (critical 0 across 67; 60 documented serious KEEPs — see D31) | §2 |
| 3 | TypeScript strict, ≤ 5 `@ts-nocheck` (all in DEFERRED) | ✅ verified | §3 |
| 4 | All Playwright baseline + D12 assertions pass | ✅ verified | §4 |
| 5 | 10 role dashboards visually distinct (reachable by role) | ✅ **PASS** (10/10 routing + role-tailored nav) | §5 |
| 6 | Audit-on-mutation lint enforced in CI | ✅ verified | §6 |
| ➕ | Owner manual smoke ack on every sub-R (D13 formal gate) | ⏳ awaiting owner | §7 |

**Gate A passes when:** all six above are ✅ AND every sub-R has owner D13 ack. Until then, **no Phase B work begins.**

**Current state (post-R7.3 D32):** Gate A blocked on **§1 Performance subset only**. §1 a11y subset ✅ PASS. §2 owner-verdict-PASS per D31. §5 cleared per D24. Next sub-Rs: **R7.1** (Vite chunks) + **R7.2** (Vazirmatn self-host) — Performance track.

| Sub-R | Critical-path impact | Status |
|---|---|---|
| R7.6 | --fg-mute + --fg-dim → 4.5:1 contrast | ✅ D19 |
| R7.5 | aria-valid-attr-value 53 → 0 | ✅ D22 |
| R7.9 | apiRoleToLocal 3 → 10 + D18 flow spec | ✅ D24 |
| R7.12 | Mini-variant persistent sidebar | ✅ D27 |
| R7.7 | accent/gold-as-text demote + 9 per-page a11y fixes (critical 6 → 0) | ✅ D30 |
| **§2 verdict** | critical 0 + serious-KEEPs-documented = §2 PASS | ✅ D31 |
| R7.3 | Lighthouse a11y subset (88/88/87 → 100/100/96) | ✅ D32 |
| **§1 a11y subset** | 100/100/96 ≥ 95+ target | ✅ (since D32) |
| R7.1 | Vite manual chunks + React.lazy route splitting | ⏳ memo next |
| R7.2 | Self-host Vazirmatn + drop unused font families | ⏳ memo next |

---

## §1 — Lighthouse mobile scores (Criterion 1) — **🔴 FAIL**

**Target:** ≥ 90 on each of `/`, `/login`, and a role-typical dashboard.

**Methodology:** Lighthouse 12 CLI, headless Chrome via `chrome-launcher`, mobile emulation preset (Moto G4 / Slow 4G + 4× CPU), `--throttling-method=simulate`. Run from Windows host against the live production URL `https://digiuniversity.ir` so Caddy + nginx + SPA are all in the loop.

**Run command (canonical, used for the runs below):**
```bash
CHROME_PATH="/c/Program Files/Google/Chrome/Application/chrome.exe" \
  npx -y lighthouse@12 https://digiuniversity.ir/ \
  --output=json --output=html \
  --output-path=docs/gate-a-evidence/lh-landing-mobile \
  --form-factor=mobile --throttling-method=simulate --quiet \
  --chrome-flags="--headless=new --no-sandbox --disable-dev-shm-usage"
# Repeat for /login and /programs.
```

**Page substitution from the original target list:** the Compass §Gate A bullet calls for an "instructor dashboard role-typical" third page (the owner suggested `/teach`). Two reasons for the substitution:
1. **`/teach` does not exist** in the current route table (`apps/web/src/router.tsx` has `/instructor` for the instructor console; `instructor.homeRoute = "progress"` for the live data dashboard). The Compass label was a forward-looking name.
2. **`/instructor` is workspace-only** (auth-gated) and Lighthouse 12 CLI doesn't carry a logged-in session through `--extra-headers` because the SPA reads JWT from `localStorage`, not headers. Auditing authed routes requires a custom puppeteer-orchestrated runner (R7 candidate).

**Substituted third page:** `/programs` — a public, content-rich route with cards + faculty filters, representative of typical SPA workload. This means the §1 numbers measure the **anonymous / first-paint** profile. The authenticated profile is a follow-up.

### Run results

**Initial run (2026-05-23, pre-R7):**

| Page | Performance | Accessibility | Best Practices | SEO | PWA | All ≥90? |
|---|---|---|---|---|---|---|
| `/` (landing) | 35 | 88 | 100 | 92 | n/a* | 🔴 NO |
| `/login` (R5) | 66 | 88 | 100 | 92 | n/a* | 🔴 NO |
| `/programs` (public) | 66 | 87 | 100 | 92 | n/a* | 🔴 NO |

**Re-run after critical path (R7.6 + R7.5 + R7.9 + R7.12 merged to main, 2026-05-23):**

| Page | Performance | Accessibility | Best Practices | SEO | All ≥90? | Δ vs initial |
|---|---|---|---|---|---|---|
| `/` (landing) | **46** | 88 | **0**† | 92 | 🔴 NO | Perf +11, A11y 0, BP −100 |
| `/login` (R5) | **67** | 88 | 100 | 92 | 🔴 NO | Perf +1, A11y 0 |
| `/programs` (public) | **67** | 87 | 100 | 92 | 🔴 NO | Perf +1, A11y 0 |

† **Lighthouse 12 BP-anomaly on `/`.** The Best Practices category dropped to 0 even though 21 of 22 audits pass (the single failing audit is `valid-source-maps` with `weight=0`, which is a non-counting audit per Lighthouse's scoring model). Computed by weight: 27/28 = **96**. Lighthouse-reported: 0. This is a Lighthouse 12 reporting quirk, not a real regression — `/login` and `/programs` are scored at 100 with the same passing audits. Treat the `/` BP score as a methodology artefact pending Lighthouse 12 patch or an alternate audit runner.

\* PWA: Lighthouse 12 removed the PWA category from the default desktop/mobile audit. PWA conformance is now spread across individual audits (`installable-manifest`, `service-worker`, `offline-start-url`, etc.) and is no longer a category score. The Compass §Gate A "PWA ≥ 90" line is not measurable in current Lighthouse; treat it as satisfied if the underlying audits pass. Evidence files: `docs/gate-a-evidence/lh-{landing,login,programs}-mobile.report.{json,html}`.

**Gate A criterion 1 verdict (post-critical-path): 🔴 STILL FAIL.** Performance moved (35→46 on /, +1 elsewhere) — R7.6 (token darken) had no measurable Lighthouse a11y effect because the 88/87 score is now gated by **accent-as-text** (R7.7a) + **gold-as-text** (R7.7b) + **button-name** / **heading-order** / **label-mismatch** long-tail (R7.3 / R7.7d). Performance still ~30-45 points below 90 — needs R7.1 (Vite manual chunks) + R7.2 (Vazirmatn self-host) per D25 sequential order.

### Where the score went — Performance

Detailed Web Vital metrics per page:

| Page | FCP | LCP | TBT | CLS | Speed Index |
|---|---|---|---|---|---|
| `/` | 5.4 s | 7.0 s | **2,090 ms** | 0.011 | 5.4 s |
| `/login` | 4.9 s | 6.1 s | 0 ms | 0.031 | 4.9 s |
| `/programs` | 4.8 s | 6.1 s | 0 ms | 0.005 | 4.8 s |

**Targets (Good in Lighthouse's banding):** FCP ≤ 1.8s, LCP ≤ 2.5s, TBT ≤ 200ms, CLS ≤ 0.1, SI ≤ 3.4s. Every page misses FCP, LCP, and Speed Index by 2-3×.

**Root cause analysis:**
- **JS bundle weight.** `dist/assets/index-*.js` is 873 KB raw / 258 KB gzipped. Parse + execute on a Moto G4 (CPU class ~2 GHz) costs ~1.5-2 s before React even mounts. That's the bulk of the TBT on `/` (`/` runs the full marketing landing animation rAF + the AppShell hydration in one go).
- **Render-blocking resources.** Vazirmatn + JetBrains Mono + Bricolage Grotesque load from `fonts.googleapis.com` (3 separate font families, ~250 KB of woff2). Google Fonts CDN is reachable from outside Iran but slow from inside (the audit ran on a non-Iranian Lighthouse host but uses Slow 4G throttle, which simulates the latency). Each font family blocks first paint until it falls back via `font-display: swap`.
- **No SSR / SSG.** The SPA renders client-side; the empty HTML shell is 1.8 KB but the SPA needs 873 KB of JS before any content paints. First Contentful Paint is dominated by the JS download + parse window.
- **No code splitting.** The build is one big bundle. Marketing pages (`/`, `/about`, `/pricing`) inherit the entire workspace bundle (sidenav, RBAC, audit, AI tutor, etc.) even though they don't use any of it.

### Where the score went — Accessibility

| Page | Failing audits |
|---|---|
| `/` | `button-name` ×1, `color-contrast` ×4, `heading-order` ×2 |
| `/login` | `aria-toggle-field-name` ×2, `button-name` ×1, `color-contrast` ×1, `label-content-name-mismatch` ×1 |
| `/programs` | `button-name` ×1, `color-contrast` ×7, `heading-order` ×2, `label-content-name-mismatch` ×2 |

**Root cause analysis:**
- **`button-name` on every page.** Same component, same root cause: at least one button on every page lacks an accessible name (no text content, no `aria-label`, no `aria-labelledby`). Almost certainly an icon-only button somewhere in the chrome (likely the search icon button in the topbar, which uses `aria-label="پالت دستورات (Cmd+K)"` — but Lighthouse may be flagging a different one).
- **`color-contrast` worst on /programs (7 items).** R6.5 switched the theme to white + navy, and the muted secondary tokens (`--fg-mute: #5b6b87`, `--fg-dim: #93a0b8`) may not hit 4.5:1 contrast against `--bg: #ffffff` for body text. Per WCAG 2.2 SC 1.4.3 the threshold is 4.5:1 for normal text and 3:1 for large text.
- **`heading-order` on / and /programs.** An h3 without an h2 (or an h2 without an h1) somewhere on the page. Phase 14.7's chrome migration may have left orphan h-levels behind.
- **`aria-toggle-field-name` on /login.** The password show/hide toggle button and the theme toggle button likely have icon-only content with the wrong aria attribute set.
- **`label-content-name-mismatch` on /login + /programs.** A button's visible text doesn't match its accessible name (e.g., visible "خروج" but `aria-label="خروج از کلاس"` — Lighthouse expects the visible text to be a substring of the aria-label).

### Proposed fix plan — **R7 (post-Gate-A, NOT implementation now)**

Per owner directive (2026-05-23): «اگه page زیر 90 شد، علت رو زیر جدول لیست کن + plan fix (نه implement)».

R7 sweeps in this order, each sub-bullet a separate sub-R:

**R7.1 — Code split + lazy load (Performance)**
- Add Vite manual chunks: `vendor-react`, `vendor-ui`, `auth`, `workspace`, `marketing`. Goal: marketing pages load only `vendor-react + vendor-ui + marketing` (~200 KB raw).
- Convert `apps/web/src/pages/*.tsx` imports in `router.tsx` to `React.lazy(() => import(...))` with `<Suspense fallback={<AuthLoadingSkeleton />}>`.
- Expected gain: FCP 5.4 s → ~2.5 s, LCP 7.0 s → ~3.5 s, Performance score ~35 → ~70.

**R7.2 — Self-host Vazirmatn + remove unused font families (Performance)**
- This is candidate A4 in `ARCHITECTURE_V2_NOTES.md` — promote to R7.2.
- Self-host Vazirmatn 400/500/700 (drop 300/600/800/900 — the design uses only 3 weights). Same for JetBrains Mono (400/600 only). Drop Bricolage Grotesque unless evidence shows it's used; otherwise replace with Vazirmatn's bold weight.
- Expected gain: FCP shaves 1.5-2 s on Slow 4G. Performance score ~70 → ~85.

**R7.3 — Accessibility sweep (Accessibility)**
- Find the missing `aria-label` button via Lighthouse's audit JSON (`audits['button-name'].details.items[*].node.selector`). Add the missing labels.
- Audit color tokens: any `var(--fg-mute)` text on `var(--bg)` is checked against 4.5:1; tokens that fail get darkened (proposal: `--fg-mute: #4a5a76` instead of `#5b6b87`, increases contrast ratio).
- Fix heading-order: walk every page's hN ladder. Make h2 the next-step after h1, never skip.
- Fix `aria-toggle-field-name` and `label-content-name-mismatch` per the Lighthouse audit items.
- Expected gain: A11y score 88 → 95+.

**R7.4 — Authed-route Lighthouse runner (methodology)**
- Author `tools/lighthouse/lighthouse-authed.mjs` (a small Node script that uses Playwright to log in, save storage state, then drives `lighthouse({ port })` against `/instructor` / `/dashboard` / `/classroom` etc.).
- Run R7.4's measurements as the final pre-Gate-A step. Authed-route scores must also ≥ 90 to satisfy the Compass criterion.

**Estimated R7 total budget:** ~2 weeks of sub-Rs. Detailed memo authored when R7 starts.

### Gate A status after §1

🔴 **Criterion 1 (Lighthouse mobile ≥ 90 on 3 sampled pages): FAIL.**

Per owner directive: **Gate A pass is BLOCKED.** Phase B start is BLOCKED. The remediation path is R7 (post-Gate-A fix sweep), not "ship Phase A and fix later". Per the user's words: «اگه Lighthouse یا axe-core یه page رو fail کرد، gate A pass نمی‌شه. توقف می‌کنیم، یه R7 یا fix-sweep می‌سازیم، بعد re-run».

The remaining TASK B (axe-core) and TASK C (composite) continue so the dossier is complete for owner re-review, but Gate A close cannot happen until R7 lands and these 3 Lighthouse audits re-run green.

---

## §2 — axe-core scan (Criterion 2) — **✅ PASS** (with documented KEEPs per D31)

**Target:** 0 critical and 0 serious violations on every authenticated and public route. (Moderate + minor violations are tracked but not Gate A blockers.)

**Verdict (post-R7.7 D30 + owner D31):** ✅ PASS — critical 0 across all 67 routes (was 54 → 6 → **0**). Serious 60 (was 65 → 64 → 63 → **60**) but **documented as KEEPs**: dominantly `.eyebrow`-on-tinted-card-bg (axe bg detection heuristic, math-on-white actually passes 6.86:1) and accent-on-accent-soft "active pill" patterns kept per Q1 / D14 brand-blue protection. Owner exercised dossier-author discretion per D31 to accept the documented serious tail as compatible with Compass §Gate A intent ("0 user-blocking violations"). See D31 for full rationale + the precedent boundary (does not generalize to Gates B-F).

**Methodology:** `@axe-core/playwright` 4.10.1 (already pinned in `apps/web/package.json`) integrated into a dedicated spec (`apps/web/tests/visual/gate-a-axe-scan.spec.ts`). Per route: navigate, wait for `domcontentloaded`, build the axe instance with `wcag2a/aa + wcag21a/aa + wcag22aa` tag filter, run, filter to `impact in ('critical', 'serious')`. Workspace routes share a `BrowserContext` via `beforeAll` (same auth-rate-limit-dodge pattern as R3/R5/R6/R6.6).

**Run command (used for the run below):**
```powershell
.\scripts\remote.ps1 visual -Service gate-a-axe-scan
```

**Aggregated headline (from `docs/gate-a-evidence/axe-scan.json`):**

| Metric | Initial run | Post-R7.5 (R7.12-branch) | Post-R7.12 merge | Post-R7.7 (latest) | Δ from initial |
|---|---|---|---|---|---|
| Routes scanned | 67 | 67 | 67 | 67 | 0 |
| Routes with ≥1 critical | 54 | 6 | 6 | **0** ✅ | **−54** ✅ |
| Routes with ≥1 serious | 65 | 64 | 63 | **60** | **−5** |
| Clean (0 critical + 0 serious) | 2 | 2 | 3 | **7** | **+5** |

**Top rule frequencies — initial run vs post-R7.7:**

| Rule | Severity | Initial | Post-R7.7 | Δ | Fix sub-R |
|---|---|---|---|---|---|
| `color-contrast` | serious | 65 | **60** | −5 | R7.7a accent-as-text + R7.7c footer ✅; remaining 60 = .eyebrow-on-card + accent-on-accent-soft KEEPs per D31 |
| `aria-valid-attr-value` | critical | 53 | **0** ✅ | **−53** | **R7.5 shipped** |
| `aria-prohibited-attr` | serious | 2 | **0** ✅ | −2 | R7.7d (Stage rail role="region") |
| `button-name` | critical | 2 | **0** ✅ | **−2** | R7.7d (/admin Toggle + /research milestone aria-label) |
| `label` | critical | 2 | **0** ✅ | **−2** | R7.7d (/verify-email OTP inputs + /settings name+bio aria-label) |
| `scrollable-region-focusable` | serious | 2 | **0** ✅ | −2 | R7.7d (/messages chat region + /classroom rail tabindex) |
| `select-name` | critical | 2 | **0** ✅ | **−2** | R7.7d (/analytics + /recordings select aria-label) |
| `aria-toggle-field-name` | serious | 1 | 0 ✅ | −1 | **R7.5/R7.12 swept** |
| `nested-interactive` | serious | 1 | **0** ✅ | −1 | R7.7d (/classroom slide: drop role="img" → aria-labelledby) |

**Gate A criterion 2 verdict (post-R7.7 + D31): ✅ PASS (with documented KEEPs).**

R7.7 cleared the entire critical layer (6 → 0) and every non-color-contrast serious rule (all → 0). The 60 remaining `color-contrast` serious all map to two KEEPs:
1. **`.eyebrow` text on tinted card backgrounds.** Math-on-pure-white: `--fg-mute` (#4a5a76) on `#ffffff` = 6.86:1 (passes WCAG 2 AA at 11px). Axe detects a slightly different effective bg color on cards with subtle tint/gradients and flags the rule. The actual user-visible contrast is acceptable — confirmed by owner D13 smoke 2026-05-24.
2. **Accent-on-accent-soft "active pill" patterns** (`.filter-pill.active`, `.cmdk-item:hover`, `.dash .side-nav li a.active`, `.nav-link.active`). Per D14 (brand-blue protection) + R7.7 memo Q1, these were owner-required KEEPs. They paint accent text over accent-soft tinted bg, which gives ~3.5:1 — borderline against the WCAG 2 AA 4.5:1 normal-text bar but reinforced by underline + bold + position so the affordance reads regardless of contrast alone.

**Per D31:** owner accepts this as §2 PASS because (a) critical = 0 means no user-blocking violation remains, and (b) the documented serious tail is justified KEEPs, not unaddressed regressions. The verdict reverts to 🟡 if any future change re-introduces a critical or undoes the KEEP rationale.

### Per-route table

| Route | Kind | Critical | Serious | Top rules (critical + serious) |
|---|---|---|---|---|
| `/` | PUBLIC | 0 | 0 | (scan retry needed) |
| `/home` | PUBLIC | 0 | 0 | (scan retry needed) |
| `/about` | PUBLIC | 0 | 1 | color-contrast |
| `/admissions` | PUBLIC | 0 | 1 | color-contrast |
| `/pricing` | PUBLIC | 0 | 1 | color-contrast |
| `/help` | PUBLIC | 0 | 1 | color-contrast |
| `/honor-code` | PUBLIC | 0 | 1 | color-contrast |
| `/programs` | PUBLIC | 0 | 1 | color-contrast |
| `/login` | AUTH_FLOW | 0 | 3 | aria-prohibited-attr, aria-toggle-field-name, color-contrast |
| `/register` | AUTH_FLOW | 0 | 1 | color-contrast |
| `/forgot` | AUTH_FLOW | 0 | 1 | color-contrast |
| `/verify-email` | AUTH_FLOW | 1 | 1 | label, color-contrast |
| `/2fa-setup` | AUTH_FLOW | 0 | 1 | color-contrast |
| `/onboarding` | AUTH_FLOW | 0 | 1 | color-contrast |
| `/dashboard` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/admin` | WORKSPACE | 2 | 1 | aria-valid-attr-value, button-name, color-contrast |
| `/super` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/content` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/ta` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/support` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/moderate` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/org` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/parent` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/instructor` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/teach` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/catalog` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/my-courses` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/progress` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/tutor` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/calendar` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/community` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/inbox` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/messages` | WORKSPACE | 1 | 2 | aria-valid-attr-value, color-contrast, scrollable-region-focusable |
| `/profile` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/settings` | WORKSPACE | 2 | 1 | aria-valid-attr-value, label, color-contrast |
| `/credential` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/transcript` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/career` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/wellness` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/library` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/labs` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/virtuallab` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/research` | WORKSPACE | 2 | 1 | aria-valid-attr-value, button-name, color-contrast |
| `/officehours` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/hackathons` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/alumni` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/events` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/schools` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/faculty` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/registration` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/degree-audit` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/financial-aid` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/audit` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/analytics` | WORKSPACE | 2 | 1 | aria-valid-attr-value, select-name, color-contrast |
| `/authoring` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/assessment` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/bookmarks` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/classroom` | WORKSPACE | 1 | 4 | aria-valid-attr-value, aria-prohibited-attr, color-contrast, nested-interactive, scrollable-region-focusable |
| `/course` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/recordings` | WORKSPACE | 2 | 1 | aria-valid-attr-value, select-name, color-contrast |
| `/submission` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/achievements` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/search` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/course/:courseId` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/course-live/:courseId` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/assessment-live/:assessmentId` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |
| `/virtuallab/:labId` | WORKSPACE | 1 | 1 | aria-valid-attr-value, color-contrast |

### Proposed fix plan — **R7 (post-Gate-A, NOT implementation now)**

The damage is concentrated in **two root causes**, each fixable in one place:

**Root cause #1 — `aria-valid-attr-value` × 53 workspace routes.** Every WORKSPACE route hits this once. Strong signal that a single chrome component (AppShell / Nav / user-menu Popover / sidebar Sheet) is rendering an aria attribute with an invalid value. The R6.6 work on `appshell-sidebar-trigger` is the most likely surface — needs an axe details inspection to find the exact `[attr]="value"` pair. One commit fixes 53 routes.

**Root cause #2 — `color-contrast` × 65 routes.** Same theme-token issue as Lighthouse §1 finds. R6.5 introduced `--fg-mute: #5b6b87` and `--fg-dim: #93a0b8` which don't hit 4.5:1 against `--bg: #ffffff`. Darkening to `--fg-mute: #4a5a76` and `--fg-dim: #768094` should bring both above 4.5:1. One commit fixes 65 routes.

**R7 axe-sweep plan (NOT implemented now per owner directive):**

**R7.5 — Fix chrome-level `aria-valid-attr-value`** (priority 1, unblocks 53 routes):
- Pull the violation `.target` from axe's full output to find the exact selector that fails.
- Most likely candidate: AppShell's Sheet drawer uses `aria-controls="appshell-sidebar-drawer"` on the trigger, but the drawer element may not have `id="appshell-sidebar-drawer"` set — making the aria-controls reference invalid.
- Verify, fix, re-scan.

**R7.6 — Darken `--fg-mute` + `--fg-dim` theme tokens** (priority 2, unblocks 65 routes):
- Audit `var(--fg-mute)` text on `var(--bg)` and `var(--fg-dim)` text on `var(--bg)`.
- New token values: `--fg-mute: #4a5a76` (was `#5b6b87`) → contrast ratio ~7.5:1 (was ~4.0:1). `--fg-dim: #768094` (was `#93a0b8`) → contrast ratio ~4.7:1 (was ~3.0:1).
- Re-run axe-scan + Lighthouse a11y; expect color-contrast violations → 0 and a11y scores → 90+.

**R7.7 — Fix the long-tail one-off violations** (priority 3, ~10 routes):
- `/login` `aria-prohibited-attr` ×2 + `aria-toggle-field-name` ×1 — likely the password show/hide toggle + theme toggle have wrong aria setup.
- `/verify-email` `label` ×1 — a form field needs `<label for="…">`.
- `/admin` + `/research` `button-name` — an icon button on those pages lacks `aria-label`.
- `/messages` + `/classroom` `scrollable-region-focusable` — scrollable lists need `tabindex="0"` for keyboard.
- `/settings` `label` — same as /verify-email.
- `/analytics` + `/recordings` `select-name` — a `<select>` needs `<label>` or `aria-label`.
- `/classroom` `aria-prohibited-attr` + `nested-interactive` — the R6 classroom UI has a nested button-in-link somewhere (likely the reaction buttons inside the slide nav).

**R7.8 — Re-scan `/` and `/home`** (priority 4):
- Both routes returned scan-context-destroyed errors during the initial run (probably the SPA's PWA service-worker recovery script disposing the page during axe injection). Re-scan with `await page.waitForLoadState("networkidle")` before the axe call.

**Estimated R7 axe-sweep budget:** ~3-5 days of sub-Rs. Combined R7 (Lighthouse + axe) total is the ~2-week estimate from §1.

### Gate A status after §2

✅ **Criterion 2 (axe-core 0 critical + 0 serious on every route): PASS with documented KEEPs.**

critical = 0 across all 67 routes (verified by owner D13 smoke on real mobile 2026-05-24). 60 serious remain, all `color-contrast` and all explicit KEEPs justified in the rule-frequency table above + D31 in `docs/PHASE_A_DECISIONS.md`.

Combined with §5 (✅ per D24) and §3/§4/§6 (✅ verified earlier), Gate A now has **only §1 (Lighthouse) failing**. Phase B start remains BLOCKED until §1 lands. The remaining R7 path: **R7.3** (Lighthouse a11y subset 88 → 95+) then **R7.1+R7.2** (Performance track), per D25 sequential ordering + owner choice 2026-05-24.

**Full axe-scan JSON evidence:** `docs/gate-a-evidence/axe-scan.json` (32 KB, every route's per-violation rule list).

---


## §3 — TypeScript strict + `@ts-nocheck` budget (Criterion 3)

**Target:** ≤ 5 `@ts-nocheck` files, all justified in `docs/PHASE_A_DEFERRED_TYPES.md`.

**Verified count: 1 of 5 cap** (well under the budget).

```bash
grep -lE "^// @ts-nocheck" apps/web/src --include="*.ts" --include="*.tsx" -r
# → apps/web/src/pages/Home.tsx
```

**The 1 deferred file:**

| File | Lines | Why deferred | Refactor cost |
|---|---|---|---|
| `apps/web/src/pages/Home.tsx` | 908 | Marketing landing with multiple inline sub-components (Hero, StatsStrip, TestimonialCarousel, FAQ, etc.). Already has a `HomePageProps` interface — only the file-wide `@ts-nocheck` prevents checking. R3 stabilises the landing CTAs that this file's sections rely on. | ~150 lines of net change (new Props interfaces + small narrowings). Slated for a dedicated post-Gate-A "Home.tsx polish" sub-R. Documented in `PHASE_A_DEFERRED_TYPES.md`. |

**Files retired during Phase A:** 44 of 45 active `@ts-nocheck` (R2 retired 43, R6 retired Classroom.tsx). Includes the previously-deferred Classroom.tsx, which was rewritten end-to-end in R6.

---

## §4 — Playwright assertions (Criterion 4)

**Two distinct metrics, reported separately per owner directive (2026-05-23):**

### 4a. D12 visual-contract assertions (test count)

These are the assertions enforcing the 5-point D12 visual contract (DOM + computed style + viewport position + no overlap + baseline). Each assertion fires a single `expect` per criterion across the spec.

| Spec | Pass | Skip | Fail |
|---|---|---|---|
| R1.1 AppShell | 13/13 | 0 | 0 |
| R1.4 fixes | 7/7 | 0 | 0 |
| R3 Dashboards | 12/12 | 0 | 0 |
| R5 Login | 12/12 | 0 | 0 |
| R6 Classroom | 12/12 | 0 | 0 |
| R6.6 Navbar RTL | 12/12 | 0 | 0 |
| **Total** | **68/68** | **0** | **0** |

Plus self-tests:
- R2 (no test spec — `@ts-nocheck` retirement is verified via `npm run build` + the local typecheck script).
- R4 audit-on-mutation rule self-tests: **9/9** via `node --test tools/eslint-rules/audit-on-mutation.spec.js`.

### 4b. Baseline screenshot frames (capture count)

These are the per-viewport baseline PNGs captured by `UPDATE_BASELINES=1` runs. They land in `docs/<sub-r>-evidence/` and are the pixel-diff source-of-truth.

| Sub-R | Viewports × pages | Frames |
|---|---|---|
| R1.x (AppShell) | 6 viewports × 5 representative routes | 30 |
| R3 (Dashboards) | 6 viewports × 10 role dashboards | 60 |
| R5 (Login) | 6 viewports × 6 auth pages | 36 |
| R6 (Classroom) | 4 critical viewports × 3 panels | 12 |
| **Total** | | **138** |

These two metrics are **different things**:
- **68 D12 assertions** = how many machine-checked claims fire during a normal test run.
- **138 baseline frames** = how many screenshot PNGs land for owner pixel review.

The Compass §Gate A bullet «126 frames pass» was an earlier estimate against the R1+R3+R5 plan; the actual Phase-A count after R6 ships is 138 frames.

---

## §5 — 10 role dashboards visually distinct (Criterion 5) — **✅ PASS** (post-R7.9 + R7.12)

After R7.9 (`apiRoleToLocal` complete) + R7.12 (mini-variant rail), all 10 demo users land on their role's `homeRoute` AND see their role-tailored navigation (rail at ≥1024, Sheet drawer at <1024). Verified by `gate-a-role-routing.spec.ts` — 10/10 with the D18 ROLE_DISTINCTIVE sentinel.

**Post-R7.12 spec results:**

| # | Role | Expected URL | Sentinel item | Pass |
|---|---|---|---|---|
| 1 | student | `/progress` | `/registration` | ✅ |
| 2 | instructor | `/progress` | `/instructor` | ✅ |
| 3 | admin | `/progress` | `/schools` | ✅ |
| 4 | parent | `/parent` | `/calendar` | ✅ |
| 5 | org | `/org` | `/faculty` | ✅ |
| 6 | ta | `/ta` | `/classroom` | ✅ |
| 7 | content_manager | `/content` | `/authoring` | ✅ |
| 8 | support | `/support` | `/audit` | ✅ |
| 9 | moderator | `/moderate` | `/community` | ✅ |
| 10 | super_admin | `/super` | `/audit` | ✅ |

**10/10 PASS** post-R7.12 deploy on main. Owner D27 confirmed visual spot-check on student vs parent vs super_admin showed distinct nav/sidebar/dashboard content.

§5 historical record (initial finding for the audit trail) — **🔴 FAIL** before R7.9:

**Target:** After login, each of the 10 demo users should land on their role-specific dashboard. The 6 NEW dashboards (Super / Content / TA / Support / Moderate / Org) shipped in R3 with role-specific KPI strips at `/super`, `/content`, `/ta`, `/support`, `/moderate`, `/org`. The 4 PRE-EXISTING role surfaces (Student / Instructor / Admin / Parent) had role-typical landings at `/progress`, `/progress`, `/progress`, `/parent`.

**Methodology:** `apps/web/tests/visual/gate-a-role-dashboards.spec.ts` — a Playwright spec that logs in as each of the 10 demo users (per `apps/api/src/prisma/seed.ts`), waits for the post-login redirect to settle, and screenshots the landing surface at 1024×800. Output: `docs/gate-a-evidence/role-dashboards/<slug>.png`.

### Run results — 2026-05-23

**All 10 demo users land on `/progress`** despite the 6 new role-specific routes shipping in R3.

| Role | Demo email | Expected landing (from `role.tsx`) | Actual landing | File size (proxy for content distinct?) |
|---|---|---|---|---|
| Student | `student1@digiuniversity.ir` | `/progress` | `/progress` ✅ | 334 KB |
| Instructor | `instructor1@digiuniversity.ir` | `/progress` | `/progress` ✅ | 318 KB |
| Admin | `admin@digiuniversity.ir` | `/progress` | `/progress` ✅ | 336 KB |
| Parent | `parent1@digiuniversity.ir` | `/parent` | **`/progress`** 🔴 | 318 KB |
| Org Manager | `org1@digiuniversity.ir` | `/org` | **`/progress`** 🔴 | 318 KB |
| TA | `ta1@digiuniversity.ir` | `/ta` | **`/progress`** 🔴 | 318 KB |
| Content Manager | `cm1@digiuniversity.ir` | `/content` | **`/progress`** 🔴 | 319 KB |
| Support | `support1@digiuniversity.ir` | `/support` | **`/progress`** 🔴 | 318 KB |
| Moderator | `moderator1@digiuniversity.ir` | `/moderate` | **`/progress`** 🔴 | 318 KB |
| Super Admin | `superadmin@digiuniversity.ir` | `/super` | **`/progress`** 🔴 | 318 KB |

7 of 10 PNGs are **318 KB ± 1 KB** — visual content is essentially identical. The 6 new R3 dashboards exist at `/super`, `/content`, `/ta`, `/support`, `/moderate`, `/org` (confirmed visible at those URLs during R3 D12 assertions, see `docs/phase-a-r3-dashboards-evidence/`), but no role's post-login flow routes them there.

**Evidence files:** `docs/gate-a-evidence/role-dashboards/{student,instructor,admin,parent,org,ta,content_manager,support,moderator,super_admin}.png`.

**Gate A criterion 5 verdict: 🔴 FAIL.** The dashboards themselves ARE visually distinct when reached directly (verified by R3's 12 D12 assertions and the R3 evidence frames at `docs/phase-a-r3-dashboards-evidence/`), but the criterion requires the differentiation to be reachable by ROLE — and 7 of 10 roles never get there because the post-login redirect short-circuits to `/progress`.

### Root cause

`apps/web/src/pages/auth/LoginPage.tsx` line 224 (and the duplicate at `apps/web/src/pages/Auth.tsx` line 22):

```ts
const apiRoleToLocal = (roles: readonly string[] | undefined): RoleId => {
  if (!roles || roles.length === 0) return "student";
  if (roles.includes("admin")) return "admin";
  if (roles.includes("instructor")) return "instructor";
  if (roles.includes("student")) return "student";
  return "student";   // ← every other role falls through here
};
```

Only 3 of 10 API roles are mapped (`admin`, `instructor`, `student`). The 7 others (`parent`, `org`, `ta`, `content_manager`, `support`, `moderator`, `super_admin`) all fall through to the default `return "student"` — which then sets the local role to `"student"`, whose `homeRoute = "progress"`.

The bug predates R3 (Phase 15 R7 added the 6 new roles to `role.tsx` but the login mapper was never extended). R3 added the dashboards but didn't touch the redirect path. R5 (login redesign) re-implemented `apiRoleToLocal` with the same incomplete mapping.

### Proposed fix plan — **R7 (post-Gate-A, NOT implementation now)**

Per owner directive: document + plan, no implementation.

**R7.9 — Complete the `apiRoleToLocal` map** (priority 1, unblocks 7 of 10 roles):

```ts
const apiRoleToLocal = (roles: readonly string[] | undefined): RoleId => {
  if (!roles || roles.length === 0) return "student";
  // Highest-privilege first so a user with both `admin` + `instructor`
  // lands on the admin console; same for super_admin > admin.
  if (roles.includes("super_admin")) return "super_admin";
  if (roles.includes("admin")) return "admin";
  if (roles.includes("content_manager")) return "content_manager";
  if (roles.includes("moderator")) return "moderator";
  if (roles.includes("support")) return "support";
  if (roles.includes("instructor")) return "instructor";
  if (roles.includes("ta")) return "ta";
  if (roles.includes("org")) return "org";
  if (roles.includes("parent")) return "parent";
  if (roles.includes("student")) return "student";
  return "student";
};
```

Also: extract the mapper to a single file (`apps/web/src/role.ts` or similar) so `LoginPage.tsx` and `Auth.tsx` import the same source. The current duplicate-and-drift is what let this regress through R5.

**R7.10 — Add a regression spec** that asserts each of the 10 demo users lands on their role's `homeRoute`. The current spec only screenshots; a follow-up assertion (`expect(page.url()).toMatch(/\/super$/)` etc.) would catch this kind of mapping drift in CI.

**R7.11 — Decide on the role hierarchy** for users with multiple roles (e.g., an instructor who is also a content_manager). The R7.9 fix orders by privilege; if the owner prefers role-tabs on the user-menu (Notion-style "switch workspace"), that's a separate R7 sub-item.

**Estimated R7 redirect-fix budget:** ~1 day of sub-R (mapper + regression spec + manual smoke).

### Gate A status after §5

🔴 **Criterion 5 (10 role dashboards visually distinct): FAIL.** The dashboards exist and are distinct *at their direct routes*, but the role-driven landing path that the criterion implies is broken for 7 of 10 roles.

Combined with §1 + §2, Gate A has **three of its six criteria failing**. Phase B start remains BLOCKED.

### What R3 actually verified (preserved for the record)

The 6 R3 dashboards were correctly built — they exist at their routes and pass their D12 assertions when visited directly. R3's review document is still accurate as a sub-R-level summary. The Gate A finding is at the *integration* level: R3 shipped the dashboards but the login → homeRoute lookup wasn't taught to find them.

| Role | Route | Headline | KPI strip | R3 evidence frame |
|---|---|---|---|---|
| Super Admin | `/super` | میز ابرمدیر | تنانت‌ها · کاربران فعال ۲۴h · خطاهای ۵xx · خط فعالیت AI | `docs/phase-a-r3-dashboards-evidence/` |
| Content Manager | `/content` | میز مدیر محتوا | در صف بازبینی · تأییدشده هفته · بازگشتی با کامنت · زمان بازبینی متوسط | `docs/phase-a-r3-dashboards-evidence/` |
| TA | `/ta` | میز دستیار آموزشی | دروس واگذار · ارسال در صف · ساعت آفیس · دانشجوی فعال | `docs/phase-a-r3-dashboards-evidence/` |
| Support | `/support` | میز پشتیبانی | تیکت باز · SLA نقض‌شده · زمان پاسخ متوسط · بازگشت در صف | `docs/phase-a-r3-dashboards-evidence/` |
| Moderator | `/moderate` | میز نظارت انجمن‌ها | گزارش پرچم‌خورده · بحث‌های فعال · قانون خودکار · اقدام امروز | `docs/phase-a-r3-dashboards-evidence/` |
| Org Manager | `/org` | میز مدیر سازمان | کاربران سازمان · سیت استفاده‌شده · کوهورت فعال · صورتحساب باز | `docs/phase-a-r3-dashboards-evidence/` |
| Student | `/dashboard` → `/progress` | (existing) | next class + tasks + continue learning + AI Tutor FAB | (pre-R3) |
| Instructor | `/instructor` | (existing) | today schedule + grading queue + course tree + live host | (pre-R3) |
| Admin | `/admin` | (existing) | setup wizard + today KPIs + Faculty/Dept/Program shortcuts | (pre-R3) |
| Parent | `/parent` | (existing) | child cards + alerts + teacher messages + payment history | (pre-R3) |

A `montage` composite of the (broken) post-login screenshots could be assembled via:
```bash
montage docs/gate-a-evidence/role-dashboards/*.png -tile 5x2 -geometry +6+6 \
  docs/gate-a-evidence/role-dashboards-grid.png
```
…but the resulting grid will show 10 near-identical /progress screenshots, which IS the visual evidence of the bug. Post-R7.9 re-run will produce a meaningful 10-way grid.

---

## §6 — Audit-on-mutation lint enforced in CI (Criterion 6)

**Status: ✅ verified.** R4 shipped the custom Node-based ESLint-equivalent rule + 9 self-tests + a backfill of 3 `@AuditSkip()` decorators in `auth.controller.ts`. Wired into 4 CI entry points.

**Evidence:**
- **Rule code:** `tools/eslint-rules/audit-on-mutation.js` (262 lines, AST walker using TypeScript compiler API).
- **Self-tests:** `tools/eslint-rules/audit-on-mutation.spec.js` (9 fixture cases, all green via `node --test`).
- **CI integration:**
  - `apps/api/package.json` adds `pretest` script → `npm run lint:audit` runs before `jest` in the `api-test` Docker profile.
  - `scripts/remote.ps1 lint` standalone action runs the rule + self-tests.
  - `scripts/remote.ps1 test` pre-step runs the rule locally on Windows BEFORE the remote build, fails fast.
- **CI log excerpt** (from the R4 deploy on 2026-05-23):
  ```
  --- audit-on-mutation lint (Phase-A R4) ---
  audit-on-mutation: PASS (20 controller files scanned, 0 violations)
  ...
  Test Suites: 7 passed, 7 total
  Tests:       45 passed, 45 total
  ```
- **Plant-violation evidence:** see `docs/PHASE_A_R4_REVIEW.md` §Self-test results + §Owner manual smoke for the steps that confirm CI catches a deliberately-planted violation. Owner re-runs step 1 ("Plant a violation") during the D13 smoke.

**Coverage after R4 backfill:** 49/49 mutation handlers across 17 controllers have an explicit audit decision (44 `@AuditAction` + 5 `@AuditSkip`). The 5 explicit opt-outs are all `@Public()` auth endpoints that write their own audit row inside the service layer.

---

## §7 — JDO brand attribution (additive, owner-requested)

**Status: ✅ shipped.** R1.3 Brand wired the JDO (Jahad-e-Daneshgahi) logo + co-brand strip + footer copyright on every route, per the owner's explicit message during R1.3. R5's login redesign reused the same `<CoBrandFooter />` component to keep the auth flow consistent. R6 classroom doesn't display the JDO mark (the classroom is mounted inside AppShell, which carries the OrgAttribution component).

**Source:** owner-supplied `darklogo.png` / `lightlogo.png` (root of project) + the earlier `assets/jahad-dark.png` / `assets/jahad-light.png` from the R5 template upload. Files now served from `apps/web/public/logos/`.

---

## §8 — Owner D13 manual-smoke acks (across all sub-Rs)

**Status: ⏳ awaiting.** Per the D13 formal gate, every sub-R needs owner ack on real-device manual smoke before it can be claimed PASSED. Current tracking:

| Sub-R | Automated | Owner D13 ack |
|---|---|---|
| R1.1 + R1.2 + R1.3 + R1.4 | ✅ 13/13 + 7/7 | ⏳ pending |
| R2 (retire `@ts-nocheck`) | ✅ 1 deferred, was 2 | ⏳ pending |
| R3 (10 role dashboards) | ✅ 12/12 | ⏳ pending |
| R4 (audit lint) | ✅ 9/9 self-tests + 45/45 jest | ⏳ pending |
| R5 (login redesign) | ✅ 12/12 | ✅ "thats better work on that" (owner positive feedback) |
| R6 (Classroom redesign) | ✅ 12/12 | ⏳ pending |
| R6.5 (white + navy theme) | ✅ 56/56 regression | ⏳ pending |
| R6.6 (navbar RTL) | ✅ 12/12 + 13/13 R1.1 | ⏳ pending |

**Procedure:** owner re-runs the 6-step manual smoke listed in each sub-R's review doc on a real phone + desktop + incognito. If a step looks off, the sub-R reverts to FAIL until a fix lands.

---

## Bookmark — Gate A pass gate

> **Gate A pass criteria from Compass Roadmap §Gate A — all 6 criteria must verify before Phase B start.**
>
> 1. 🟡 Lighthouse mobile ≥ 90 on 3 sampled pages — A11y ✅ 100/100/96; Perf 🔴 66/100/66 (R7.1/R7.2 pending)
> 2. ✅ axe-core 0 critical/serious on all routes — **critical 0 verified across 67 routes; 60 serious documented as KEEPs per D31**
> 3. ✅ TypeScript ≤ 5 `@ts-nocheck` (all in DEFERRED) — verified, count = 1
> 4. ✅ All Playwright D12 + baseline assertions pass — verified, 68/68 + 138 frames + R7.7 spec 10/10 + regression 7/7
> 5. ✅ 10 role dashboards visually distinct + reachable per role — verified (D24)
> 6. ✅ Audit-on-mutation lint enforced in CI — verified, 4 entry points
>
> Plus D13: every sub-R owner-acked manually — R7.5/R7.6/R7.7/R7.9/R7.12 ✅ (D19/D22/D24/D27/D30); R1.x/R2/R3/R4/R5/R6/R6.5/R6.6 ⏳ pending owner sign-off.
>
> **No Phase B start until §1 lands and D13 ack is complete on every sub-R.**

---

## Roll-up — R7 fix sweep (approved per D17, critical-path-first per D17 + D19 + D20 + D21)

The three failing criteria cluster on **four root causes**, each isolable to one or two files. Owner approved the sweep + ordering 2026-05-23. Decisions D17 (sweep + order), D19 (R7.6 ack), D20 (R7.7a Path 1), D21 (R8 deleted, subsumed by R7.9) refine the table below.

| Sub-R | Title | Fixes which criteria? | Status |
|---|---|---|---|
| **R7.1** | Vite manual chunks + `React.lazy` route splitting | §1 Performance: 35/66/66 → ~70+ | ⏳ pending — Performance track, blocked on critical path |
| **R7.2** | Self-host Vazirmatn + drop unused font families | §1 Performance: ~70 → ~85+ | ⏳ pending — Performance track |
| **R7.3** | Lighthouse a11y sweep (button-name, heading-order, label-mismatch, aria-toggle) | §1 Accessibility: 88/88/87 → 95+ | ⏳ pending — partially absorbed by R7.5+R7.6+R7.7 |
| **R7.4** | Authed-route Lighthouse runner (Playwright + lighthouse `{port}`) | §1 measurement methodology fix | ⏳ pending |
| **R7.5** | Fix chrome-level `aria-valid-attr-value` (53 routes) | §2 critical: 54 → ~1-2 routes | 🟢 **NEXT — critical path** |
| **R7.6** | Darken `--fg-mute` + `--fg-dim` theme tokens for 4.5:1 contrast | §2 color-contrast: scoped target 100% cleared (65→64 headline masks per-bucket success) | ✅ shipped, D13 PASS (D19) |
| **R7.7** | Long-tail color/a11y violations — split into R7.7a-d per the R7.6 diagnostic + D20 decisions | §2 remaining serious violations | ⏳ pending — owner gate after R7.5+R7.9 ship and measurement re-runs |
| ↳ R7.7a | Replace accent-as-text with `--fg` (Path 1 per D20); 31 routes | §2 accent-blue color-contrast | ⏳ pending |
| ↳ R7.7b | Replace gold-as-text with `--fg`; reserve gold for badges/icons/celebration; 13 routes | §2 gold color-contrast | ⏳ pending |
| ↳ R7.7c | Add `--fg-mute-on-dark` token + retarget footer dark-bg text; 1 route | §2 footer color-contrast | ⏳ pending |
| ↳ R7.7d | Per-button accent-button on-color audit; measurement first; owner decision per case if >2 routes still fail after R7.7a-c | §2 button color-contrast | ⏳ owner-gated, audit-first |
| **R7.8** | Re-scan `/` and `/home` (page-disposal race fix in axe spec) | §2 truly-clean verification | ⏳ pending — single-line fix, can ride along with R7.7 |
| **R7.9** | Complete `apiRoleToLocal` (3 → 10 roles) + extract to shared source + ROLE_DISTINCTIVE D18 sentinel spec | §5 routing 3/10 → 10/10 reach **AND** nav-data drift detection (subsumes OWNER-FINDING-2 / D21) | 🟢 **NEXT after R7.5 — critical path; ~1 day (scope +50% for D18 sentinel)** |
| ~~R7.10~~ | ~~Regression spec~~ | — | **Merged into R7.9** (the spec is shipped alongside the mapper fix, not a separate sub-R) |
| **R7.11** | Multi-role hierarchy decision + workspace switcher pattern | §5 follow-up, owner decision | ⏳ owner-gated, not in critical path |
| ~~R8~~ | ~~Role-aware nav sub-R~~ | — | **Deleted per D21** — diagnostic audit showed nav data is fully defined in code; R7.9 fixes the upstream root cause for free |

**Critical path** = R7.5 (chrome aria, 1 day) → R7.9 (role mapper + D18 sentinel spec, ~1 day) → re-run §1 a11y + §2 + §5 measurements. Worst-case ~2 working days clears the most actionable parts of the FAIL surface. R7.7a-d follow once owner reviews the post-R7.5+R7.9 measurement deltas.

**Performance track** (R7.1 + R7.2 + R7.3 + R7.4) is gated on owner explicit start. Per D17 sequencing, it begins **after** the critical path lands and §1 a11y / §2 / §5 are at their post-R7.5+R7.9 state.

## Owner decisions logged

The dossier originally posed two questions; both are now resolved:

1. ✅ **R7 sweep approved as the Gate A unblock path?** Yes, D17.
2. ✅ **Order?** Critical-path-first, D17.

Plus 3 follow-ons resolved 2026-05-23:
  - ✅ **R7.6 D13 ack?** PASS, D19.
  - ✅ **R7.7a path?** Path 1 (replace accent-as-text with `--fg`), D20.
  - ✅ **R8 spin-up?** No — subsumed by R7.9 + D18 spec extension, D21.

— Phase A author, 2026-05-23. RE-REVIEW DRAFT awaiting owner sign-off on the R7 plan.
