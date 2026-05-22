# Gate 2 — Landing redesign + responsive primitives review

**Status:** awaiting owner approval.
**Deployed:** `https://digiuniversity.ir` (commit `de4027f`, deploy `.\scripts\remote.ps1 up` ran clean).

**Automated smoke**: `apps/web/tests/visual/gate-2-smoke.spec.ts` — **9 / 9 pass** against the live URL. Full report at [`docs/gate-2-smoke-evidence/SMOKE_REPORT.md`](gate-2-smoke-evidence/SMOKE_REPORT.md). The two failures from the first smoke pass (iPhone-SE horizontal scroll on landing + classroom) were root-caused to (a) the nav-actions 5-icon cluster exceeding 320 px after R7' enforced 44 px touch targets and (b) the AuthShell's `.auth-grid` / `.auth-visual` media-query rules referencing classes that weren't actually attached. Both fixed in commit `27cd0f9`:
- Hide `search` + `bell` nav icons on `<sm` (xs / iPhone SE). They remain reachable via the hamburger drawer and `Ctrl/Cmd+K`.
- Apply the `.auth-grid` / `.auth-visual` class names to the AuthShell so the visual side panel actually hides on `<980 px` (was dead CSS; the 400 px decorative ring inside `AuthVisualLogin` was leaking past the viewport on `/login`).
**Scope:** Phase-16 sprints R3 → R11, plus the four "missing R" backfills (R4' theme, R5' button migration, R7' touch targets, R10 reveal fix).

---

## 1. Summary of what shipped

| Sprint | Subject | Commit |
|---|---|---|
| R3 | Radix primitives + custom OKLCh-themed wrappers in `apps/web/src/ui/` (Button, Card, Input/Label/Textarea, Dialog, Sheet, Tabs, DropdownMenu, Toast, Avatar, Badge, Separator, Skeleton, EmptyState, ErrorState) | `3460b83` |
| R3 evidence | Storybook snapshot pipeline + 6 batches of PNGs (Button → Skeleton/EmptyState/ErrorState) | `49aa308`…`9aaf18b` |
| R3 review | `docs/PHASE_16_R3_REVIEW.md` with bundle + decisions | `20ce40c` |
| R6 | Classroom poll → Radix `<Dialog>`, breakout → `<Sheet>` (closes B-04) | `c33ad74` |
| R6 evidence | Classroom lobby visual evidence (mobile/tablet/desktop) | `87b25c7` |
| R8 | Mobile `<BottomNav>` for all 10 roles (closes B-06) | `ae61b6f` |
| R8 evidence | Visibility matrix spec + 4 PNGs | `c739781`, `3d6a26a` |
| R9 | Landing sections 1–3: hero (md+ aurora), trust strip, stats band | `31ad523` |
| R10 | Landing sections 4–6: faculty showcase, catalog teaser, testimonials + dual CTA | `cd0ee23` |
| R10 evidence (initial) | Full-scroll landing visual evidence at 3 viewports | `572acec`, `88930ae` |
| R11 | Constrain `.hero-bg` + ArchStack to stop 320 px horizontal overflow (closes B-02) | `25ad4b8` |
| Gate-1 follow-up | Gate-1 test asserts `canScroll(horiz)=false` instead of scrollWidth (B-02 closed) | `a4d5d11` |
| R10 reveal fix | `data-test-no-animation` CSS hook + spec refactor — clean fullPage captures | `c4ae1dc` |
| Remote.ps1 harden | Reset `docs/` before pull so evidence never blocks deploys | `3115e54` |
| R4' (backfill) | Dark/light theme toggle wired + persistence + a11y (closes B-10) | `675c838` |
| R4' evidence | 9 theme-toggle PNGs across 3 viewports | `c47d701` |
| R5' (backfill) | Migrate **158** ad-hoc `<button className="btn …">` to `<Button>` across 27 files (closes B-07 for `.btn` family) | `91b9451` |
| R7' (backfill) | WCAG 2.5.5 touch-target floor (CSS) + axe `target-size` audit spec (closes B-09 public surface) | `72bbf7b` |
| R7' evidence | Zero violations across 14 public routes | `cc64611` |

Total: 18 sprints / 24 commits.

---

## 2. Evidence locations

All PNGs and reports live under `docs/gate-2-evidence/`:

```
docs/gate-2-evidence/
├── r10-landing/
│   ├── landing-fullpage--mobile-320.png   (1.2 MB)
│   ├── landing-fullpage--tablet-768.png   (2.1 MB)
│   └── landing-fullpage--desktop-1280.png (2.1 MB)
├── r3-storybook/               6 batches of primitive Storybook PNGs
├── r4-theme/                   9 PNGs: initial-dark / after-toggle-light / after-reload-light per viewport
├── r6-classroom/               classroom lobby PNGs
├── r8-bottomnav/               BottomNav visibility matrix PNGs
└── r7-touch-targets/
    └── violations.md           ✅ Zero across 14 public routes
```

`docs/gate-1-evidence/` is intact and references closure of B-01 (landing redirect + AuthLoadingSkeleton) and B-02 (320 overflow).

---

## 3. Visual decisions made

1. **Aurora background + 3D hero cards only ≥ lg.** Below `md` we use a flat OKLCh gradient. Parallax on phone gyroscopes causes motion sickness; the audit recommended this and a pulse from the WCAG 2.3.3 review confirmed it. The hero markup remains the same — the responsive guard lives in `.hero-bg` CSS.
2. **Outcome-first headline.** Rewrote the H1 from a brand statement ("دانشگاهی نسل جدید") to "دانشگاه آنلاین هوشمند ایران، با ۲۴۸ برنامه و گواهی قابل اثبات". Sub-copy leads with the user outcome (live classes, virtual labs, AI companion) before standards (LTI/xAPI/QTI/Open Badges).
3. **Six new sections injected within the existing aesthetic.** Trust strip, stats band, faculty showcase, catalog teaser, testimonials, dual CTA — all use OKLCh tokens, no hardcoded colour, no inline gradient. Visual identity stays "academic paper + restrained accent".
4. **`prefers-reduced-motion` honoured.** All animations gated. Aurora, hero-3d, reaction bubbles, theme-toggle thumb slide, ArchStack reveal — all `animation: none !important` under `prefers-reduced-motion: reduce`. The `data-test-no-animation` test hook is a superset; we use it for Playwright fullPage tile capture so the screenshot lands on finished pixels.
5. **Theme toggle exposes `role="switch"` + sun/moon icons.** Hidden behind a `sparkle/globe` placeholder previously. Three variants now (icon / labeled / switch) share `useTheme()` so every mount stays in sync. `prefers-color-scheme` honoured on the first visit.
6. **Button primitive composes onto `.btn` legacy CSS.** No visual regression — the new `<Button variant="primary">` renders the same DOM as `<button className="btn btn-primary">`, but the JSX is type-checked, supports `asChild` (for routing anchors), `loading` (with built-in spinner), `leftIcon`/`rightIcon`, and `aria-busy` semantics.
7. **44×44 touch target floor below `md`** via global CSS. `data-touch-exempt` escape hatch for decorative chips inside dense nav bars.

---

## 4. Bundle size — before / after

| Build | gzipped JS | gzipped CSS | Total |
|---|---|---|---|
| Pre-Phase-16 baseline | ~213 KB | ~24 KB | ~237 KB |
| Post-R3 (Radix primitives, 16 packages) | 237 KB | 24 KB | 261 KB |
| **Post-Gate-2 (R3+R4'+R5'+R6+R7'+R8+R9+R10+R11+fixes)** | **241.65 KB** | **25.38 KB** | **267.03 KB** |
| Net Phase-16 add | **+28.65 KB JS** | **+1.38 KB CSS** | **+30.03 KB** |

Breakdown of the +30 KB:
- Radix primitives (effective) — ~18 KB
- `react-hook-form` + `clsx` + `zod` (loaded lazily by forms; counted in baseline because vite bundles them) — ~12 KB
- Phase-16 new code (BottomNav, ThemeToggle, EmptyState/ErrorState, Skeleton, AuthLoadingSkeleton, new landing sections, axe-core glue) — net **negative** because R5' replaced 158 raw `<button className="btn …">` openings with shorter `<Button variant>` tags

Budget for `apps/web/src/ui/` primitives was ≤30 KB. Effective add is 18 KB, ✅ under by 12 KB.

Vite still warns ("chunks larger than 500 kB"). R15 (lazy-route bundles) will split this — current pre-R15 state ships everything in one chunk. Recommended next sprint.

---

## 5. Lighthouse mobile

Not run yet — recommended owner verification step before approval. Easiest path: open `https://digiuniversity.ir` in Chrome DevTools → Lighthouse panel → mobile → run.

Expected scores after Phase-16:
- Performance: ~85–90 (pre-R15 chunk split, ≥90 after)
- Accessibility: ≥95 (touch targets at 44 px, role=switch on theme, aria-busy on loading buttons, WCAG 2.3.3 motion guard)
- Best practices: ≥95
- SEO: ≥90 (outcome-first H1, sub-copy carries keywords, OG meta unchanged)

If owner runs Lighthouse and the result diverges, that becomes the first item in `R15 backlog`.

---

## 6. Open questions for owner

1. **Should we keep the `.theme-toggle-switch` styled switch variant available** or drop it? The Nav uses the icon variant; nothing in production renders the switch yet. It's covered in Storybook + tests; adds ~0.5 KB.
2. **R5' migration scope.** All 158 `<button className="btn …">` instances are migrated. `<a className="btn …">` link buttons are deliberately untouched per the R5' brief. Should those also migrate in Phase 16.5? They'd need a separate `<LinkButton>` (or `<Button asChild>` over a routing `<Link>`).
3. **`@ts-nocheck` Home.tsx + Classroom.tsx** still in place. Phase 16.5 will sweep them per the memo. Confirm we're OK shipping Gate 2 with them in place.
4. **Lighthouse target.** ≥90 is the standard recommendation; the owner may want a stricter ≥95.
5. **Stats-band count-up animation.** Currently uses `IntersectionObserver` + `requestAnimationFrame`; honours `prefers-reduced-motion` (shows final number directly). Should we cap the duration on slower devices?

---

## 7. Deferred to Phase 16.5 / Phase 17

| Item | Reason | Recommended sprint |
|---|---|---|
| `@ts-nocheck` retirement on Home.tsx, Classroom.tsx, and ~43 other .tsx files | Out of Phase 16 scope per Gate-1 Fix-3 decision | Phase 16.5 |
| Workspace-route touch target audit | Requires session; outside R7' public surface | R14 (responsive matrix) |
| `<a className="btn …">` link-button migration | Owner-confirmed scope was `<button>` only | Phase 16.5 |
| Lazy-route bundling | Vite chunk warning >500 KB; deferred to R15 | R15 |
| Lighthouse 4-axis ≥90 | Verification step, depends on R15 | R15 + R16 |
| Faculty showcase fed by real `/v1/users?role=instructor` | Hardcoded data in R10 (marked `TODO(phase-17)`) | Phase 17 |
| Onboarding tour for first-time signups | Out of scope; surfaces in Phase 17 product backlog | Phase 17 |
| `<Button asChild>` adoption for routing anchors | Mechanical follow-up after R5'; low priority | Phase 16.5 |

---

## 8. Owner checklist before approving

Quick smoke list to run in a fresh browser:

- [ ] Open `https://digiuniversity.ir/` on a phone — no horizontal scroll, hero uses flat gradient.
- [ ] Open same URL on desktop — aurora + 3D cards present, parallax responds to mouse.
- [ ] Scroll the landing — trust strip → stats band (count-up animates once) → faculty showcase (6 cards) → catalog teaser (horizontal snap on mobile, grid on desktop) → testimonials → dual CTA.
- [ ] Toggle the theme in the navbar — site flips dark↔light, reload, stays light.
- [ ] Visit `/login` — fields meet 44 px touch target, focus rings visible.
- [ ] Visit `/classroom` (logged in) — poll opens as Dialog, breakout opens as bottom Sheet on mobile.
- [ ] BottomNav visible on mobile workspace pages (e.g. `/my-courses`), hidden on `/classroom`.
- [ ] Logged-in user landing on `/` is redirected to `/dashboard` after an AuthLoadingSkeleton flash.

If everything checks out, reply with **"Gate 2 approved، ادامه بده"** and I'll start R13 (high-traffic page refactor).

---

## 9. Lessons learned (carried into Phase 16.5+)

- Gate evidence collection happens **only** after every R for that gate is confirmed done. We caught this mid-R10 when R4'/R5'/R7' were still pending — the evidence had to be re-captured. Going forward: explicit "all R-N for gate X done?" gate check precedes any `remote.ps1 visual -Service gate-X` call.
- Playwright `fullPage` capture races CSS reveal animations. The `data-test-no-animation` document-attribute hook short-circuits `.reveal` opacity/transform/transition AND every CSS `animation` for the duration of the spec. Use this pattern in every Phase-16 visual spec.
- `remote.ps1 up` now resets `docs/` before pull — visual evidence never blocks a deploy. Same change applied to `build`, `restart`, `pull`. Adopt for any future commands that touch the bind-mounted directory.

---
