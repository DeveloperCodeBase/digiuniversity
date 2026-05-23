// Phase-A R6 — Classroom shim.
//
// Re-export of the new ClassroomShell so the router's import path
// (`./pages/Classroom`) keeps working without touching router.tsx.
//
// The Phase-14 `@ts-nocheck` that previously sat at the top of this
// file is retired in R6 — the new shell + its atoms ship fully typed.
// `docs/PHASE_A_DEFERRED_TYPES.md` count drops from 2 → 1 (only
// `Home.tsx` remains under the 5-cap after R6).
//
// The old 644-line monolith is replaced by the focused trio under
// `./classroom/`: ClassroomShell (composer) + Stage + AIPanel +
// CourseHeader + classroom-atoms (types, mock data, SlideCanvas, Pill).
// Phase D will swap mock data for real LiveKit + ai-gateway responses
// in `classroom-atoms.tsx` without touching the visual components.
import { ClassroomShell } from "./classroom/ClassroomShell";

export const ClassroomPage = ClassroomShell;
export default ClassroomShell;
