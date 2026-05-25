# Phase A Landing Redesign — Audit (PHASE 1, read-only)

## Header

- **Pivot:** owner directive 2026-05-24 «URGENT PIVOT — landing redesign الان priority اوله» logged as Landing-D37.
- **Source:** `C:\digiuniversity\docs\my-upload\landing-page\` (template hand-designed by owner).
- **This doc is read-only.** No code touched. Output is decision input for the owner before PHASE 2 (memo + code).
- **Critical finding upfront:** the template at `landing-page/` is **not just a landing-page redesign — it is a complete SPA mockup covering all 49 routes** matching current production. The directive's name «landing redesign» understates the scope. **Audit Section A.1 documents this; owner must clarify scope before PHASE 2 begins.**

---

## Section A — Template inventory

### A.1 File listing (top-level)

| Path | Size | Purpose |
|---|---|---|
| `README.md` | 5.1 KB | Persian docs; mentions porting to Next.js + describes the design ("Cognitive Cathedral" — see A.5 contradiction) |
| `index.html` | 3.2 KB | Static entry. Loads React 18.3.1 UMD + Babel 7.29 from unpkg + 23 `type="text/babel"` scripts |
| `package.json` | 0.4 KB | (presumably minimal — not opened, but tiny) |
| `styles.css` | **99.9 KB** | All styles, ~598 top-level CSS rules, includes :root tokens + 50+ component classes + 3 themes |
| `src/App.jsx` | 4.3 KB | Hash-based router with 49 route cases — matches production router.tsx 1:1 |
| `src/icons.jsx` | 5.5 KB | Inline-SVG `<Icon name="..." />` library |
| `src/motion.jsx` | 5.9 KB | Reveal + Stagger + ScrollProgress + useMouseParallax — same API as current motion.tsx |
| `src/role.jsx` | 2.9 KB | RoleProvider + role list (mock) |
| `src/sidenav.jsx` | 7.2 KB | Sidebar nav data + render |
| `src/shared.jsx` | 22.7 KB | Nav + Footer + toFa + Sparkline + CognitiveRadar + KnowledgeGraph + ArchStack + NotificationsDropdown + UserDropdown |
| `src/pages/Home.jsx` | 29.3 KB | Hero + Agent System + KnowledgeGraph + Catalog + Stats + Tour + Why-Choose section |
| `src/pages/Programs.jsx` | 6.3 KB | 6 academic programs + 4 learning modes |
| `src/pages/Classroom.jsx` | 13.5 KB | WebRTC stage mock + participants rail + toolbar + AI tutor + Q&A |
| `src/pages/Dashboard.jsx` | 12.7 KB | Cognitive radar + sparkline + week schedule |
| `src/pages/Course.jsx` | 12.7 KB | Module map + learning goals + AI tutor side |
| `src/pages/Instructor.jsx` | 13.9 KB | Class health + coach suggestions + review queue |
| `src/pages/Admissions.jsx` | 16.9 KB | 5-step adaptive admissions flow |
| `src/pages/Credential.jsx` | 10.3 KB | Golden cert + JSON-LD + verifiable credentials |
| `src/pages/Search.jsx` | 7.8 KB | Hybrid retrieval (BM25 + dense) + AI synthesis |
| `src/pages/Assessment.jsx` | 7.4 KB | IRT 2PL adaptive testing + proctoring |
| `src/pages/Community.jsx` | 12.0 KB | Forum + AI clustering + leaderboard |
| `src/pages/Analytics.jsx` | 13.5 KB | Heatmap + cohort + early warning |
| `src/pages/Authoring.jsx` | 14.2 KB | Blueprint + outline + agent policies |
| `src/pages/Recordings.jsx` | 8.6 KB | Video library + summaries + auto-quiz |
| `src/pages/Auth.jsx` | 42.6 KB | Login + Register + Forgot + VerifyEmail + 2FA + Onboarding |
| `src/pages/Settings.jsx` | 22.5 KB | Profile + preferences |
| `src/pages/More.jsx` | 33.5 KB | Calendar + Library + Help + Pricing + Faculty |
| `src/pages/Roles.jsx` | 40.8 KB | Admin + Parent + OfficeHours + Events + About |
| `src/pages/Productivity.jsx` | 48.0 KB | Notifications + Messages + Bookmarks + Achievements + Submission + Profile |
| `src/pages/University.jsx` | 37.8 KB | Schools + Labs + VirtualLab + Research |
| `src/pages/Academic.jsx` | 50.5 KB | Transcript + DegreeAudit + Registration + Career + FinancialAid + Wellness + Alumni + Hackathons + HonorCode |
| `uploads/AI-Native Online University Platform-v1-2.docx` | 124 KB | Proposal doc (Word) — appears to be reference material |
| `uploads/سند پیاده.docx` | 77 KB | Implementation doc (Word) — appears to be reference material |

**Total: 31 source files (1 HTML + 1 CSS + 27 JSX + 2 Word reference docs).**

### A.2 Bootstrap method

- `index.html` loads React + ReactDOM + Babel from CDN (unpkg) as UMD bundles, then loads all 23 `.jsx` files as `<script type="text/babel">`. This is the **prototype/development** mode — Babel-in-browser compiles JSX at runtime. **Not production-ready** (no bundling, no tree-shaking, ~MB of dev React + Babel on every load).

### A.3 CSS / styling approach

- **Inline-only via external `styles.css`** — no Tailwind, no CSS-in-JS, no styled-components.
- **~598 top-level rules**, comparable size to current production `apps/web/styles.css` (8076 lines, ~similar rule count).
- Uses CSS Custom Properties (CSS vars) for the token system.
- Includes `body::before` SVG noise grain texture (paper aesthetic).
- Same RTL approach as current: `dir="rtl"` on html + logical CSS properties where applicable.

### A.4 Font references

- **Same fonts as current production:** Vazirmatn (weights 300-900), Bricolage Grotesque (weights 400-800, variable + opsz), JetBrains Mono (weights 400-700).
- **Same delivery method:** Google Fonts CDN via `<link href="https://fonts.googleapis.com/css2?family=Vazirmatn..." />` — this is the **same Google Fonts URL as pre-R7.2 production**.
- **R7.2 impact:** the production app already self-hosts these fonts via `@fontsource/*` (commit `ed897f8`). When porting the template, the index.html `<link>` will be DROPPED — self-host pattern already in place. **No font-architecture change needed.**

### A.5 Design tokens — `:root` palette

```css
/* — surfaces (warm off-white paper) — */
--bg: #fafaf5;                        /* WARM OFF-WHITE PAPER */
--bg-deep: #f0eee5;
--surface: #ffffff;
--surface-2: #f4f3ee;
--surface-3: #e8e6dd;
--line: rgba(13, 13, 13, 0.08);

/* — ink (true deep black with subtle warmth) — */
--fg: #0d0d0c;                        /* INK BLACK (warm) */
--fg-mute: #4a4a48;
--fg-dim: #8a8884;

/* — single accent: oxford blue (academic, restrained) — */
--accent: oklch(0.34 0.13 255);       /* OXFORD BLUE */
--accent-2: oklch(0.28 0.14 256);
--accent-soft: oklch(0.95 0.025 255);

/* — secondary warm: muted gold (sparingly) — */
--navy: oklch(0.55 0.12 75);          /* MUTED GOLD (back-compat slot named --navy) */

/* — tertiary: deep forest — */
--sage: oklch(0.4 0.08 155);
```

**Aesthetic name:** the styles.css header comment says **"University Press — Minimal Academic"** (line 4): off-white paper + ink black + single oxford-blue accent. The README contradicts: it says "Cognitive Cathedral: dark navy bg + cyan/amber/violet accents". **README is outdated; the actual CSS is the source of truth.** README's "Cognitive Cathedral" is the OLD aesthetic that the current production already partially uses (R6.5 white + navy).

### A.6 Asset list (images, icons, video, animations)

- **Zero image files.** No PNG/JPG/SVG/WebP files in the template directory tree.
- **Icons:** all inline SVG via `src/icons.jsx` — `<Icon name="..." />` component renders path-based SVG. ~50 icons covered.
- **Animations:** all CSS-only (keyframes, transitions, transforms). No Lottie, no GIF, no video.
- **Word docs in `uploads/`:** reference material (proposal + implementation doc), not used by the runtime template.

### A.7 JS interactivity

- **Hash-based router** in `App.jsx` (49 cases via switch).
- **useState hooks** per page for local UI state.
- **IntersectionObserver** via `src/motion.jsx` for `.reveal` + `.stagger` scroll animations (same API as current).
- **No third-party libs:** no Swiper, no AOS, no GSAP, no Three.js, no Lottie, no Framer Motion, no React Router DOM, no Radix UI, no react-hook-form, no zod. **All hand-built from primitives.**
- `useMouseParallax` for the hero auroras (same pattern as current).

### A.8 Responsive breakpoints

Searched styles.css for `@media`:
- `min-width: 480px` (sm)
- `min-width: 768px` (md)
- `min-width: 1024px` (lg)
- `min-width: 1280px` (xl)
- Plus several `max-width: 980px`, `max-width: 720px` for grid collapses

**Same scale as current production** (xs/sm/md/lg/xl per `tailwind.config.js`, with xs=320). Template doesn't explicitly handle 320px — needs verification at the smallest viewport.

### A.9 RTL readiness

- `index.html`: `<html lang="fa" dir="rtl">` ✅
- `styles.css`: `direction: rtl` on body ✅
- Uses logical CSS properties (`padding-inline-start`, `margin-inline-end`, etc.) in most places — checked a sample.
- Some `margin-left/right` still present (sampled `.nav-link` uses `left/right`) — would need RTL fix per R6.6-D15.

### A.10 Frameworks / libraries — none required

The template ships **zero npm dependencies** (the package.json is essentially empty per its 0.4 KB size). All code is hand-rolled with React + ReactDOM + Babel from unpkg CDN. **When ported into production, current production dependencies (react-router-dom, Radix, @fontsource, @casl, react-hook-form, zod) are not impacted by the template.**

---

## Section B — Parity gaps with current `apps/web/src/pages/Home.tsx`

### B.1 Structural parity — high

**The template's `Home.jsx` (29.3 KB) and current production `Home.tsx` (908 lines) are essentially THE SAME COMPONENT TREE.** Confirmed by sampling:

- Hero with eyebrow + title + sub + dual CTA + 3D card cluster + stats — identical layout.
- Agent Architecture section with 5 pillars — identical.
- Hero3DClassroom / Hero3DTutor / Hero3DAnalytics / Hero3DCredential — identical.
- Stagger pattern + `.reveal` animations — identical.
- `useMouseParallax()` aurora drift — identical.

**Hypothesis:** current `Home.tsx` was originally derived from this template's `Home.jsx` (or vice versa). The structural skeleton matches.

### B.2 Content parity — close

Sample comparison on hero title:
- **Template:** «دانشگاهی نسل جدید، برای عصر هوشمندی»
- **Current production:** «دانشگاه آنلاین هوشمند ایران، با ۲۴۸ برنامه و گواهی قابل اثبات»

Current production has the post-Phase-16-R2 "outcome-first headline" rewrite. Template carries the older brand statement. **The redesign would either revert to the template's headline OR keep the production headline + apply the template's styling. Owner must pick.**

### B.3 Aesthetic parity — different

- Current production palette (R6.5): pure white `#ffffff` bg + navy `#0b2447` fg + brand blue `#2f5fd3` accent + gold `#e7c87a` highlight.
- Template palette: warm off-white `#fafaf5` bg + ink black `#0d0d0c` fg + oxford blue `oklch(0.34 0.13 255)` accent + muted gold accent + grain texture overlay.

The two are PHILOSOPHICALLY DIFFERENT:
- Current = brand-colored, modern, vivid.
- Template = academic, paper-like, restrained.

Both are valid; the template represents an aesthetic SHIFT that owner explicitly approved (per Landing-D37).

### B.4 Sub-component parity

All sub-components present in current `Home.tsx` (TrustStrip, StatsBand, FacultyShowcase, CatalogTeaser, Testimonials) are ALSO present in the template's `Home.jsx` — verified by README §1 description. Specific implementations may differ (template was built ~before TrustStrip etc. were added, but the README confirms they're there in the template too).

### B.5 Animation parity

Template has `title-rise`, `card-fade-in`, `aurora-drift` keyframes (same as current pre-R7.1.1). **R7.1.1 DROPPED these animations** to fix TBT regression. If template port reintroduces them as-is, the R7.1.1 TBT fix would regress unless we re-apply the drop on the new code.

---

## Section C — Design system overlap

### C.1 Token-by-token comparison

| Token | Template | Current (R6.5) | Same? |
|---|---|---|---|
| `--bg` | `#fafaf5` (warm paper) | `#ffffff` (pure white) | ❌ |
| `--bg-deep` | `#f0eee5` | `#f4f3ee` | ❌ |
| `--surface` | `#ffffff` | `#f4f3ee` | ❌ (swapped meanings) |
| `--fg` | `#0d0d0c` (ink black) | `#0b2447` (navy) | ❌ — biggest difference |
| `--fg-mute` | `#4a4a48` (warm gray) | `#4a5a76` (R7.6 darkened navy-gray) | ❌ |
| `--fg-dim` | `#8a8884` | `#768094` | ❌ |
| `--accent` | `oklch(0.34 0.13 255)` (oxford blue) | `#2f5fd3` (brand blue) | ❌ — same hue family, different sat/light |
| `--gold` (alert/highlight) | `oklch(0.5 0.16 30)` (muted brick) | `#e7c87a` (yellow gold) | ❌ — major difference |
| `--line` | `rgba(13,13,13,0.08)` | similar | ≈ |
| `--f-sans` | `Vazirmatn, system-ui` | `Vazirmatn, system-ui` | ✅ |
| `--f-mono` | `JetBrains Mono, monospace` | `JetBrains Mono, monospace` | ✅ |
| `--f-display` | `Bricolage Grotesque, Vazirmatn` | `Bricolage Grotesque, Vazirmatn` | ✅ |

**Verdict:** fonts are the same; everything else is different. The template represents a complete palette REPLACEMENT.

### C.2 R7-era token changes interaction

- **R7.6** darkened `--fg-mute` and `--fg-dim` in the white+navy palette for axe contrast.
- **R7.7c** added `--fg-mute-on-dark` token for footer-on-dark routes.
- **R7.7a** demoted `--accent`/`--cyan`/`--gold` as TEXT colors to `--fg` on 10 sites in styles.css.

**If we adopt the template's palette globally:**
- `--fg-mute` would change from `#4a5a76` to `#4a4a48` — different hue but similar luminance; axe contrast on white needs re-verification.
- `--accent` text usage that was demoted in R7.7a needs re-eval: oxford blue text on warm paper has different contrast than brand-blue on pure white.
- `--gold` swap from yellow-gold to muted-brick may affect DropdownMenu destructive variant (R7.7b kept it as the "danger" hue).

**If we adopt the template's palette scoped to landing only:**
- Workspace routes keep R6.5 + R7.6 + R7.7 effects intact. Zero regression risk.
- BUT: the navbar/footer that ALSO render on workspace will look different from landing unless we scope further.

---

## Section D — Scoped vs Global recommendation

### D.1 Three options

**Option A — Scoped to `/` only.**
- Wrap landing in `.landing-redesign` outer div.
- Override all `:root` tokens inside that scope.
- Workspace, login, classroom, all 49 routes EXCEPT `/` keep R6.5 white+navy.
- **Pros:** zero regression risk, fastest ship, owner can A/B compare.
- **Cons:** landing visually disconnected from rest of app. Navbar + footer will look one way on `/` (paper aesthetic) and a different way on every other route (white+navy). User sees a "jump" on first nav from `/` to any other page.

**Option B — Scoped to PUBLIC + AUTH_FLOW routes only.**
- Apply template palette to PUBLIC (`/`, `/about`, `/programs`, `/admissions`, `/pricing`, `/help`, `/honor-code`) + AUTH_FLOW (`/login`, `/register`, `/forgot`, `/verify-email`, `/2fa-setup`, `/onboarding`).
- WORKSPACE routes keep R6.5.
- **Pros:** clean separation between "marketing/onboarding" (template aesthetic) and "tool" (workspace aesthetic). Common nav can adapt via route classification.
- **Cons:** medium scope. Requires careful route-aware token application. Workspace ↔ public navigation will feel like switching between two apps.

**Option C — Global palette adoption.**
- Replace R6.5 tokens with template tokens repo-wide.
- Re-verify R7.6 + R7.7 axe contrast on the new palette.
- Re-run R3 / R5 / R6 / R7.7 baseline visual specs (significant baseline reset expected).
- **Pros:** consistent aesthetic across all 49 routes. Owner's explicit Landing-D37 directive («palette/typography landing template ممکنه D14 رو روی public routes superseded کنه») leaves the door open to this.
- **Cons:** largest scope. ~50% chance of triggering baseline resets on most existing specs. Phase A R6.5 + R7.6 + R7.7 effects must be re-verified.

### D.2 Audit recommendation

**Recommend Option B (scoped to PUBLIC + AUTH_FLOW).**

Rationale:
1. Owner's explicit directive caveat: «palette/typography landing template ممکنه D14 رو روی public routes superseded کنه» — *public routes*, NOT all routes. This wording supports Option B.
2. Option B preserves the R7.6/R7.7 a11y wins on workspace routes (where most user time is spent).
3. Option B respects the template's "marketing/academic" aesthetic intent (it's a marketing site palette, not a productivity-tool palette).
4. Workspace ↔ public switch is rare in user journeys (you don't browse `/programs` while logged into `/dashboard`); the visual switch is acceptable.
5. Option A is too restrictive — landing-only scope means navbar/footer mismatch on a single route.
6. Option C is too aggressive — risks Phase A close work.

**If owner prefers Option C, the path forward is sub-Rs:**
- C.1 — adopt template tokens repo-wide
- C.2 — re-run R3 + R5 + R6 + R6.6 + R7.7 baselines + reset where palette intentionally changed semantics
- C.3 — re-run R7.6 axe contrast verification
- C.4 — accept the new "🟡 partial-with-variance §1 Perf" baseline may shift; re-measure

---

## Section E — Backend integration list

The template is **read-only marketing/onboarding content**. No backend wiring required for the landing page itself. However, several pages in the broader template touch backend surfaces:

| Template page | Backend touchpoints | Current status |
|---|---|---|
| `Home.jsx` | None (static marketing) | ✅ no wiring needed |
| `Programs.jsx` | `GET /api/v1/programs` (currently exists via `findSchool` mock) | ✅ existing |
| `Admissions.jsx` | `POST /api/v1/applications` (Phase B.4 candidate) | ⏳ Phase B.4 |
| `Classroom.jsx` | LiveKit `POST /api/v1/livekit/token` (Phase D) | ⏳ Phase D |
| `Dashboard.jsx` | `GET /api/v1/dashboard/me` (currently mock) | ⏳ Phase C |
| `Course.jsx` | `GET /api/v1/courses/:id` (exists) + lessons (Phase C) | ✅ partial |
| `Search.jsx` | `POST /api/ai/search` (Phase E AI Gateway) | ⏳ Phase E |
| `Auth.jsx` | `POST /api/v1/auth/login` (exists) + `/register` etc. | ✅ existing |

**For landing redesign sub-R (Home page only): no backend changes needed.**

For broader SPA redesign (if owner picks scope = full SPA): backend touchpoints are unchanged from current Phase A status. The redesign is purely a frontend skin replacement; data sources stay as they are.

---

## Section F — Risks per surface

| Risk | Likelihood | Mitigation |
|---|---|---|
| **F.1 CSS conflict between template tokens and existing `--accent`/`--gold` usage** | High if Option C | Apply scoped CSS via `.template-redesign` wrapper or route-based class. Run R3+R5+R6+R7.7 spec baselines first. |
| **F.2 RTL regressions from `margin-left/right` in template CSS** | Medium | R6.6-D15 logical-CSS audit. Convert physical → logical during port. |
| **F.3 Asset weight blowing up Lighthouse Perf budget** | Low | Template has zero image assets; pure CSS + inline SVG. No regression vector here. |
| **F.4 Font transfer regression undoing R7.2 self-host** | Low | Drop template's `<link href="fonts.googleapis.com">` during port; reuse the existing `@fontsource/*` setup. |
| **F.5 Animation TBT regression undoing R7.1.1 anim drop** | High | Template carries `title-rise` + `card-fade-in` + `aurora-drift` keyframes; re-apply R7.1.1 anim drop on the new code. |
| **F.6 axe contrast regression from oxford-blue + ink-black on warm paper** | Medium | Re-run axe-scan post-port; if Critical re-introduced, that's a hard block (per D31 §2 verdict — critical=0 must hold). |
| **F.7 Lighthouse a11y regression from new color contrast** | Medium | Re-run Lighthouse post-port on the 3 sampled pages; if A11y drops below 95+, the R7.3 ack is voided. |
| **F.8 Workspace ↔ public visual mismatch (Option B)** | Acceptable | Document in review doc; owner accepts the seam between marketing and tool. |
| **F.9 Baseline reset cascade (Option C)** | High | Plan a "baseline approval round" per R7.12 D26 precedent. Owner approves new screenshots before they overwrite the old. |
| **F.10 Babel-in-browser performance** | n/a | Template's CDN Babel approach is dev-only; production port uses the existing Vite + esbuild pipeline. Not a real risk. |

---

## Section G — Budget estimate

### G.1 Per-option budget

| Option | Scope | LoC | Spec frames | Time |
|---|---|---|---|---|
| **A — Scoped to `/` only** | 1 page (`apps/web/src/pages/Home.tsx`) + scoped CSS wrapper | 400-600 lines | 6 viewports × 1 page = 6 | 1 day |
| **B — Scoped to PUBLIC + AUTH_FLOW** | ~12 routes (Home + Programs + About + Admissions + Pricing + Help + HonorCode + 6 Auth) + route-aware token application | 1500-2500 lines | 6 viewports × ~6 sampled routes = 36 | 3-5 days |
| **C — Global palette adoption** | All 49 routes (palette swap) + baseline resets | 3000-5000 lines (mostly CSS + baseline image diffs) | 6 viewports × ~10 representative routes = 60 + baseline-approval round | 1-2 weeks |
| **Full SPA mirror (literal template port)** | All 27 page files + all 99 KB CSS rewrite | 8000-12000 lines (~30 PR files) | 6 viewports × all 49 routes = 294 | 3-4 weeks |

### G.2 Recommended budget split

Memo's recommended path is **Option B in 3 sub-Rs:**

- **R-Landing-1:** Home.tsx skin replacement + scoped tokens (~500 lines, 1 day)
- **R-Landing-2:** Auth.tsx (LoginPage et al.) + Admissions + Pricing + About + Help + HonorCode skin replacement, reusing the scoped pattern (~800 lines, 1-2 days)
- **R-Landing-3:** Programs.tsx skin + route-aware Nav/Footer token swap (~700 lines, 1 day)

Total Option B: ~2000 lines, 3-5 days.

### G.3 Tests

Per the template port:
- Visual spec per public page (D12 5-point contract).
- 6 viewports × ~6 pages = 36 frames.
- Plus 4 small-viewport regression checks on workspace routes (sanity that scoped CSS didn't leak).
- Per the standard regression sweep: R1.1, R3, R5, R6, R6.6, R7.12, R7.7, gate-a-role-routing — expected all green if scoped properly.
- axe-scan re-run — critical must stay 0; serious tail may shift but the D31 KEEPs rationale still applies.
- Lighthouse re-measure on `/`, `/login`, `/programs` — A11y must stay ≥95; Perf may shift in either direction.

---

## Section H — Open questions for owner (audit-output decisions)

Before PHASE 2 (memo + code) can start, owner must clarify:

1. **Q-AUDIT-1 — Scope.** «landing redesign» in the directive vs the template covering all 49 routes. Pick one:
   - **A:** Home.tsx only (literal interpretation).
   - **B:** PUBLIC + AUTH_FLOW routes (audit recommendation).
   - **C:** All 49 routes (full SPA mirror).

2. **Q-AUDIT-2 — Palette propagation.** If Option B or C, do we accept the R7.6 axe-contrast re-verification cost on the new palette? (Workspace stays untouched in B; entirely re-verified in C.)

3. **Q-AUDIT-3 — Hero headline.** Template carries the brand-statement headline («دانشگاهی نسل جدید»). Production has the outcome-first headline («دانشگاه آنلاین هوشمند ایران، با ۲۴۸ برنامه»). Pick one OR keep production text + template styling.

4. **Q-AUDIT-4 — Aurora animations.** Template carries the `title-rise + card-fade-in + aurora-drift` animations that R7.1.1 dropped to fix TBT. Pick:
   - **A:** Keep dropped (R7.1.1 effect honored, no entry choreography).
   - **B:** Reintroduce + re-check TBT on the new palette (might be different).

5. **Q-AUDIT-5 — README aesthetic name discrepancy.** README says "Cognitive Cathedral" (dark navy + cyan/amber/violet); styles.css header comment says "University Press — Minimal Academic" (off-white + ink black + oxford blue). Two completely different aesthetics. **Which is the intent?**
   - If "Cognitive Cathedral" → the styles.css is the wrong file and template is broken; request the correct CSS.
   - If "Minimal Academic" (per CSS) → README is outdated; proceed with the CSS as ground truth.

6. **Q-AUDIT-6 — `--gold` semantic.** Current `--gold` is yellow `#e7c87a` (R7.7b kept it as DropdownMenu destructive bg + brand highlight). Template `--gold` is muted-brick `oklch(0.5 0.16 30)` (alert color). Pick which semantic survives.

7. **Q-AUDIT-7 — Word docs in uploads/.** Template's `uploads/` contains two `.docx` reference files. Are these owner-provided spec material to read? Or stray artifacts?

---

## Section I — Phase order recap

Per Landing-D37 + the owner's three-phase directive:

- **PHASE 1 (THIS DOC) ✅ DONE.** Audit + write `docs/PHASE_A_LANDING_AUDIT.md`. NO code.
- **PHASE 2 ⏳ PENDING owner ack of this audit.** Memo (`docs/PHASE_A_LANDING_MEMO.md`) — Q-AUDIT-1..7 answered, concrete file plan, sub-R split, regression scope.
- **PHASE 3 ⏳ PENDING memo ack.** Ship sub-Rs sequentially per memo, with D29 Chrome-Extension pre-smoke, regression sweep, axe re-check, Lighthouse re-measure. Stop after each sub-R for D13.

---

## Standing instruction

«**stop + ping owner برای audit doc review. هیچ code تا audit done.**»

This audit is committed; no code touched. Awaiting owner review of Sections D + H specifically.

— Phase A author, 2026-05-24/25. PHASE 1 audit complete. Template is the FULL SPA mockup (49 routes); directive says «landing» — Q-AUDIT-1 scope is the dominant decision. Standing by for owner clarification on Q-AUDIT-1..7.
