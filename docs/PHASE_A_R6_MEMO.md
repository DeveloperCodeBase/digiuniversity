# Phase A R6 — Memo (Classroom + AI redesign from owner template)

> The کلاس زنده + AI page gets the same template-driven redesign treatment as R5 (login): take the owner-provided HTML/CSS/JS in `docs/my-upload/classroom/`, port it to typed React inside the existing AppShell, ship mock-only with visible MockBadge per the Phase-A stub policy, and add D12 visual assertions across breakpoints. The deferred `@ts-nocheck` on `Classroom.tsx` (R2) gets retired in the same change since the file is rewritten end-to-end.

## What the template gives us

`docs/my-upload/classroom/` is a working static React+Babel app showing a 3-pane live-class workspace:

1. **Course header** — Persian course title, instructor name, day/time/credits, live recording pill, participant counter, host indicator, JetBrains-Mono timer pill (`00:46:10`).
2. **Stage panel**
   - Top tags strip: نمایش اسلاید · AI همگام · زیرنویس · توجه ۸۹٪ · فصل ۴
   - **Participant rail** — vertical column at ≥920px (76px wide), horizontal scroll-strip on phones; tile-per-participant with init letter, host gold border, speaking green glow, mic-off badge, "+۳۵ بیشتر" overflow chip.
   - **Slide canvas** — dark gradient slide (16:9 aspect) with REC badge + slide counter + AI insight chip + live caption + slide-nav pill. The canvas background is an animated 4-layer neural net (rAF + reduced-motion guard).
   - **Reactions row** — 6 emoji circles (👏 🎯 💡 ❤️ 🔥 🤔); pressing one launches a fly-up animation from the button position.
   - **Control bar** — mic / cam / screen / hand toggles, notes + breakout icon buttons, AI panel toggle, connection-quality pill, خروج (leave) danger button.
3. **AI panel** (sticky aside at ≥920px, bottom sheet on phones)
   - **Tabs**: دستیار (chat) · زیرنویس (live transcript) · پرسش (Q&A with vote) · نظرسنجی (live poll + concept timeline)
   - Each tab has its own sticky head with status pill ("AI", "زنده", count badge, "32s closing in")
   - Suggestion chips above chat input, auto-resize textarea, send button.
   - Q&A tab has an ask-input + sorted list (pinned > votes), tag pills (هایلایت/کاربردی).
   - Poll tab has options with animated `inline-size` bars, correct-answer indicator after close, plus a concept-timeline sidebar showing what was covered when with a NOW indicator on the current concept.
4. **FAB** on narrow — opens the AI panel as a bottom sheet (already exists in AppShell as the global AI FAB, but this page-local FAB gets a `۳` badge that the global one doesn't).

The template's own topbar + sidenav are NOT used — AppShell already owns those per R1.1.

## Scope discipline (what R6 is and isn't)

**R6 ships VISUAL + INTERACTION POLISH:**
- Full 3-pane layout with all 4 AI tabs functional against mock state
- Animated SVG/canvas slide background (rAF + `prefers-reduced-motion` guard)
- Live caption rotation (`setInterval` ticking through mock caption queue)
- Reactions fly animation (DOM-anchored, ephemeral state)
- Tab switching, suggestion chips, poll selection, Q&A voting/asking — all wired to local state
- Side rail of participants with overflow chip
- Mobile bottom-sheet AI panel + page-local FAB

**R6 does NOT touch (Phase D will):**
- LiveKit integration (no WebRTC, no peer connections, no actual video tiles)
- Real AI Gateway calls (chat replies stay canned per the template)
- Persistent transcript / Q&A / poll data (all in-component state, lost on refresh)
- Whisper transcript (the wave animation in the live tab is decorative)
- Real participant identity (PARTICIPANTS array stays mock)

Every mocked surface gets a visible `<MockBadge />` per the Phase-A external-dependency policy, so the user is never misled into thinking the page is wired.

**R6 retires `@ts-nocheck` on Classroom.tsx** — the file gets a full rewrite, so this is the natural moment to bring it strict. After R6, deferred-types count drops from 2 → 1 (only Home.tsx remains under the 5-cap).

## Why "exactly like this"

The template's CSS is the law for this page. I'll lift the styles wholesale and scope them to a `.r6-classroom-shell` wrapper, the way R5 scoped to `.r5-login-shell`. The CSS variables (`--navy-800`, `--gold`, `--blue-100`, etc.) get reused or aliased to the existing styles.css token names — no parallel design system. The few inline-style islands in PollTab + QATab from the template port across as-is.

## Component layout (where files land)

- **`apps/web/src/pages/classroom/ClassroomShell.tsx`** — top-level page that composes the three sections. Reads `useGo()`, `useAuth()` for the user's display name + initial avatar, mounts the breadcrumb (already provided by AppShell at R1.2 — this just sets the title).
- **`apps/web/src/pages/classroom/CourseHeader.tsx`** — banner above the workspace grid.
- **`apps/web/src/pages/classroom/Stage.tsx`** — composes `StageTopTags`, `ParticipantRail`, `SlideCanvas`, `SlideView`, `Reactions`, `ControlBar`.
- **`apps/web/src/pages/classroom/AIPanel.tsx`** — composes `ChatTab`, `LiveTab`, `QATab`, `PollTab` + the bottom-sheet vs sticky-aside switch.
- **`apps/web/src/pages/classroom/classroom-atoms.tsx`** — types, mock data (SLIDES, PARTICIPANTS, CAPTION_QUEUE, TRANSCRIPT, QUESTIONS, INITIAL_CHAT, SUGGESTIONS, TABS), tiny shared helpers, the SlideCanvas component (rAF), Pill component.
- **`apps/web/src/pages/Classroom.tsx`** — thin shim that re-exports `ClassroomShell` so existing imports in `router.tsx` keep working. The old 644-line file is replaced.
- **`apps/web/styles.css`** — append a `.r6-classroom-shell` scope with all the CSS from `docs/my-upload/classroom/src/styles.css`, mapped to existing tokens where possible.

## How this fits AppShell (R1.1+R1.2+R1.3+R1.4)

The template ships its own `.app` grid with sidenav column. Our AppShell already owns that. R6 mounts only the **page body** inside AppShell's workspace area:

```
<AppShell>                       ← R1.1 chrome
  <Layout>                       ← R1.2 breadcrumbs
    <ClassroomShell go={go} />   ← R6 content
  </Layout>
</AppShell>
```

The page body is `page-head + course-head + workspace`. Page-head from the template is dropped (breadcrumbs are already at AppShell layer per R1.2). The two FABs (template's AI FAB + AppShell's global AI FAB) coexist for now — R6 mounts the AI FAB only on `<lg` viewports where the AI panel collapses; AppShell's global FAB is the route-level entrypoint.

## Visual contract per D12

Each spec assertion in `phase-a-r6-classroom.spec.ts` checks 5 points:
1. **DOM** — the surface element exists (`role`, `aria-label`)
2. **Computed style** — the surface has non-zero dimensions (height > 40px for pills, > 200px for the slide)
3. **Viewport position** — surface is within `0 ≤ x < innerWidth` AND `0 ≤ y < innerHeight`
4. **No overlap** — the slide ↔ AI panel boundary at 920px+ is exactly the workspace gap; the participant rail does not overlap the slide
5. **Responsive** — no horizontal overflow at 375/768/1280

Spec hits 6 routes × 3 viewports (375 / 768 / 1280) = 18 assertions, organized as 12 critical paths. Mirroring the R3 + R5 contract.

## Budget

| Component | Est. lines |
|---|---|
| `classroom-atoms.tsx` (icons subset, types, mock data, SlideCanvas) | ~240 |
| `CourseHeader.tsx` | ~110 |
| `Stage.tsx` (with rail + slide + reactions + controls) | ~330 |
| `AIPanel.tsx` (4 tabs + sheet/aside switch) | ~440 |
| `ClassroomShell.tsx` | ~70 |
| `Classroom.tsx` (re-export shim) | ~6 |
| `styles.css` appendix (scoped under `.r6-classroom-shell`) | ~700 |
| `phase-a-r6-classroom.spec.ts` | ~120 |
| `docs/PHASE_A_R6_MEMO.md` | ~120 (this file) |
| `docs/PHASE_A_R6_REVIEW.md` | ~100 |
| **Total** | **~2,236** |

That's over the 300-line target by 7×. Per R1.1-D7 the cap is a target with grace and the vertical-slice rule says we don't split test from code or page from CSS to fit budget. R6 is one vertical slice — a single user-facing page — and the CSS is the bulk because the template's visual fidelity is the deliverable. Splitting CSS into separate files would only add file-count noise; the scope is already a single class hierarchy (`.r6-classroom-*`). The single PR is the right unit.

I will hold to the rule strictly inside the budget: no companion infrastructure work, no other-page touches, no test/code splits.

## DoD for R6

- [ ] 5 new files under `apps/web/src/pages/classroom/` + 1 shim Classroom.tsx + CSS appendix
- [ ] `@ts-nocheck` removed from Classroom.tsx; deferred count: 2 → 1
- [ ] Mock data structures exported from `classroom-atoms.tsx` shaped to match the (future) Phase-D LiveKit/AI Gateway response types so the swap is a one-file change
- [ ] Every mocked widget has a visible `<MockBadge />` per the Phase-A external-dependency policy
- [ ] Animated SlideCanvas respects `prefers-reduced-motion: reduce` (skips the rAF loop)
- [ ] Responsive at 375 / 768 / 1280 (and ≥1440 for the docked-sidenav variant — AppShell handles that)
- [ ] No horizontal scroll at 375px
- [ ] 12 D12 assertions in `phase-a-r6-classroom.spec.ts` all green
- [ ] Memo committed first, then code
- [ ] `docs/PHASE_A_R6_REVIEW.md` written with before/after metrics + smoke checklist
- [ ] Owner manual smoke per D13 (a separate, formal gate)
