# Phase A Landing Redesign — Memo (PHASE 2)

## Header — approved decisions

- **D37** Landing redesign URGENT pivot (2026-05-24).
- **D38** Home-only scope confirmed; 26 other template pages ignored; scoped via `.home-shell-v2` wrapper class. All 7 Q-AUDIT answers logged.
- **Audit:** `docs/PHASE_A_LANDING_AUDIT.md` (commit `83dacbb`).
- **Pause:** R7.1+R7.2 resume PAUSED until after this sub-R + D13 ack.
- **Workflow gate:** «memo بنویس، owner ack بگیر، code بزن» — this memo, then owner ack, then code.

## Goal — single sentence

Replace the `apps/web/src/pages/Home.tsx` skin with the template's «University Press — Minimal Academic» aesthetic (off-white paper + ink black + oxford blue), scoped via a `.home-shell-v2` wrapper class so all global tokens (R6.5 white+navy palette, R7.6 darkened tokens, R7.7 a/b/c/d a11y fixes) stay intact for every other route in the SPA.

## Sub-R name

**R-Landing** (no number; this is its own sub-R, paused R7.1+R7.2 resume queued after).

## File plan

| File | Operation | Approx lines |
|---|---|---|
| `apps/web/src/pages/Home.tsx` | **Rewrite** — port template's `Home.jsx` structure into TypeScript. Wrap in `<div className="home-shell-v2">`. Retire `@ts-nocheck` (typed shape: HomePageProps `{ go: Go }` already in place per existing file; the rest is internal). | ~700 lines (template Home.jsx is 29 KB → ~600 lines of JSX + ~50 helper components + ~50 lines comments) |
| `apps/web/src/pages/home-v2.css` (new) | **New file.** All template `styles.css` rules that apply to landing scope, with selectors prefixed `.home-shell-v2 …` where they're not already on a landing-specific class. Token block defines `--xxx-home` custom properties. | ~600-700 lines (subset of the 99 KB template CSS that actually applies to Home; estimate ~50-60% of total) |
| `apps/web/src/main.tsx` | **Modify** — add `import "./pages/home-v2.css"` after the existing styles.css import. CSS cascade ensures `.home-shell-v2` overrides only inside its wrapper. | +1 line |
| `apps/web/src/icons.tsx` | **Possibly modify** — verify all icons used by template Home.jsx are already present; add any new ones via small additive change. Audit step during code phase. | +0 to +30 lines |
| `apps/web/src/motion.tsx` | **No change.** Template's `motion.jsx` has same `useReveal` + `Stagger` + `useMouseParallax` API as current; we keep current implementation. | 0 |
| `docs/PHASE_A_DEFERRED_TYPES.md` | **Modify** — remove Home.tsx entry. R-Landing retires it as baked-in. | -2 to -5 lines |
| `apps/web/tests/visual/phase-a-landing.spec.ts` (new) | **New spec.** 6 viewports × 1 page = 6 frames. D12 5-point contract. | ~150 lines |

**Total: ~1450-1600 lines added, ~5 lines removed.** Above the standard 300-line cap, but a single visual-redesign sub-R legitimately needs this surface (the audit's Option A budget estimate was 400-600; reality is higher because the template's Home is a full marketing page with many sections). Owner accepted this scope shape via D38; not splitting further to keep the redesign atomic.

## Token plan (scoped via `.home-shell-v2`)

```css
.home-shell-v2 {
  /* surfaces — warm off-white paper */
  --bg-home: #fafaf5;
  --bg-deep-home: #f0eee5;
  --surface-home: #ffffff;
  --surface-2-home: #f4f3ee;
  --surface-3-home: #e8e6dd;
  --line-home: rgba(13, 13, 13, 0.08);
  --line-2-home: rgba(13, 13, 13, 0.16);

  /* ink — true deep black with subtle warmth */
  --fg-home: #0d0d0c;
  --fg-mute-home: #4a4a48;
  --fg-dim-home: #8a8884;

  /* accent — single oxford blue */
  --accent-home: oklch(0.34 0.13 255);
  --accent-2-home: oklch(0.28 0.14 256);
  --accent-soft-home: oklch(0.95 0.025 255);
  --accent-dim-home: oklch(0.65 0.08 255);
  --accent-on-home: #fafaf5;

  /* secondary — muted gold (template's --navy back-compat slot) */
  --gold-amber-home: oklch(0.55 0.12 75);

  /* tertiary — deep forest */
  --sage-home: oklch(0.4 0.08 155);

  /* alert — muted brick (template's --gold semantic) */
  --gold-home: oklch(0.5 0.16 30);
  --gold-soft-home: oklch(0.94 0.04 30);

  /* shadows */
  --shadow-1-home: 0 1px 0 rgba(13,13,13,0.04), 0 1px 2px rgba(13,13,13,0.04);
  --shadow-2-home: 0 1px 0 rgba(13,13,13,0.04), 0 16px 40px -16px rgba(13,13,13,0.12);
  --shadow-paper-home: 0 1px 0 rgba(13,13,13,0.04), 0 1px 3px rgba(13,13,13,0.05), 0 18px 48px -24px rgba(13,13,13,0.14);

  /* radii */
  --r-sm-home: 3px;
  --r-home: 6px;
  --r-lg-home: 10px;
  --r-xl-home: 14px;

  /* the wrapper also remaps the GLOBAL tokens TO the home tokens so
     template CSS rules that reference `var(--bg)`, `var(--fg)`, etc.
     resolve to home values WITHOUT being rewritten one-by-one: */
  --bg: var(--bg-home);
  --bg-deep: var(--bg-deep-home);
  --surface: var(--surface-home);
  --surface-2: var(--surface-2-home);
  --surface-3: var(--surface-3-home);
  --line: var(--line-home);
  --line-2: var(--line-2-home);
  --fg: var(--fg-home);
  --fg-mute: var(--fg-mute-home);
  --fg-dim: var(--fg-dim-home);
  --accent: var(--accent-home);
  --accent-2: var(--accent-2-home);
  --accent-soft: var(--accent-soft-home);
  --accent-dim: var(--accent-dim-home);
  --accent-on: var(--accent-on-home);
  --gold: var(--gold-home);
  --gold-soft: var(--gold-soft-home);
  --navy: var(--gold-amber-home);  /* template's "navy" slot is muted gold */
  --sage: var(--sage-home);

  /* fonts — same as global, no remap needed */
}
```

**Why the global-token remap inside the wrapper:** the template's CSS uses `var(--fg)`, `var(--accent)`, etc. directly. Re-prefixing every reference to `var(--fg-home)` would mean rewriting ~600 lines of CSS. The remap inside `.home-shell-v2` makes ALL `var(--fg)` references inside the wrapper resolve to home values automatically. Outside the wrapper, the globals stay at R6.5 values. **Zero risk of leakage** because CSS variable cascade is scope-bound to the element subtree.

## JSX structure plan

Port template's `Home.jsx` (29 KB) to TypeScript with:

1. **Outer wrapper:** `<div className="home-shell-v2">…</div>` around everything the page renders (except the global `<AppShell>` chrome which lives above HomePage in the router).
2. **Hero:** `<section className="hero">` + auroras + headline (template text verbatim) + 3D card cluster + stats — per template structure.
3. **AGENT ARCHITECTURE section** — 5 pillars with `.reveal` + `.stagger` IntersectionObserver hooks (existing `motion.tsx` API).
4. **TrustStrip** — partner logos as inline SVG.
5. **StatsBand** — animated stat row.
6. **FacultyShowcase** — instructor cards.
7. **CatalogTeaser** — featured courses.
8. **Testimonials** — student quotes.
9. **AGENT graph + Architecture stack** — KnowledgeGraph + ArchStack components (already in `shared.tsx`).
10. **Footer** — uses existing `<Footer go={go} />` from `shared.tsx` (no template Footer port — the global Footer stays at R6.5 navy palette per D38 scoping).

**Auth-redirect behavior preserved:** the existing post-Phase-16-R2 logic that bounces logged-in users to `/dashboard` stays. The new design's hero is what anonymous users see.

**TypeScript shape:**
```ts
interface HomePageProps { go: Go }
export const HomePage: React.FC<HomePageProps> = ({ go }) => {
  const auth = useAuth();
  React.useEffect(() => { if (auth.isAuthenticated) go("dashboard"); }, [auth.isAuthenticated, go]);
  useMouseParallax();
  if (auth.isAuthenticated) return <AuthLoadingSkeleton />;
  return (<div className="home-shell-v2"><main data-screen-label="01 خانه">…</main></div>);
};
```

Helper components (Hero3DClassroom, Hero3DTutor, Hero3DAnalytics, Hero3DCredential, TrustStrip, StatsBand, FacultyShowcase, CatalogTeaser, Testimonials) stay as local components inside the file, typed with their explicit prop interfaces. **No `@ts-nocheck`.**

## Animation plan (per Q-AUDIT-4 owner ack)

- Keep template's `title-rise`, `card-fade-in`, `aurora-drift` keyframes.
- Add `@media (prefers-reduced-motion: reduce)` override that disables all 3 animations (consistent with the existing `motion.tsx` reduced-motion respect).
- **Performance note carried to review doc:** R7.1.1 dropped these animations because of a TBT regression. The new palette + scoped CSS may behave differently; re-measurement post-deploy is part of the review. If TBT spikes again, owner decides (in the R7.1+R7.2 resume sub-R) whether to drop them again.

## RTL plan

- Template already has `dir="rtl"` on `<html>` (the production app sets the same).
- Audit sampled CSS shows mostly logical properties already (`margin-inline-*`, `padding-inline-*`). Sampled `.nav-link` uses `left/right` — but `.nav-link` is the global Nav (NOT inside the home wrapper), so it's the R6.6-tuned global Nav, no change needed.
- During port, every `margin-left` / `margin-right` / `padding-left` / `padding-right` / `left:` / `right:` inside scoped CSS gets converted to the logical equivalent (`margin-inline-start/end`, etc.) per R6.6-D15.

## Asset port

- **Zero image files** in the template. All visuals are inline SVG (via the template's `icons.jsx`) + CSS gradients + CSS-only shapes.
- During port, audit `apps/web/src/icons.tsx` against template's `icons.jsx`:
  - If an icon name used by Home.jsx is missing from production `icons.tsx`, **add it** (additive change to existing icons file).
  - If an icon exists with a different path (template version is newer), **keep production version** unless owner explicitly says otherwise — the template's icon shapes might be incidental.
- Document any icon additions in the review doc.

## Backend wire — none

The new Home is a read-only marketing page. **No new API endpoints, no new mock data files.** Template's "stats" (8 faculties, 248 programs, 94 instructors, 8400 students) are HARDCODED in the template's `<Stat>` calls; carry them over verbatim per Q-AUDIT-3. If owner later wants real numbers, that's a Phase B follow-on.

## Tests

### New spec: `apps/web/tests/visual/phase-a-landing.spec.ts`

D12 5-point contract assertions per the 6-viewport matrix (320 / 375 / 768 / 1024 / 1280 / 1440):

1. **DOM:** `.home-shell-v2` outer wrapper renders. `.hero` is the first section. CTA buttons exist with text «درخواست پذیرش» + «دانشکده‌ها و برنامه‌ها».
2. **Computed style:** `<body>` font-family contains "Vazirmatn"; `.home-shell-v2` computed `background-color` is `#fafaf5`; `.hero-title` computed `color` is `#0d0d0c`.
3. **Viewport position:** at 1024px+, hero is full-viewport above the fold. At 320-767px, CTA buttons stack vertically.
4. **No overlap:** the 3D card cluster doesn't overlap the headline at the 1024+ breakpoint.
5. **Baseline:** Playwright `toHaveScreenshot` baseline per viewport, 0.1% tolerance.

### Logical-CSS verification

Spec assertion: search `apps/web/src/pages/home-v2.css` for `margin-left` / `margin-right` / `padding-left` / `padding-right` / lone `left:` / `right:` — expect **zero matches** (all converted to logical equivalents).

### Animation defined check

Spec assertion: `keyframes` `title-rise`, `card-fade-in`, `aurora-drift` are defined in the computed stylesheet. (Not checking actual run; just presence.)

## Regression scope

Per scoped change shape, expected impact on existing specs:
- **R1.1 appshell** (Home renders through AppShell chrome) — expect green. Existing R1.1-D10 skip-link Tab focus quirk persists (environmental, documented).
- **R3 dashboards** — untouched, expect green.
- **R5 login** — untouched, expect green.
- **R6 classroom** — untouched, expect green.
- **R6.6 navbar RTL** — Nav stays at R6.5 palette (outside the home wrapper), expect green.
- **R7.7 a11y-sweep** — touched only `/admin`, `/research`, `/verify-email`, `/settings`, `/analytics`, `/recordings`, `/messages`, `/classroom`. None of these are inside the home wrapper. Expect green.
- **R7.12 mini-rail** — workspace-only, expect green.
- **gate-a-role-routing** — D32 flake persists; if it fires, ignore per D32 policy.
- **gate-a-axe-scan** — Home is `/` route. Expect 0 critical (must hold). Serious tail may shift (template uses oxford blue + ink black + warm paper which has DIFFERENT contrast math than the existing white+navy). If serious increases significantly, that's documented in the review.

## D29 pre-smoke plan

Per the standing D29 policy (Claude Code Chrome Extension on owner laptop):

**Automated steps** (Claude does):
1. Navigate to `https://digiuniversity.ir/` on owner laptop's Chrome.
2. Capture screenshot at viewport 1440×900 (desktop).
3. Resize to 1024×768, capture.
4. Resize to 768×1024, capture.
5. Resize to 375×667, capture.
6. DevTools: check console for errors.
7. DevTools: check Network for any failed asset loads.
8. Tab through the page once — confirm focus order moves through hero CTAs.
9. Click «درخواست پذیرش» CTA — confirm navigation to `/admissions`.
10. Click «دانشکده‌ها و برنامه‌ها» CTA — confirm navigation to `/schools`.

**Pass criteria:**
- No console errors.
- No failed network requests for static assets.
- All 4 viewports render hero + sections in expected order.
- CTAs work.
- Visual: warm paper background (NOT pure white), ink-black text (NOT navy), oxford-blue accents.

**Fail handling (per D29):**
- Silent fix + re-run, max 3 attempts.
- If 3 attempts fail: ping owner with screenshots + diagnosis.

**If Chrome Extension NOT connected:** the visual spec covers most of the contract; D29 pre-smoke deferred to a manual owner pre-check before D13. Document this in review.

## D13 owner smoke (real mobile + incognito + hard reload)

1. Open `https://digiuniversity.ir/` in mobile Safari/Chrome incognito + hard reload.
2. Visual check: warm off-white paper background, ink-black text, oxford-blue accents. NOT the navy/white aesthetic of workspace.
3. Scroll through all sections — animations smooth (no jank).
4. Tap «درخواست پذیرش» — navigates to `/admissions` (workspace palette: navy/white).
5. Back to `/` — confirms scoped CSS holds across navigation.
6. Visit `/login` — confirm login page is STILL the R5 design (navy/white), NOT the new oxford-blue. (Confirms scoping.)
7. Visit any workspace route after login — confirm WORKSPACE chrome is unchanged.
8. Spot-check responsive breakpoints by rotating + resizing.

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| **R1 — Token remap inside `.home-shell-v2` leaks via inherited styles** | Low | CSS custom properties are scope-bound to the element subtree. Outside the wrapper, globals resolve as before. Verified by spec assertion on `/login` (R5 design preserved). |
| **R2 — Template CSS conflicts with global rules of same name (`.btn-primary`, `.nav-link`, etc.)** | Medium | Solution: prefix template CSS selectors with `.home-shell-v2` so they only apply inside the wrapper. Specificity is higher than the global rule (which is just `.btn-primary`). Existing R6.5 global rules survive. |
| **R3 — Hero animations cause TBT regression similar to R7.1.1** | Medium | Carry over per Q-AUDIT-4 owner ack. Note delta in review. Owner decides in R7.1+R7.2 resume whether to drop. |
| **R4 — axe contrast on oxford-blue + ink-black + warm paper may flag NEW critical** | Low | Re-run axe-scan post-deploy. If critical re-introduced on `/`, that's a hard block (D31 §2 verdict requires critical=0). Mitigation: contrast math on oxford-blue oklch(0.34 0.13 255) text on `#fafaf5` is ~9.1:1 (AAA at 14px+) — well above threshold. Math suggests this is safe. |
| **R5 — Workspace ↔ Home palette mismatch is visually jarring** | Acceptable | This is the owner's explicit choice (D38). Document in review for completeness. |
| **R6 — Hero `<p>` text becomes LCP element; oxford-blue accents not on LCP path** | Low | Lighthouse will track the new LCP target. Re-measure post-deploy; if LCP regresses, that's part of the R7.1+R7.2 resume work, not a R-Landing fix. |
| **R7 — Retiring `@ts-nocheck` surfaces type errors** | Medium | Mitigation: rewrite is from-scratch with explicit interface for HomePageProps + each helper component. Type ALL useState generics. Audit all `useEffect` deps. Surface any errors and fix in-line. |
| **R8 — Bundle size grows from added scoped CSS** | Low | ~600-700 lines of CSS gzip to ~10-15 KB. The R7.1 vite manualChunks + R7.2 font self-host bundle wins ($-143 KiB main bundle from 241→98 gzip$) absorb this easily. |
| **R9 — Visual baseline reset for R1.1 / R3 / etc. specs that touch the Home route** | Low | Verify with spec re-run. R1.1 doesn't snapshot Home content; it snapshots chrome elements. R3 dashboards don't touch Home. None of the regression suite snapshots Home content itself — only chrome. |
| **R10 — Mobile viewport at 320px not explicitly handled by template** | Medium | During port, verify 320px renders cleanly. Template's narrowest media query was 480px (sm); we add a 320 fallback if needed. |

## Verification flow

1. Commit + push the R-Landing code.
2. `.\scripts\remote.ps1 up` — clean boot.
3. `.\scripts\remote.ps1 logs` — no errors.
4. `.\scripts\remote.ps1 visual -Service phase-a-landing` — new spec passes (6/6 PASS).
5. `.\scripts\remote.ps1 visual -Service gate-a-axe-scan` — re-run, verify critical=0 on `/` route.
6. Lighthouse on `/` mobile (single run, then 3-run variance if median <85).
7. Run regression sweep via `scripts/r7-7-regression.ps1` — expect all green except known role-routing rate-limit flake.
8. **D29 pre-smoke** via Chrome Extension (if connected) — silent-fix up to 3 attempts.
9. Write `docs/PHASE_A_LANDING_REVIEW.md` with: per-section parity tables, axe + Lighthouse deltas, regression results, pre-smoke evidence (if extension connected), known follow-on for R7.1+R7.2 resume (font + TBT decisions).
10. Update `docs/PHASE_A_DEFERRED_TYPES.md` — remove Home.tsx entry.
11. **STOP** + ping owner for D13 manual smoke per directive.

## After D13 ack

- Log Landing-D39 (R-Landing D13 PASS).
- Resume R7.1+R7.2 (currently paused per D37). Font list re-evaluation per template — fonts didn't actually change, so the existing `@fontsource` setup stays.
- Re-measure Lighthouse on `/`, `/login`, `/programs` — confirm §1 verdict hasn't degraded.
- If §1 still 🟡 partial-with-variance, the close-memo D36 decision (Path A accepted) remains valid.

## What's NOT in R-Landing scope

- **Other template pages (Programs, Auth, Classroom, etc.)** — explicitly ignored per Q-AUDIT-1 + D38 owner clarification.
- **Backend changes** — landing is read-only.
- **Phase B work (B.1c CRUD, B.2 CourseOffering)** — paused pending this sub-R.
- **R7.1+R7.2 chunks + font self-host** — already shipped; no change.
- **R7.1.1 animation drop** — its global effect remains for workspace. Home's wrapper RE-INTRODUCES the template animations inside scope; review documents whether TBT regresses for the R7.1+R7.2 resume to decide.

## Standing instruction

«**memo بنویس، owner ack بگیر، code بزن. سوال نپرس مگر اینکه واقعاً block ـه.**»

This memo is committed. **No code until owner ack.** The 7 Q-AUDIT-1..7 answers are baked in; no new clarification questions raised.

**Awaiting:**
- Owner ack on this memo → code starts.
- Implicit OR explicit ack (per session pattern: «continue per plan» or «شروع کن» suffices).

— Phase A author, 2026-05-25. R-Landing PHASE 2 memo locked. Scoped via `.home-shell-v2`. Estimated ~1450 lines new code + scoped CSS. STOPPED.
