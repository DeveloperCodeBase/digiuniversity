# Architecture V2 — Notes & Backlog

> Backlog of ideas surfaced during Phase A that are NOT decisions, NOT promises, and NOT in scope for this session. This file is split into two parts: **(A) backport candidates** that could plausibly land in the current V1 build during a later sub-R if explicitly approved, and **(B) V2 vision** items that imply a wholesale rewrite and can only live in a future v2 fork. Nothing here is implied to be planned, scheduled, or merged-ready. See the closing note below for the discipline.

## A) Backport candidates — V1, behind explicit owner approval

These would slot into the existing Vite SPA + NestJS api stack without a rewrite. Each one needs an explicit owner authorization (a chat message like «backport Pre-Delivery checklist as R7») before any sub-R is opened.

### A1. Pre-Delivery checklist
A short, opinionated gate that runs against every new component before merge. Mirrors the discipline of the R1.4 D12 fix — automated checks for the bugs we keep rediscovering manually.

**Concrete items the checklist would assert:**
- `cursor: pointer` is set on every interactive element that isn't a `<button>` / `<a>` (catches the "fake button" anti-pattern).
- `:focus-visible` styling is set for every interactive element — explicit ring, not the browser default.
- `@media (prefers-reduced-motion: reduce)` overrides every animation > 200ms (kills the spin / parallax / scroll-jack at the source).
- Visual sweep runs at 4 viewports: **375 / 768 / 1024 / 1440**. (R6 used 375/768/1280; R5 used 6 widths. 4 is the minimum sufficient set; can be bumped without breaking.)

**Mechanism:** a new ESLint rule (`pre-delivery-checklist`) plus a small Playwright helper that the per-sub-R spec calls. Fail fast in `pretest`.

**Candidate slot:** R7 (after Gate A passes) **or** a Phase B polish PR. Owner decides.

**Cost estimate:** ~250 lines of rule + helper + 4-viewport baseline capture. Roughly the same size as the R4 audit-on-mutation rule.

### A2. Anti-patterns ESLint rule
A second custom rule that bans gradients, emoji-as-icon, and physical CSS direction props in the codebase. Direct mirror of the design-discipline decisions already documented in `PHASE_A_DECISIONS.md` (R6.6-D15 forbids physical `left:`/`right:`/`margin-left:` etc. for RTL safety).

**Concrete checks:**
- **No `linear-gradient` / `radial-gradient` with purple or pink hues.** Detected via hue-range parsing of CSS values. Decorative gradients in `r5-login-shell` and `r6-classroom-shell` are scoped under those shells; the rule allows whitelisted shells, blocks gradients elsewhere.
- **No emoji in JSX as icon glyphs.** Detected via a regex against `<…>👍</…>` patterns. Allowed in user-generated content (chat messages, reaction reels) and in mock-data string constants. Banned in component code.
- **Direction props: only `ms-*` / `me-*` / `ps-*` / `pe-*` / `start-*` / `end-*`.** Banned: `ml-*`, `mr-*`, `pl-*`, `pr-*`, `left-*`, `right-*` in component code. Banned: literal `margin-left:`, `margin-right:`, `padding-left:`, `padding-right:`, `left:`, `right:` in CSS files unless they appear as a symmetric pair (both sides set to the same value, so direction doesn't matter).

**Mechanism:** ESLint rule + a small CSS linter (`stylelint` or a hand-rolled grep). Both run in `pretest`.

**Candidate slot:** Phase B. Out of scope for Phase A.

**Cost estimate:** ~400 lines (rule + helper + initial backfill of the 90+ existing physical-margin references identified during R6.6's debug walkthrough).

### A3. WCAG 2.2 AA — 9 new criteria
WCAG 2.2 published in October 2023 added 9 success criteria over 2.1. The Compass Roadmap's "WCAG 2.2 AA" reference at Gate A is current; this entry calls out the specific new criteria the Gate A audit needs to expand to cover.

**New criteria (2.2 over 2.1):**
1. **2.4.11 Focus Not Obscured (Minimum)** — focused element must not be fully hidden by author-content sticky overlays. Status: current sticky navbar is 64px tall; need to verify scrollIntoView pushes the focused element below it. (R1.3 B1 sticky-shadow work touched this surface.)
2. **2.4.12 Focus Not Obscured (Enhanced)** — AAA, optional for V1.
3. **2.4.13 Focus Appearance** — focus indicator must be at least 2px thick with 3:1 contrast against the focused element. Status: R5 added explicit `:focus-visible` rings; the rest of the app inherits browser default which may or may not satisfy.
4. **2.5.7 Dragging Movements** — every drag-and-drop must have a click-only alternative. Status: current drag-and-drop surfaces are zero (mocked storyboards in Authoring). Phase C will introduce real drag (gradebook rubric drag, course-tree drag) — must ship with click alternatives from day 1.
5. **2.5.8 Target Size (Minimum)** — 24×24 CSS px minimum. R7-touch-targets spec already enforces 44px (more strict). No gap.
6. **3.2.6 Consistent Help** — same help affordance (chat, contact, FAQ) in the same place across pages. Status: current global AI FAB satisfies this; document it.
7. **3.3.7 Redundant Entry** — don't ask the same info twice in a multi-step flow. Status: relevant once Phase B onboarding flow ships.
8. **3.3.8 Accessible Authentication (Minimum)** — no cognitive function test in auth (e.g., "type the word in this image"). Status: current login uses email + password; no CAPTCHA; satisfied. If we later add CAPTCHA, must use accessible alternatives.
9. **3.3.9 Accessible Authentication (Enhanced)** — AAA, optional for V1.

**Candidate slot:** Gate A criteria expansion (extra checklist row per criterion) **or** a Phase B accessibility sub-R. Owner decides.

**Cost estimate:** ~200 lines of new axe-core custom checks + spec updates. Lighter than A1/A2 because most criteria need only structural assertions.

### A4. Vazirmatn self-host
Vazirmatn is loaded from `fonts.googleapis.com` in `apps/web/index.html:13`. Google Fonts is blocked in Iran without a VPN; users on standard Iranian ISPs (Mobinnet, Hamrah-e-Aval, Irancell, Shatel) see a fallback system font on first paint, then nothing if the system font doesn't have Persian glyphs.

**Backport:** Mirror the Vazirmatn 300/400/500/600/700/800/900 woff2 files to either:
  - The nginx `apps/web/public/fonts/` directory (served from the same origin).
  - An S3 / R2 bucket the user controls (CDN-served, no Google round-trip).

Update `index.html`'s `<link>` to point at the local copy. `font-display: swap` already ensures text is visible during the load.

**Mechanism:** Vite's `vite-plugin-fonts` or a simple manual `<link>` in `index.html` against the local files. The R5 + R6 templates already import Vazirmatn from `fonts.googleapis.com` — would migrate those too.

**Candidate slot:** Phase B notification service kick-off PR (it's already touching infra). Or earlier as a one-line ops PR if owner wants the font loading fixed today.

**Cost estimate:** ~30 lines (the woff2 files themselves go into `public/` and aren't counted as code). One-shot infra commit.

---

## B) V2 vision — wholesale rewrites, NOT V1 work

These are ideas worth recording so future-me (or a V2 author) doesn't re-discover them, but they cannot land in V1 without rewriting one or more entire layers. Each one is incompatible with the current Vite SPA + 2-service NestJS architecture and is **not** a backport candidate.

### B1. Next.js 15 App Router (replaces Vite SPA)
**What:** Migrate the frontend from Vite + React Router to Next.js 15 with the App Router. SSR/SSG by default; React Server Components; built-in route-level data fetching; built-in image optimization; built-in i18n routing (`/fa/...`, `/en/...` once we ship English).

**Why it's V2:** the migration touches every page, every route definition, every data-fetching pattern. The `useGo()` shim that Phase 14 introduced exists exactly because we don't want to do this in V1. Cost is months, not weeks.

**Why we'd consider it:** SEO matters for the marketing surfaces (`/`, `/about`, `/programs`, `/catalog`). SPA + client-side routing hurts crawl. Next.js SSR makes the marketing pages discoverable; the workspace stays client-side via its own segment.

### B2. Turborepo + 10-microservice split (replaces 2-service NestJS)
**Current:** `apps/api` (NestJS monolith with 18 modules) + `apps/ai-gateway` (FastAPI). That's 2 services + 1 frontend + 1 db.

**V2 proposal:** Turborepo with ~10 service slices:
  - `services/identity` — auth + RBAC + tenants + users
  - `services/academic` — universities + faculties + programs + courses + offerings + enrollments
  - `services/assessment` — quizzes + assignments + submissions + grading
  - `services/content` — modules + lessons + assets + recordings + transcripts
  - `services/live` — LiveKit room broker + polls + reactions + breakouts
  - `services/ai` — gateway + tutor + autograder + recommend + summarize
  - `services/analytics` — learning events + at-risk + engagement + dashboards
  - `services/community` — discussion threads + posts + Q&A
  - `services/notify` — email + SMS + push + in-app
  - `services/payments` — Zarinpal + IDPay + invoices + transactions

**Why it's V2:** moving from a NestJS monolith to a service mesh means message queues, distributed tracing, per-service auth gates, per-service DB or shared-DB-with-schema-isolation decisions, dual-write migrations multiplied by 10. Phase B's additive-migration policy was designed for a monolith; a mesh would need an entirely new policy.

**Why we'd consider it:** scale + team-of-teams. V1's monolith is fine for one engineer + one VPS. At ~5-10 engineers, the deploy-coupling becomes a bottleneck.

### B3. "PardisLearn" rename — DO NOT decide on the fly
**Current name:** DigiUniversity / دیجی‌یونیورسیتی. Used in domain, brand mark, footer, every email template, every Persian copy block.

**A hypothetical V2 might rename to PardisLearn or another tenant-neutral brand.** A rename touches every code reference, every DB record, every email template, every screenshot in docs, every Persian copy block — and most importantly, the domain. **Never make this decision in a code session.** It's a marketing decision; the code follows.

If a rename ever happens, it's a dedicated Phase X with its own gate (domain DNS cutover, redirect setup, search-engine reindex window, mail SPF/DKIM/DMARC update). Not a code change.

### B4. CAT/IRT adaptive testing (replaces classical scoring)
**Current V1 plan (Phase C):** classical assessment scoring — score = (correct / total) × max-points. Implemented via the `Quiz`, `QuizAttempt`, `Question`, `QuestionResponse` models.

**V2 proposal:** CAT (Computer Adaptive Testing) with IRT (Item Response Theory) parameter estimation:
  - Each item has IRT parameters (discrimination, difficulty, guessing) calibrated from response history.
  - Test starts with a medium-difficulty item; each subsequent item is chosen based on the test-taker's current ability estimate.
  - Test terminates when the standard error of the ability estimate falls below a threshold (typically ≤0.3).
  - Score reports the ability estimate (theta) + confidence interval, not a percentage.

**Why it's V2:** IRT calibration requires hundreds of responses per item. V1 doesn't have that data yet. CAT also requires a substantially different UI (one question at a time, no "back" button, no "see all questions" view) and assessment authoring tooling (item bank with IRT parameter editing).

**Why we'd consider it:** standard-bearing assessments (TOEFL, GMAT, GRE) are CAT. If DigiUniversity wants to credential at that tier, we'd need this.

### B5. Go service for LiveKit broker (replaces NestJS module)
**Current V1 plan (Phase D):** NestJS module `services/live` (under the api monolith) brokers LiveKit room creation, token minting, recording orchestration. LiveKit container runs in Docker Compose.

**V2 proposal:** standalone Go service for the live broker. Reasons:
  - LiveKit SDK is first-class in Go (`livekit-server-sdk-go`); NestJS uses the TS SDK with extra overhead.
  - Goroutines vs NestJS event loop — Go handles 10k+ concurrent room control connections more comfortably.
  - Separates the live-class realtime path from the rest of the api so a thunderstorm in one room doesn't backpressure JWT minting elsewhere.

**Why it's V2:** introduces Go to the codebase (currently TS + Python). One more language to maintain, one more CI pipeline, one more deploy target. Not worth it at V1 scale.

**Why we'd consider it:** if live-class becomes the dominant traffic shape (Phase D forward).

### B6. Spring Boot xAPI LRS (replaces NestJS module)
**Current V1 plan (Phase F):** NestJS module `apps/api/src/standards/xapi/` implements the xAPI 1.0.3 LRS endpoints (statements API, state API, profile API, activities API).

**V2 proposal:** standalone Spring Boot service for the LRS. Reasons:
  - The reference LRS implementations (ADL LRS, Yet Analytics SQL LRS, Veracity LRS, Rustici Watershed) are all Java/Spring. Compatibility testing against the xAPI conformance suite is well-trodden in that stack.
  - JVM xAPI ecosystems have richer tooling for statement validation, retrieval performance, and statement-pipe integrations.

**Why it's V2:** introduces Java + JVM to the codebase. Two services + two languages just for xAPI is heavy. V1 can ship a "good enough" xAPI module in NestJS that satisfies the conformance suite at ≥80%.

**Why we'd consider it:** if xAPI compliance becomes a sales-blocking certification requirement (Phase F+).

---

## Closing note

> **This file is a backlog, not a decision.** Every item in section A (backport candidates) is a candidate, not a commitment. Every item in section B (V2 vision) is a sketch, not a roadmap. Implementation of any entry requires a fresh explicit owner-message authorization in the chat — same D11 discipline that gates all scope additions in Phase A.
>
> No agent reading this file later should treat any item here as "the plan" or "approved" or "the right call". The decisions log (`PHASE_A_DECISIONS.md`) is the authoritative record of what was decided; this file is the authoritative record of what was **considered but not decided**.
>
> If an item moves from candidate to commitment, it gets its own sub-R memo, its own decision-log entry, and its own owner-message citation. Until then, this file is the parking lot.

— Phase A author, 2026-05-23
