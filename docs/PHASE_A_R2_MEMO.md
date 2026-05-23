# Phase A R2 — Memo (retire `@ts-nocheck`)

> Written before code. Memo commits before any implementation file.

## What I'm going to build

Remove the `@ts-nocheck` directive from every active file under `apps/web/src/`. 45 files currently have it. Each file is re-typed using the Phase 14.5 patterns saved to memory (catch-block narrowing, useState explicit types, declare-global in the assigner, useState({}) inference trap, useGo() shim) — never with a fresh `any` or `as any`.

Hard cap: ≤5 deferrals in `docs/PHASE_A_DEFERRED_TYPES.md` with explicit per-file justification (e.g., "Home.tsx needs >400 lines of SVG-prop typing to be sound — splitting into smaller commits is impractical without a parallel design refactor").

## Files I will touch (categorised by complexity)

**Trivial — components (17 files, 5-65 lines each):** widgets.tsx, Stat.tsx, IconButton.{stories.tsx,tsx}, MasteryRing.{stories.tsx,tsx}, StatCard.{stories.tsx,tsx}, Feature.{stories.tsx,tsx}, Toggle.{stories.tsx,tsx}, Sparkline.{stories.tsx,tsx}, FormField.{stories.tsx,tsx}. Most are 1-3 prop typings. Stories files often just need `Meta` / `StoryObj<>` generic args.

**Medium — utilities (3 files):** icons.tsx (77), States.tsx (120), motion.tsx (173).

**Pages (25 files, sorted smallest-to-largest):** Programs (115), Search (131), Assessment (150), Recordings (183), Community (184), Course (200), Credential (219), Dashboard (221), Instructor (236), MyCourses (245), Analytics (255), Authoring (255), Catalog (296), Admissions (306), Progress (345), AssessmentLive (373), Settings (401), Tutor (460), CourseLive (464), More (608), Classroom (644), Roles (658), University (685), Productivity (785), Academic (825), Home (908).

Auth.tsx (1059) is NOT @ts-nocheck'd — already typed.

## Execution batches

Each batch is one commit. After every batch: `.\scripts\remote.ps1 up` + check the vite build output for TS errors. If the build fails, the commit is reverted and re-attempted with the right types.

| Batch | Files | Estimated diff |
|---|---|---|
| **R2.1** | widgets.tsx + 7 smallest components (≤30 lines each) | ~150 lines |
| **R2.2** | Sparkline + FormField + StatCard + Toggle pairs (.tsx + .stories.tsx) | ~250 lines |
| **R2.3** | icons.tsx + States.tsx | ~200 lines |
| **R2.4** | motion.tsx alone | ~180 lines |
| **R2.5** | Pages 1: Programs + Search + Assessment + Recordings | ~250 lines |
| **R2.6** | Pages 2: Community + Course + Credential + Dashboard | ~250 lines |
| **R2.7** | Pages 3: Instructor + MyCourses | ~250 lines |
| **R2.8** | Analytics + Authoring | ~250 lines |
| **R2.9** | Catalog + Admissions | ~300 lines |
| **R2.10** | Progress + AssessmentLive | ~300 lines |
| **R2.11** | Settings | ~200 lines |
| **R2.12** | Tutor | ~230 lines |
| **R2.13** | CourseLive | ~230 lines |
| **R2.14** | More | ~300 lines |
| **R2.15** | Classroom | ~320 lines |
| **R2.16** | Roles | ~330 lines |
| **R2.17** | University | ~340 lines |
| **R2.18** | Productivity | ~390 lines (over grace — may split) |
| **R2.19** | Academic | ~410 lines (over grace — may split) |
| **R2.20** | Home | ~450 lines (over grace — likely split) |

A few pages (Productivity / Academic / Home) will likely need a sub-split (e.g., type the top-level component first, defer SVG-heavy children to a follow-up). If a file's typing genuinely requires >450 line diff, that's a candidate for DEFERRED_TYPES.md.

## Patterns to apply per file

From `~/.claude/.../feedback_phase14_5_lessons.md` + `feedback_phase14_lessons.md`:

1. **Props typing:** every component `({ a, b, c })` gets an `interface XProps { a: ...; b: ...; c?: ... }` defined above + applied to the component signature.
2. **useState explicit types:** `useState<T>()` for non-trivial generics — never let TS infer `never[]` from `useState([])`.
3. **Catch-block narrowing:** `catch (err: unknown)` + `if (err instanceof Error) { ... } else if (err instanceof ApiError) { ... }`. No `(err as any).message`.
4. **Global `window.*` accessors:** `declare global { interface Window { toast?: ToastApi; ... } }` placed in the file that ASSIGNS the global, not in consumers.
5. **useGo + Go shim:** `const go = useGo(); function handleClick(): void { go("dashboard"); }` — never re-type `go` per page.
6. **Stories files:** `import type { Meta, StoryObj } from "@storybook/react"; const meta: Meta<typeof Component> = { ... }; type Story = StoryObj<typeof Component>;`
7. **SVG path math (Sparkline, MasteryRing, etc.):** typed `number` arrays, typed return types on helper fns; the path-d expression itself can stay un-narrowed via `String.prototype.split` chains that already TS-narrow.

**Never add `as any` or `any` shorthand.** If a value is genuinely opaque (e.g., a third-party untyped lib result), narrow it with a `Pick<>` or a typed adapter, not a cast.

## Risks I see

1. **Vite build fails on first push.** Mitigation: if `npm run build` returns non-zero, revert the batch's commit, identify the specific file/types blocking, and either fix or move that file into a follow-up batch.
2. **A page's @ts-nocheck was masking a real bug.** Mitigation: every batch is followed by `.\scripts\remote.ps1 visual -Service phase-a-r1-1-appshell` (or one of the existing 4 specs) — automated checks catch regressions where the page no longer renders.
3. **The `data.js` import** in some pages (e.g., `Roles.tsx:15: import { EVENTS } from "../data.js"`). `.js` files don't carry types; need a `data.d.ts` declaration OR import-with-jsdoc-types. Will create `data.d.ts` if needed.
4. **Mock vs real type confusion.** Some pages use `role.*` and `auth.user?.*` interchangeably. R1.4 B5 fix already established the pattern (gate on `auth.user`, use `role.*` only as a labeling fallback never an identity). Re-applying that pattern in every page is part of the typing.

## Out of scope for R2

- Behavioural changes (the @ts-nocheck retirement is a typing exercise, not a refactor).
- New features.
- CSS changes.
- Anything not strictly required to satisfy `tsc`.

If I find an obvious bug while typing a file (e.g., `if (foo = bar)` instead of `==`), I do NOT fix it in R2 — I log it in `PHASE_A_OUT_OF_SCOPE.md` with the file:line and move on.

## DoD for R2

- [ ] `grep -E "^//\s*@ts-nocheck|^/\*\s*@ts-nocheck" apps/web/src -r` returns ≤ 5 files
- [ ] All ≤5 deferred files listed in `docs/PHASE_A_DEFERRED_TYPES.md` with per-file ≥3-sentence justification
- [ ] `.\scripts\remote.ps1 up` succeeds (vite build green)
- [ ] All 4 existing visual specs (R1.1, R1.2, R1.3, R1.4) still pass after R2 lands (no regression)
- [ ] No new `any` / `as any` / `as unknown as X` introduced (grep audit)
- [ ] **Owner manual smoke on real device** — same 6-step checklist from R1.4 review — confirms no visual regression
- [ ] R2 review doc written, owner ack received

## What happens after R2 lands

- Per the Phase A plan: R3 (ten role dashboard differentiation) starts. R3 builds typed widget components per role, which depends on R2's types being real.
