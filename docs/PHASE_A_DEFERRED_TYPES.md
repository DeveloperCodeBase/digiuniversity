# Phase A — `@ts-nocheck` files deferred

> R2 retired 43 of 45 active `@ts-nocheck` files. **R6 brought Classroom.tsx down to typed.** **R-Landing brought Home.tsx down to typed** (rewrite per D37/D38/D39 ships fully typed; the old 908-line @ts-nocheck'd file is replaced). Active deferred count: **0**.

## Deferred files (0 of 5 cap)

### ~~1. `apps/web/src/pages/Classroom.tsx`~~ — retired in R6

The 644-line monolith was replaced in Phase A R6 (Classroom redesign from owner template). The new shell lives under `apps/web/src/pages/classroom/` (ClassroomShell, Stage, AIPanel, CourseHeader, classroom-atoms) and is fully typed. The old path (`apps/web/src/pages/Classroom.tsx`) now re-exports the new shell so `router.tsx`'s import keeps working. No `@ts-nocheck` anywhere in the classroom tree.

### ~~2. `apps/web/src/pages/Home.tsx`~~ — retired in R-Landing

The 908-line `@ts-nocheck`'d Home.tsx was replaced in Phase A R-Landing (Landing redesign from owner template per D37 / D38 / D39). The new Home.tsx ships **fully typed**: `HomePageProps` typed, every sub-component (HomeNav, Stat, Feature, TechRow, MasteryRing, Hero3D{Classroom,Tutor,Analytics,Credential}) has explicit Props interfaces, all data tables (COURSES, TOUR_CARDS, MARQUEE_PARTNERS, ANALYTICS_BARS) carry typed row interfaces. **No `@ts-nocheck` anywhere in Home.tsx.**

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
