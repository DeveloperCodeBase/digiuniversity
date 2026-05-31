# R-CI-Cleanup — Planning Memo

**Author:** post-Phase-B (D83 closure)
**Date:** 2026-05-31
**Status:** ⏳ planning memo — awaiting owner direction (Q-answers). No code until ack (D61 #1).
**Sequence:** D79 locked **C → R-CI-Cleanup → A**. R6 (C) closed at D83; **R-CI is next**, before Candidate A.
**Grounding:** `docs/PHASE_B_CI_DEBT_REPORT.md` (the characterization, 2026-05-28, re-verified 2026-05-31) + the D81/D83 gate findings.

---

## 0. Purpose — why now, and why it's not a feature

R-CI-Cleanup is the **cross-cutting quality mandate** (the "anti-وصله‌پینه" / no-patchwork goal), not a phase deliverable. It lands **debt-second** (D79): after R6 kept feature momentum, **before Candidate A** — because A is the largest web-surface push (content authoring), and A's own new errors must not be buried in legacy noise. A green-CI baseline is the prerequisite for A opening Phase C.

The debt is **static and pre-existing**: the full CI build+test path has been red since **before R0.5** (`3229758`); R3.a/R3.b/R4/R6 added **0** of the 198 errors. R-Infra deliberately scoped the deploy gate to "lean deployability" (vite build + prisma migrate + api tsc — all green) and deferred full CI. R-CI closes that gap.

---

## 1. Verified debt snapshot (re-measured 2026-05-31)

| Gate | State | Notes |
|---|---|---|
| **Web typecheck** (`apps/web` `tsc --noEmit`) | 🔴 **198 errors** | Unchanged since the 2026-05-28 report; by-code freq matches exactly |
| **Web `@ts-nocheck`** | 13 files suppressed | Contribute **0** to the 198 (out of scope — see §3) |
| **API typecheck** (`apps/api` `tsc --noEmit`) | 🟢 CLEAN (exit 0) | — |
| **audit-on-mutation lint** | 🟢 PASS (27 controllers, 0) | Green from R6 (D81 green-all-4) |
| **API jest** | ❓ unknown locally | Needs Postgres — **must be measured in a CI/container env**, not the Windows dev box |

**Web error shape** (the `PHASE_B_CI_DEBT_REPORT.md` 7 buckets, freq re-confirmed): TS7031 binding-element-any (46), TS2322 not-assignable (41, mostly toast-contract drift in `classroom/Stage.tsx` + `AIPanel.tsx`), TS2339 prop-missing (32, the `useState({})` trap), TS7006 param-any (31), TS2345 (12), TS18046 err-unknown (10), TS7053 index-sig (8), tail misc. **≈59% (≈117/198) are codemod-mechanical** (buckets A `useState({})` + C implicit-any + D err:unknown). Top files: `Catalog.tsx` (26), `CourseLive.tsx` (25), `Settings.tsx` (16), `AssessmentLive.tsx` (16), `Admissions.tsx` (16), `classroom/Stage.tsx` (14), `University.tsx` (13), `classroom/AIPanel.tsx` (12). The debt report estimates **20–30h, ~half codemod-able**, and recommends a **single R-CI-Cleanup sub-R** (~15–20 atomic per-file commits, 3–5 days).

---

## 2. The real mandate beyond the error count — gate unification (D81 + D83)

R6 surfaced that **the deploy path and the test path diverge** (D81): `audit-on-mutation` runs only in `pretest`, never in `deploy-and-smoke.ps1`, so R3.b shipped with it **silently red** while deploys went green. Same family as D70 (latent `api.delete`) + D72 (ack ≠ ground truth) — a failure mode the happy path doesn't exercise.

So R-CI is **not just "make tsc 0"** — it's **"make one authoritative gate that can't go silently red."** Unify typecheck + audit-lint + tests into a single check, then make that check the source of truth for both CI and the deploy gate. Related: D83 ruled the R5 step-2 migration gate a pre-push heuristic (8.2 `prisma migrate status` is authoritative) — document/refine as part of the same gate consolidation.

---

## 3. Scope

**In scope:**
1. Drive **`apps/web` tsc → 0** (the 198), codemod-first (§4).
2. **Measure + fix the API jest suite** in a Postgres-backed CI/container env (or confirm green).
3. **Gate unification (D81)** — one `verify` entry point (tsc + audit-lint + tests) that both CI and the deploy gate consume, so a test-only gate can't stay red while deploys pass.
4. **R5 deploy-gate tightening** (D76 deferral): lean-deployability → full-CI, once the unified gate is green. + the D83 migration-gate doc refinement (step-2 = pre-push heuristic; 8.2 authoritative).

**Explicitly OUT of scope** (per the debt report):
- Removing the **13 `@ts-nocheck`** files (separate retirement effort). *Caveat: `AssessmentLive.tsx` appears in BOTH the @ts-nocheck list AND the 198 — its directive may not be on line 1; audit it.*
- **Strictening `tsconfig`** flags (no new `strict*` toggles).
- **Architectural / pattern migration** (no refactors beyond what a type fix needs).

---

## 4. Approach (debt-report Option 1, sequenced for low risk)

Codemod the mechanical majority first (big green delta, low risk), then the concentrated semantic clusters, then the long tail:

1. **Codemod commits** (ts-morph) for buckets A (`useState({})` → typed initial state), C (implicit-any params/binding), D (`err: unknown` catch narrowing) — ≈59% of errors, mechanical + reviewable as a diff.
2. **Bulk toast-contract fix** — the TS2322 cluster in `classroom/Stage.tsx` + `AIPanel.tsx` (one contract, many call sites).
3. **Per-file** for the remaining semantic errors (interface evolution, index-sig gaps), top offenders first.
4. **API jest** investigation **last** (needs the Postgres CI env; may split — see Q1).
5. **Flip the unified full-CI gate green** as the capstone (proves deploy-path ≡ test-path).

Each commit: `tsc --noEmit` strictly-decreasing error count + audit-lint still green + no runtime/behaviour change (type-only).

---

## 5. Q-decisions (for owner)

- **Q1 — one sub-R or split?** **Q1.a (Recommended)** single R-CI-Cleanup (web tsc → 0 + jest + gate unify), with an escape hatch: if API jest proves *structural* (not a quick fix), spin `R-CI-Api` as a follow-up rather than blocking the web-green close. Q1.b: split Web/Api up front (more overhead).
- **Q2 — codemod tooling?** **Q2.a (Recommended)** use **ts-morph** for buckets A/C/D (the ≈59%), reviewed as a normal diff. Q2.b: all-manual per-file (slower, no new dev-dep).
- **Q3 — gate mechanism (the D81 unification)?** **Q3.a (Recommended)** a lightweight **`verify` script** (tsc + audit-lint + jest-in-a-Postgres-container) wired into BOTH a CI check and the deploy gate — fits the single-VPS / single-operator setup, defers GitHub Actions to team scale (consistent with D76). Q3.b: full GitHub Actions CI now. Q3.c: keep them separate (rejected — that's the D81 bug).
- **Q4 — R5 deploy-gate tightening?** **Q4.a (Recommended)** flip lean → full-CI **at the end of R-CI** (capstone, once green) + apply the D83 migration-gate doc note. Q4.b: defer gate-tightening to a later R.
- **Q5 — `@ts-nocheck` (13 files)?** **Q5.a (Recommended)** leave out of scope (per debt report) — but **audit `AssessmentLive.tsx`** (in both lists). Q5.b: fold nocheck-retirement into R-CI (much larger).

---

## 6. Estimate

~**20–30h, 3–5 days** (debt report). ~half codemod-able. Net effect: **first green full-CI baseline since before R0.5**, deploy-path ≡ test-path, ready for Candidate A to open Phase C without inheriting legacy noise.

---

## 7. Process + ack

Standard contract (D61): this planning memo → owner picks Q-answers → (scoped memo if the shape shifts, else straight to) atomic commits (each strictly lowers the tsc count, audit-lint stays green) → CI/gate verification → deploy via `deploy-and-smoke.ps1` → close. Stop triggers active (#1 unexpected discovery — likely around API jest's DB needs).

**Ack format:** «R-CI = Q1.a + Q2.a + Q3.a + Q4.a + Q5.a، شروع» (or override any Q). On ack, first commit = the ts-morph codemod for buckets A/C/D.

---

— R-CI-Cleanup planning memo, 2026-05-31. Debt is static + pre-existing (0 from R3.a→R6); the goal is a single authoritative green gate (no silent-red, D81) before Candidate A opens Phase C. Characterization: `docs/PHASE_B_CI_DEBT_REPORT.md`.
