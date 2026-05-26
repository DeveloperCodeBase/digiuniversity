# Phase A R-Landing-v2 — Audit (PHASE 1 only, NO CODE)

**Author:** Phase A author
**Date:** 2026-05-26
**Status:** ⏳ awaiting owner ack before PHASE 2
**Trigger:** owner directive 2026-05-25 (late) — URGENT landing redesign for presentation 1-2 days out, with hard-stop rules from R-Landing-v1 lessons (scope leak, SW staleness, no manual smoke).

---

## A. Design fetched files

Fetched from `https://api.anthropic.com/v1/design/h/k3LxeyWg5sVzaCbA8kFiwQ?open_file=index.html` → 20.4 MB gzipped tarball (`application/gzip`) → extracted to `docs/my-upload/landing-v2/`.

| File | Size | Purpose |
|---|---|---|
| `index.html` | 1.8 KB | HTML scaffold, links styles.css + 4 Babel-transformed TSX files |
| `styles.css` | 48 KB | Palette + typography + layout + animations (1496 lines, no scope wrapper) |
| `data.tsx` | 19 KB | Content data: FEATURES, SCHOOLS, COURSES, STATS, STEPS, FACULTY, TESTIMONIALS, PARTNERS, FAQS, TOPBAR_LINKS, NAV_LINKS, LIVE_STATS |
| `app.tsx` | 34 KB | Top-level layout: topbar + nav + hero + sections + footer (738 lines) |
| `components.tsx` | 33 KB | Reusable parts: Icon, BrandLockup, Avatar, CoursePreview, HeroLogoCard, PartnerMark, FacultyPortrait, LiveStatsCard (742 lines) |
| `tweaks-panel.jsx` | 24 KB | Dev-only editor panel (irrelevant for production port) |
| `assets/` (15 files) | ~3 MB | Faculty portraits (m1-m4.jpg/png, w1-w4.jpg/png), dark-logo, light-logo, jahad-dark/light, airac-white |
| `uploads/` | ~16 MB | Source-material copies of the same images (raw) |
| `_README.md` | small | Project description from Claude Design |

**Loading model:** browser-side TSX → Babel standalone → React 18 UMD. NOT production-ready as-is — must be ported to our Vite TSX pipeline.

---

## B. Design visual inventory (1440 desktop, rendered via Chrome Extension on owner laptop)

### Palette (CSS variables from `:root`)

| Token | Value | Use |
|---|---|---|
| `--navy-900` | `#050d1c` | Deepest navy (topbar bg) |
| `--navy-800` | `#0a1830` | Primary text, hero accents |
| `--navy-700/600/500/400/300/200/100/50` | (10-step scale) | UI surfaces, borders |
| `--accent` | `#2e6bff` (royal cobalt) | Primary CTAs, links, eyebrow tags |
| `--accent-2` | `#1d4ed8` | Hover state |
| `--accent-soft` | `#e0e9ff` | Accent backgrounds |
| `--gold` | `#c9a45c` | Prestige cues (sparing) |
| `--paper` | `#ffffff` | Main background |
| `--paper-2` | `#f8fafc` | Card/section background |
| `--line` | `#e6ebf2` | Hairlines |
| `--ink` | `#0a1830` | Body text |
| `--mute` | `#5a6a86` | Secondary text |

**Voice:** Iranian state-university institutional. Navy = authority. Cobalt = modernity. Gold = prestige (sparingly).

### Typography

- **UI (Persian):** Vazirmatn (300/400/500/600/700/800/900), font-feature `ss03`, `ss01`
- **Latin numerals/labels:** Plus Jakarta Sans (400/500/600/700)
- **Loading source (design):** Google Fonts CDN (will need to switch to self-hosted `@fontsource/vazirmatn` per R7.2)

### Sections (12 in design)

| # | Section | Design content |
|---|---|---|
| 1 | TOPBAR (dark navy) | Badges: «زیرمجموعه‌ی جهاد دانشگاهی ایران» + «ثبت‌نام دور پاییز ۱۴۰۵ آغاز شد» + email + 24/7 support |
| 2 | NAV (white sticky) | Brand lockup right (university name + AIRAC sub + Jahad seal) · 6 nav links center · «ورود به سامانه» + «ثبت‌نام رایگان» left |
| 3 | HERO | Two co-brand chips (Jahad + AIRAC) · huge title «دانشگاه برخط هوشمند ایران» · sub paragraph · 2 CTAs · 4 stat pills · floating METRICS+DASHBOARD card teasers |
| 4 | LIVE STATS | 4 cards: دانشجوی فعال / دوره‌ی فعال / فارغ‌التحصیل امسال / استاد همکار (with ↑ deltas) |
| 5 | FEATURES (6) | Card grid: انعطاف زمانی، محتوای دانشگاهی (featured), یار هوشمند، مدرک رسمی، جامعه دانشجویی، هزینه مقرون‌به‌صرفه |
| 6 | SCHOOLS (6) | هوش مصنوعی (featured) · مهندسی کامپیوتر · مدیریت و کسب‌وکار · مهندسی صنایع · هنر و طراحی · علوم سلامت — each with course count + CTA |
| 7 | COURSES (6, filterable by all/tech/mgmt/med/art) | یادگیری ماشین · MBA دیجیتال · توسعه‌ی وب · Power BI · بازاریابی دیجیتال · UX |
| 8 | STEPS (4) | ثبت‌نام → مشاوره‌ی تخصصی → یادگیری در سامانه → دریافت گواهی‌نامه |
| 9 | FACULTY (8 with photos) | 8 professors with field + initials avatar |
| 10 | TESTIMONIALS (3) | Student stories with photos |
| 11 | PARTNERS (12 logos) | جهاد، وزارت علوم، شریف، تهران، امیرکبیر، علم و صنعت، PTP، BMN، MICT، IPM، INIF، ITO |
| 12 | FAQs (6) | Accordion with 6 admission/payment/support questions |
| (12+) | FOOTER | Multi-column with about/programs/contact/social |

### Responsive breakpoints (inferred from `clamp()` patterns + `@media` in styles.css)

- Mobile portrait: <640
- Tablet portrait: 640-880
- Tablet landscape: 880-1024
- Desktop: 1024+
- `--pad: clamp(20px, 4vw, 48px)` and `--max: 1280px` central pattern

### Animations

- **Reveal-on-scroll** via IntersectionObserver: `[data-reveal]` elements get `.in` class when 8% in view
- **Feature card spotlight** mouse-follow: `--mx/--my` CSS vars updated on mousemove
- **Scroll-aware header shadow:** `scrollY > 12` toggles `.scrolled` on header
- **No heavy keyframe animations** — gentle reveal-only design

### Logos in design

- `assets/jahad-light.png` / `assets/jahad-dark.png` — Jahad-Daneshgahi institutional seal
- `assets/airac-white.png` — AIRAC (مرکز راهبری پژوهش و پیشرفت هوش مصنوعی) wordmark
- `assets/light-logo.png` / `assets/dark-logo.png` — main university logo (دیجی‌یونیورسیتی)
- `assets/faculty/m1-m4` and `w1-w4` — 8 faculty portraits

**Note:** the design's co-brand pattern is **Jahad + AIRAC** as the hero institutional badge. The R1.3-Brand owner ack (existing) shows JDO (جهاد دانشگاهی) + dvcb (دانشگاه ولیعصر) co-brand. **Mapping needed in Q3 below.**

---

## C. Existing Home.tsx inventory

`apps/web/src/pages/Home.tsx` — 921 lines, `@ts-nocheck` (deferred per `PHASE_A_DEFERRED_TYPES.md`).

### Auth redirect (R1.3-B5 privacy fix)

```tsx
const auth = useAuth();
useEffect(() => { if (auth.isAuthenticated) go("dashboard"); }, [auth.isAuthenticated, go]);
if (auth.isAuthenticated) return <AuthLoadingSkeleton />;
```

**MUST PRESERVE** per owner directive «هیچ auth flow change».

### Sections (in render order)

| # | Section | Existing content text (verbatim) |
|---|---|---|
| 1 | HERO | Eyebrow «EST. 2026 · CHARTERED ONLINE UNIVERSITY · AI-NATIVE» |
|   |   | Title «دانشگاه آنلاین هوشمند ایران،» + «با ۲۴۸ برنامه و گواهی قابل اثبات» |
|   |   | Sub «از کلاس‌های زنده تا آزمایشگاه‌های مجازی، با همراهی هوش مصنوعی — همگام با استانداردهای جهانی LTI، xAPI، QTI و Open Badges 3.0. ۸ دانشکده، ۹۴ استاد، مدارک قابل راستی‌آزمایی.» |
|   |   | CTAs: «درخواست پذیرش» → `go("admissions")` · «دانشکده‌ها و برنامه‌ها» → `go("schools")` |
|   |   | 4 hero stats: ۸ دانشکده / ۲۴۸ برنامه / ۹۴ استاد / ۸٬۴۰۰ دانشجو |
|   |   | Hero3D cluster: Hero3DClassroom + Hero3DTutor + Hero3DAnalytics + Hero3DCredential |
| 2 | TRUST STRIP | Standards & affiliation row |
| 3 | STATS BAND | Stats with growth context |
| 4 | FACULTY SHOWCASE | Existing 8-faculty grid (`<FacultyShowcase go={go} />`) |
| 5 | CATALOG TEASER | Sample courses with `go("course")` links |
| 6 | TESTIMONIALS | 3 student stories + dual CTA |
| 7 | AGENT SYSTEM | Eyebrow «AGENT ARCHITECTURE», title «به‌جای یک چت‌بات، یک تیم آموزشی», 5 pillars (موتور یادگیری / پروفایل شناختی / تسلط / کلاس زنده / حاکمیت AI) |
| 8 | MARQUEE | Trusted-by universities (Tehran, Sharif, IUST, Beheshti, Stanford Online, MIT OCW, etc.) |
| 9 | KNOWLEDGE GRAPH | `<KnowledgeGraph/>` + 4 features about concept maps |
| 10 | PLATFORM ARCHITECTURE | `<ArchStack/>` 5-layer cloud-native + tech stack |
| 11 | STANDARDS | LTI · xAPI · QTI · Caliper · OneRoster · Open Badges 3.0 etc. |
| 12 | PLATFORM TOUR (24 cards) | Tour of role-specific surfaces |
| 13 | GET STARTED CTA | Final dual CTA + Footer |

### Navigation outbound from Home

`go("admissions")` (3 calls) · `go("schools")` (2 calls) · `go("programs")` (2 calls) · `go("catalog")` (1 call) · `go("course")` (1 call) · `go("dashboard")` (the auth-redirect)

### Co-brand

Rendered via `<Footer/>` from `apps/web/src/shared.tsx`. R1.3-Brand established JDO + dvcb co-brand. **No design change needed in Home.tsx** (Footer is global, not inside HomePage component).

### Chrome

Home renders **inside AppShell PUBLIC mode**. AppShell provides:
- Top-level `<Nav/>` (PUBLIC variant — shared.tsx Nav with `mode="public"`)
- Wrapping `<main>` element (page-shell)
- `<Footer/>` at bottom

This is the existing chrome pattern (post-R-Landing-v1 rollback per D41).

---

## D. Mapping table (THE DECISION MATRIX)

**Per owner directive:** «design = palette+layout+animation، Home = text content». i.e. visual elements from design get KEPT, content-text elements from existing get KEPT, conflicts resolved per element below.

### From design — KEEP (visual)

| Element | Where in design | Action in port |
|---|---|---|
| Color palette (navy + cobalt + gold + paper) | `styles.css :root` tokens lines 10-61 | **KEEP** — copy as `--xxx-home-v2` scoped vars under `.home-shell-v2` |
| Typography (Vazirmatn + Plus Jakarta) | `styles.css` body | **KEEP** — switch to `@fontsource/*` per R7.2 (self-host, not Google Fonts CDN) |
| Hero layout (split with co-brand chips + stat pills) | `app.tsx` Hero section | **KEEP** — adapt to existing text content |
| Feature card 3×2 grid with mouse-spotlight | `app.tsx` Features section + components.tsx | **KEEP** — animation included |
| Schools card grid (3×2 with featured one) | `app.tsx` Schools section | **KEEP** |
| Steps timeline (4-step) | `app.tsx` Steps section | **KEEP** |
| Faculty grid (8 cards with portraits) | `app.tsx` Faculty section | **KEEP** layout; **REPLACE** faculty list with existing FacultyShowcase data |
| Testimonials carousel (3) | `app.tsx` Testimonials section | **KEEP** layout; **REPLACE** stories with existing Testimonials data |
| Partners marquee (12 marks) | `app.tsx` Partners section | **KEEP** layout; **AUGMENT** partner list with existing marquee universities |
| FAQs accordion (6) | `app.tsx` FAQs section | **KEEP** layout + content (universal admission Qs apply) |
| Topbar (dark navy strip) | `app.tsx` Topbar | **CONDITIONAL** — see Q2 below |
| Reveal-on-scroll IntersectionObserver | `app.tsx` useEffect | **KEEP** — light-weight, no TBT hit |
| Mouse-spotlight on features | `app.tsx` useEffect | **KEEP** — lightweight |
| Scroll-aware header shadow | `app.tsx` `scrolled` state | **CONDITIONAL** — only if topbar/nav kept in scope |

### From existing — KEEP (content)

| Element | Where in existing | Action in port |
|---|---|---|
| `useAuth` redirect-to-dashboard for authed users | `Home.tsx` lines 32-37 | **KEEP** (R1.3-B5 privacy fix, owner directive «هیچ auth flow change») |
| Hero title text «دانشگاه آنلاین هوشمند ایران، با ۲۴۸ برنامه و گواهی قابل اثبات» | `Home.tsx` lines 73-75 | **KEEP** — owner's outcome-first headline |
| Hero sub paragraph (LTI/xAPI/QTI/Open Badges 3.0 standards) | `Home.tsx` lines 76-78 | **KEEP** — owner's standards-credibility text |
| CTAs «درخواست پذیرش» + «دانشکده‌ها و برنامه‌ها» with their `go()` targets | `Home.tsx` lines 80-87 | **KEEP** — these are functional links |
| 4 hero stats (۸ / ۲۴۸ / ۹۴ / ۸٬۴۰۰) | `Home.tsx` lines 100-103 | **KEEP** — these are owner's claims |
| AGENT ARCHITECTURE section (5 pillars) | `Home.tsx` lines 124-201 | **CONDITIONAL** — see Q1 |
| Trust strip / stats band / faculty / catalog / testimonials | `Home.tsx` lines 109-121 | **KEEP** as content; **RESKIN** with design palette |
| Knowledge Graph + Arch Stack + Standards + Platform Tour + Get Started CTA | `Home.tsx` lines 250+ | **CONDITIONAL** — see Q1 |
| `<Footer/>` from shared.tsx (JDO + dvcb co-brand) | `Home.tsx` end | **KEEP** — global Footer with R1.3-Brand co-brand |

### Conflicts (in both, decision required)

| Conflict | Design says | Existing says | Proposed default |
|---|---|---|---|
| Co-brand identity | Jahad + AIRAC (research center) | JDO + dvcb (R1.3-Brand owner ack) | **KEEP existing** (R1.3 owner-acked) → Q3 |
| Hero title | «دانشگاه برخط هوشمند ایران» (institutional) | «دانشگاه آنلاین هوشمند ایران، با ۲۴۸ برنامه و گواهی قابل اثبات» (outcome-first) | **KEEP existing** (owner directive Q1) |
| Stats numbers | ۱۲۸ هزار دانشجو / ۴۸۰ دوره / ۳۲۰ استاد / ۹۴٪ رضایت | ۸ دانشکده / ۲۴۸ برنامه / ۹۴ استاد / ۸٬۴۰۰ دانشجو | **KEEP existing** (owner's verified numbers) |
| Section: Features vs Agent Architecture | 6 generic features | 5 AI-agent pillars | **Q1: which is the visual structure for this slot?** |
| Section: Schools | 6 schools (AI, CS, Mgmt, Eng, Design, Health) | (not in existing as a distinct section) | **ADD design's Schools section** with existing numbers («۲۴۸ برنامه» split into the 8 schools from hero stats) |
| Section: Steps | 4 enrollment steps | (not in existing) | **ADD design's Steps section** verbatim — generic to any university |
| Section: Faculty | 8 cards with photos | FacultyShowcase component | **KEEP existing component**, restyled |
| Section: Courses | 6 sample courses | CatalogTeaser component | **KEEP existing component**, restyled |
| Section: Testimonials | 3 student stories | Testimonials component | **KEEP existing component**, restyled |
| Section: Partners | 12 institutional logos | Marquee universities | **MERGE**: design's partner cards + existing's marquee universities → richer mark grid |
| Section: FAQs | 6 admission/payment Qs | (not in existing) | **ADD design's FAQs section** verbatim |
| Topbar | Yes (dark navy with badges) | No | **Q2: keep topbar?** Adds visual richness but conflicts with existing AppShell Nav layout. |

---

## E. Three questions for owner (NO MORE)

### Q1 — Content sections: 5 AGENT pillars vs 6 generic FEATURES?

**Owner clarification needed.** The design has a 6-card FEATURES section (انعطاف زمانی / محتوای دانشگاهی / یار هوشمند / مدرک رسمی / جامعه دانشجویی / هزینه مقرون‌به‌صرفه). The existing Home.tsx has a 5-pillar AGENT ARCHITECTURE section (موتور یادگیری / پروفایل شناختی / تسلط / کلاس زنده / حاکمیت AI). Both occupy roughly the same vertical slot.

**Owner's prior text «نوشته‌های قبلی نگه دار»** points to keeping the AGENT ARCHITECTURE content. But the AGENT section's visual is hand-rolled in existing Home.tsx — porting to design's feature-card grid loses the agent-graph node/edge visual and the pillar number badges (۰۱، ۰۲...).

**3 options:**

- **Q1.a (cleanest, default proposed):** **KEEP AGENT ARCHITECTURE as-is** structurally; apply design palette + typography + reveal animation. The agent-graph + MasteryRing existing visuals remain. Feature-cards from design NOT ported (no slot).
- **Q1.b:** **REPLACE AGENT with design's FEATURES** — port the 6 features verbatim from design's content. Drop AGENT section. Cleaner visual unity with design but loses owner's «AI team not chatbot» message.
- **Q1.c:** **BOTH** — keep AGENT (in slot N), add FEATURES below (in slot N+1). Longer page but maximum content from both. Adds ~6 more cards worth of vertical scroll.

### Q2 — Topbar (dark navy strip with «جهاد دانشگاهی» badge + autumn admission notice)?

The design has a TOPBAR above the nav. The existing AppShell renders the global Nav directly (no topbar). Including the topbar means either:

- **Q2.a (default proposed):** **OMIT topbar**. Owner directive «هیچ chrome دیگه» — adding a topbar above the global Nav crosses scope. Stay strict.
- **Q2.b:** **Include topbar as a Home-only band above the AppShell Nav** — visually it appears above the nav but is rendered by Home.tsx via CSS `position: sticky; top: 0; z-index: 1`. Some visual leak risk into AppShell space.

### Q3 — Co-brand: Jahad + AIRAC (design) vs JDO + dvcb (existing per R1.3-Brand)?

Design's co-brand badges in hero: «جهاد دانشگاهی - بنیان‌گذار از سال ۱۳۵۹» + «مرکز راهبری پژوهش و پیشرفت هوش مصنوعی - AIRAC». Existing R1.3-Brand established JDO + dvcb (دانشگاه ولیعصر).

- **Q3.a (default proposed):** **KEEP R1.3-Brand co-brand** (JDO + dvcb) — owner-acked. Hero gets the Jahad+AIRAC badge LAYOUT but with existing logo files.
- **Q3.b:** **SWITCH to design's co-brand** — Jahad + AIRAC. Requires updating Footer too (currently shows JDO + dvcb), which is global scope leak — violates «هیچ chrome دیگه».
- **Q3.c:** **HYBRID** — Hero badges = Jahad + AIRAC (visual richness, design fidelity); Footer = JDO + dvcb (per R1.3). Each does what its level is for. Likely the most balanced.

---

## F. Implementation plan (PHASE 2, after owner ack)

### File-by-file scope (estimated)

| File | Operation | LOC est. | Notes |
|---|---|---|---|
| `apps/web/src/pages/Home.tsx` | REWRITE | ~600 (was 921) | Add `.home-shell-v2` wrapper, port sections per Q1/Q2/Q3 decisions. Retire `@ts-nocheck` (fully typed). KEEP auth redirect. |
| `apps/web/src/pages/home-v2.css` | NEW | ~1500 | Auto-generated from design's styles.css via `scripts/landing-v2-scope-css.mjs` (script-based prefixing like R-Landing-v1) but with all selectors prefixed `.home-shell-v2 ` + `--xxx-home-v2` scoped variable suffixes for the palette |
| `scripts/landing-v2-scope-css.mjs` | NEW | ~180 | Adapted from R-Landing-v1 `scripts/landing-scope-css.mjs`, with the lesson learned: NO `body:has()` hotfix rules — use a stricter `.home-shell-v2 *` cascade and rely on `box-sizing: border-box` already global |
| `apps/web/src/main.tsx` | MODIFY | +5 | **SW dispose**: comment out `serviceWorker.register(...)` + add one-time `unregister + caches.delete` cleanup at top |
| `apps/web/vite.config.js` | MODIFY | +1 / -0 | Add `disable: true` to VitePWA plugin block (preserves config for post-presentation re-enable per D45) |
| `apps/web/tests/visual/phase-a-landing-v2.spec.ts` | NEW | ~180 | 6 viewport × Home-only assertions (DOM contract + computed style + nav-button → /login, /register navigation) |
| `docs/PHASE_A_DECISIONS.md` | MODIFY | +60 | D45-impl entry (SW disposed) + D46 entry (R-Landing-v2 scope) |

**Total estimated LOC:** ~2526 (mostly auto-generated CSS), source-of-truth code (Home.tsx + script + spec + main.tsx + vite.config) = ~966 lines.

### Commit ordering (atomic, single-concern per owner directive)

| # | Commit | Concern |
|---|---|---|
| A | `Phase A R-Landing-v2.A — SW dispose for demo window (D45-impl)` | `main.tsx` unregister/clear + `vite.config.js` disable + decision log D45-impl |
| B | `Phase A R-Landing-v2.B — home-v2.css scoped from design styles.css` | `scripts/landing-v2-scope-css.mjs` + `apps/web/src/pages/home-v2.css` |
| C | `Phase A R-Landing-v2.C — Home.tsx rewrite (visual = design, content = existing)` | `Home.tsx` rewrite per Q1/Q2/Q3 |
| D | `Phase A R-Landing-v2.D — D12 spec` | `phase-a-landing-v2.spec.ts` |
| E | `Phase A R-Landing-v2.E — regression sweep evidence` | Re-run R1.1/R5/R6/R6.6/R7.12/gate-a-role-routing, document in `docs/PHASE_A_R_LANDING_V2_REVIEW.md` |

### What's OUT of scope (hard guards)

- ❌ AppShell.tsx — no change. (R-Landing-v1 lesson: this was where the `isLandingRoute → <Outlet/>` bug lived. NOT this time.)
- ❌ shared.tsx (Nav, Footer) — no change. AppShell renders global Nav + Footer; Home stays inside that chrome.
- ❌ Workspace routes — no touch.
- ❌ Auth flow — no touch.
- ❌ Global tokens in `apps/web/src/index.css` — no touch. All palette changes are `--xxx-home-v2` scoped.
- ❌ Service Worker config beyond Commit A's temporary dispose.

---

## G. Rollback strategy

**Single one-liner the owner can run if anything breaks on demo day:**

```bash
cd C:/digiuniversity && git revert --no-edit HEAD~5..HEAD && git push origin main
```

This reverts the 5 commits (A-E above) in one go, pushes to main, deploy auto-triggers.

**Tested before merge:**
- Dry-run the 5-commit revert chain locally before push to verify clean apply
- Verify post-revert HEAD matches pre-R-Landing-v2 hash exactly (`git diff` should be 0 for all touched files)
- Verify the SW dispose commit A's revert restores `serviceWorker.register(...)` and `VitePWA({ disable: false })` so the post-rollback site has working SW again

**Plan B if 5-commit revert fails (e.g. conflict with intervening commits from a different sub-R):**
```bash
git revert --no-edit <commit-A-hash> <commit-B-hash> <commit-C-hash> <commit-D-hash> <commit-E-hash>
git push origin main
```

Each commit's full SHA will be recorded in the review doc (Commit E) so owner can copy-paste.

**Plan C (nuclear):**
```bash
git reset --hard <pre-A-hash> && git push origin main --force-with-lease
```
Only if Plan A+B fail. Force-push to main requires owner explicit consent (per security rule). The pre-A hash will be recorded in Commit A's body.

---

## Status

| Item | Status |
|---|---|
| Audit doc | ✅ this file |
| Design fetched + inventoried | ✅ |
| Existing Home.tsx inventoried | ✅ |
| Mapping table | ✅ |
| 3 questions | ✅ Q1/Q2/Q3 with proposed defaults |
| Implementation plan | ✅ 5 atomic commits, scope boundaries |
| Rollback strategy | ✅ 5-commit one-liner + Plan B + Plan C |
| Owner ack | ⏳ pending |
| **CODE** | **⏳ NOT STARTED, awaiting ack** |

---

## Decision summary for owner

**3 binary choices to ack and we go:**

| Question | Default proposed | Alternate |
|---|---|---|
| Q1 — Content section | **Q1.a: keep AGENT ARCHITECTURE, restyle with design palette** | Q1.b: replace with design's 6 FEATURES / Q1.c: BOTH |
| Q2 — Topbar | **Q2.a: omit topbar (stay in AppShell chrome)** | Q2.b: include topbar above nav |
| Q3 — Co-brand | **Q3.c: hybrid — Hero badges = Jahad+AIRAC (design), Footer = JDO+dvcb (R1.3)** | Q3.a: all R1.3 / Q3.b: all design |

**One-line ack format:** «Q1.a Q2.a Q3.c شروع کن» (or other letter triples).

Until owner ack, **no code, no commits**. NPM scripts not touched. Local working tree clean (verified `git status -s` shows only untracked design files + this audit doc).

— Phase A author, 2026-05-26. R-Landing-v2 PHASE 1 audit per owner directive 2026-05-25. Awaiting Q1/Q2/Q3 ack.
