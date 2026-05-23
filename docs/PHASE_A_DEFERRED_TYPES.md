# Phase A — `@ts-nocheck` files deferred

> R2 retired 43 of 45 active `@ts-nocheck` files. Two remain, both with explicit prior-art justification and a follow-up plan. Hard cap is ≤5; we're well under.

## Deferred files (2 of 5 cap)

### 1. `apps/web/src/pages/Classroom.tsx` (644 lines)

**Why deferred:** the live-classroom page is the most overlay-dense surface in the SPA — Radix-backed Dialog (poll), Sheet (breakout), reactions float, host controls, attendance pane, AI tutor inline panel. Per the explicit Phase 16.5 ruling baked into the file header ("Phase-16 R6 leaves @ts-nocheck in place per the Phase 16.5 ruling… the poll + breakout overlays were swapped to Radix-backed Dialog / Sheet in this commit; the rest of the file remains untyped"), R2 honours that decision and does not break the deferral.

**What blocks immediate typing:**
- Five distinct sub-views (lobby / live / breakout / ended / replay) sharing a single component tree.
- Many `useState` slots whose runtime shape isn't documented anywhere (chat messages, reactions, poll responses, breakout rooms, AI tutor prompts).
- Heavy interplay with the `claude-in-chrome` / WebRTC mock state — current types in `apps/web/src/api/endpoints.js` for `classSessionsApi` are loose.

**Follow-up plan:** Phase D (Live Classes — LiveKit ground-up rewrite). When the live-classroom infrastructure becomes real (LiveKit + Egress + faster-whisper per the compass roadmap), the entire Classroom.tsx is rewritten against the Phase D contracts, with full types from the start. No incremental typing of the current mock-heavy file makes sense — the rewrite is cheaper.

### 2. `apps/web/src/pages/Home.tsx` (908 lines)

**Why deferred:** the home/landing page is 908 lines of inline JSX marketing layout. Per the explicit Phase 16 R2 ruling baked into the file header ("Phase-16 R2 deliberately leaves @ts-nocheck in place: the file is 530+ lines of inline JSX and the type sweep is scheduled for R16 (cleanup) after the new sections + primitives land. R2 only adds the auth-aware redirect + outcome-first headline."), R2 honours that decision.

The file already has the `HomePageProps` interface — only the file-wide `@ts-nocheck` prevents it from being checked.

**What blocks immediate typing:**
- 908 lines of marketing sections (hero, stats, principles, testimonials, FAQ, footer link blocks).
- Multiple inline sub-components (Hero, StatsStrip, TestimonialCarousel, FAQ, etc.) that would each need their own Props interface.
- The R3 sub-phase (Ten role dashboard differentiation) will rewrite parts of the landing's stats strip and CTA blocks; typing now would burn effort that R3 changes anyway.

**Follow-up plan:** retire in a dedicated post-Gate-A "Home.tsx polish" commit, after R3 stabilises the landing CTAs. Estimated ~150 lines of net change (mostly new Props interfaces + small narrowings) per the file's own R16 plan.

## Files NOT deferred (typed in R2)

The remaining 43 files were typed in batches R2.1 through R2.9 — see commit chain `fa59898` (R2.1) → `199cd82` (R2.9). Of those:

- **17 components** (R2.1, commit `fa59898`)
- **3 utilities** — icons, States, motion (R2.2, commit `ba19ea9`)
- **4 small pages** — Programs, Search, Assessment, Recordings (R2.3, commit `ac583e0`)
- **4 medium pages** — Community, Course, Credential, Dashboard (R2.4, commit `04a8a5a`)
- **4 medium pages** — Instructor, MyCourses, Analytics, Authoring (R2.5, commit `64cecb9`)
- **4 medium pages** — Catalog, Admissions, Progress, AssessmentLive (R2.6, commit `dd031a0`)
- **3 medium pages** — Settings, Tutor, CourseLive (R2.7, commit `cb1bd11`)
- **3 multi-export pages** — More, Roles, University (R2.8, commit `e104c14`)
- **2 multi-export pages** — Productivity, Academic (R2.9, commit `199cd82`)

= 17 + 3 + 4 + 4 + 4 + 4 + 3 + 3 + 2 = **44 component-or-page files**. Plus the original 17 component .tsx + 8 stories.tsx = the 45 active `@ts-nocheck` count - 2 deferred = 43 retired in R2.

## Known follow-ups (not blockers for R2 DoD)

- **`apps/web/src/api/endpoints.d.ts`** — currently absent. The `.js` api-client modules return implicit `any` for every endpoint. R2 typed page-level state slots with `any` where the response shape isn't documented (e.g., Progress's `summary` / `risk` / `tenantSummary`; AssessmentLive's `assessment` / `submission` / `aiDraft`; CourseLive's `course` / `sessions` / `assessments`). A follow-up post-Gate-A PR should:
  - Create `apps/web/src/api/endpoints.d.ts` declaring every endpoint's return shape.
  - Replace the page-level `useState<any>` slots with the proper `useState<EndpointResponse>` types.
  - That PR is mechanical once the .d.ts exists; expected diff ~150 lines.

- **`apps/web/src/data.d.ts`** — currently absent. The `data.js` mock data flows as `any`. Lower priority than the api endpoints.d.ts because it only affects render code, not data flow. Could be folded into the same post-Gate-A PR.
