# Phase A R1.3 — Post-smoke fixes + sidebar redesign + brand integration

> Written before code. Locks the plan. Memo commits before any implementation file.

## Why R1.3 exists

Owner ran the R1 manual smoke and found 6 bugs the Playwright assertions missed. R1 cannot move to R2 until they're fixed. Plus one new architectural decision (D9: hamburger-everywhere sidebar) and a brand integration request (organizational logos + footer copyright + About page rewrite).

## Scope summary

**Bug fixes (B1–B5):** sticky navbar, login layout, dashboard+profile responsive minimum, workspace drawer not opening on mobile (R1.1 regression manual found), landing privacy leak (auth user visible before redirect resolves).

**Architectural redesign (D9):** sidebar is hamburger-toggled on **every** viewport, not just <lg. Notion / Linear / Gmail / GitHub pattern. Closed by default, state persisted in localStorage, exception only for ≥3xl (1536px) workspace users who previously opened it.

**Brand integration:** wire the two organizational logos (light + dark theme variants), add a professional Persian copyright footer on every page, rewrite the About-page organization paragraph.

**B6 (live classroom mobile):** deferred to Phase D R1 (LiveKit ground-up rewrite). Logged in `PHASE_A_OUT_OF_SCOPE.md`. Do not touch in R1.3.

**Total budget:** ≤900 lines across all R1.3 commits combined. Each individual commit ≤300 lines per the existing rule (R1.1-D7 grace allowed for code+test coupling).

## Decisions added to `PHASE_A_DECISIONS.md`

- **D9** — Sidebar is hamburger-toggle on every viewport (rationale recorded)
- **D10** — Manual smoke is the authoritative visual check; Playwright `toBeVisible` ≠ visually correct (memory rule saved)

## Out-of-scope deferrals

- **B6** — Live classroom mobile rewrite → Phase D R1 (LiveKit). Logged.

## Execution order (per owner)

| # | Bug | Owner | Rationale | Files (max 15) |
|---|---|---|---|---|
| 1 | B5 — landing leak | privacy critical | first since data exposure | Home.tsx, AppShell.tsx, optional new AuthLoadingState, new spec |
| 2 | B1 — sticky navbar | UX critical | small CSS change | styles.css |
| 3 | B4 — workspace drawer not opening | regression debug | needs root-cause, likely subsumed by D9 | AppShell.tsx, shared.tsx |
| 4 | D9 — hamburger-toggle everywhere | biggest unit | redesigns shell; B4 may auto-resolve | AppShell.tsx, shared.tsx, styles.css, localStorage hook, spec |
| 5 | B3 — dashboard/profile minimum responsive | mobile correctness | scope: overflow-x-hidden, vertical stack, single-col forms <md | Dashboard.tsx, Productivity.tsx (Profile), styles.css |
| 6 | B2 — login minimum layout fix | first-impression critical | scope: center, max-w 420/480, role chip 2-col, padding | Auth.tsx (LoginPage), styles.css |
| 7 | Brand integration (logos + footer + About) | organizational | post-fix polish | public/logos/*, shared.tsx (Nav brand + Footer copyright), Roles.tsx (AboutPage) |

Each item is its own commit. R1.1 + R1.2 specs must continue to pass after each commit (we re-run after all 7 land).

## Files I need from you before starting item 7 (logos)

Save the two logos you attached at these exact paths (PNG is fine; SVG preferred if you have the vector source):

- `apps/web/public/logos/jdo-light.png` — **black-on-white** version (use on light theme + on white backgrounds)
- `apps/web/public/logos/jdo-dark.png` — **white-on-transparent** version (use on dark theme)

If you have SVG masters, drop them as `.svg` instead; the integration code accepts either via the file extension. I'll write the Nav brand + Footer code so it picks the right asset by current theme.

I'll work items 1–6 while you save these. Item 7 lands last.

## Professional Persian for footer + About (owner-approved edits)

You gave me draft text with three spelling/grammar issues:
- `پزوهش` → should be `پژوهش` (پ + ژ + و + ه + ش; the second letter is ژ, not ز)
- `متعاق` → should be `متعلق` (متعلق به = belongs to)
- `این روساخته` → colloquial; needs formalising

### Footer copyright (every page)

> © ۱۴۰۵ — تمامی حقوق مادی و معنوی این وب‌سایت، نشان‌های تجاری و محتوای آن، متعلق به **مرکز راهبری پژوهش و پیشرفت هوش مصنوعی جهاد دانشگاهی** است. هرگونه بازنشر یا بهره‌برداری بدون اجازه کتبی ممنوع است.

Shorter variant for compact footer rows:

> © ۱۴۰۵ مرکز راهبری پژوهش و پیشرفت هوش مصنوعی جهاد دانشگاهی — تمامی حقوق محفوظ است.

The long form goes in the marketing footer (PUBLIC routes); the short form in the workspace footer (if any) or as a compact line beneath the brand mark.

### About page paragraph (replaces `pages/Roles.tsx` AboutPage content)

> این پلتفرم توسط **مرکز راهبری پژوهش و پیشرفت هوش مصنوعی جهاد دانشگاهی** طراحی و توسعه یافته است. مرکز راهبری، با اتکا به تجربه‌ی چهار دهه‌ای جهاد دانشگاهی در عرصه‌ی پژوهش و آموزش عالی کشور، مأموریت دارد بسترهای پیشرفته‌ی هوش مصنوعی، یادگیری ترکیبی و آموزش آنلاین را در نظام دانشگاهی ایران توسعه دهد و در دسترس پژوهشگران، دانشجویان و استادان قرار دهد.
>
> دیجی‌یونیورسیتی نخستین خروجی عملیاتی این مأموریت است: یک زیرساخت دانشگاه آنلاین کاملاً بومی، استاندارد-محور (LTI 1.3، xAPI، QTI، Caliper) و آماده‌ی استقرار در هر دانشگاه یا سازمان آموزشی.

## DoD for R1.3 (all must pass before R2 starts)

- [ ] B1: navbar `position: sticky` on every viewport, shadow on scroll > 4px, backdrop-blur not opaque. Manual scroll-test confirms.
- [ ] B2: `/login` layout centered (vertical + horizontal), max-w-[420/480px], role chips 2-col grid not vertical list, logo top + form middle + footer link bottom. Spec: `toHaveCSS("max-width", ...)` + viewport screenshot.
- [ ] B3: dashboard wrapper `max-w-full overflow-x-hidden`, widgets stack vertical <md, profile single-col <md / 2-col ≥md. Manual + Playwright at 375px confirms no horizontal scroll, no overflow.
- [ ] B4: at 375px, login → tap hamburger → drawer **actually** opens with sidebar items (not public nav links). Spec: real assertion + manual.
- [ ] B5: log in as student, navigate to `/` → URL changes to `/dashboard` within 200ms, no flash of "نسرین رضوی" / email visible on landing. AuthLoadingState renders during the resolve window. Spec catches the privacy leak.
- [ ] D9: hamburger visible on every viewport, sidebar closed by default everywhere, click → drawer slides from right (RTL), click item → navigate + auto-close, click backdrop → close. localStorage `digiu_sidebar_pref` persists per user. Exception only at ≥3xl + workspace + persisted=open.
- [ ] Brand: light + dark logos load correctly per theme, footer copyright present on every PUBLIC route (and dimly on workspace if you decide), About page Persian paragraph rendered.
- [ ] R1.1 + R1.2 specs all still green (no regression)
- [ ] New spec `tests/visual/phase-a-r1-3-fixes.spec.ts` — 6 assertions, one per bug + 1 for D9 + 1 for brand
- [ ] Manual smoke evidence in `docs/phase-a-r1-3-evidence/`
- [ ] `docs/PHASE_A_R1_3_REVIEW.md` written
- [ ] **PAUSE for owner re-test**

## What R1.3 does NOT do (and why R3 / R5 still exist)

- Does **not** ship 10 distinct role dashboard widgets — that's R3
- Does **not** ship the polished 2-column login with marketing visual + zod validation + lockout countdown — that's R5
- Does **not** ship the audit-on-mutation ESLint rule — that's R4
- Does **not** retire `@ts-nocheck` — that's R2 (next, after R1.3 lands)

R1.3 = minimum viable fixes to the broken-on-mobile state + the sidebar paradigm shift. R3 and R5 build on this base.
