# Phase A Retrospective — Foundation Repair

**Date closed:** 2026-05-26 per D59.
**Tag:** `phase-a-complete`
**Duration:** R1.1 (foundation start) → D59 (Gate A close).
**Decision count:** 59 D-prefixed entries in `docs/PHASE_A_DECISIONS.md`.
**Sub-R count:** 17 mainline sub-Rs + 7 R-Landing-v2 rounds + 2 R7.1.5 fine-tunings = 26 distinct shipping units.

---

## Timeline

| Phase | Span | Output |
|---|---|---|
| **Foundation (R1.x)** | R1.1 → R1.4 + 5-bug sprint B1-B5 | AppShell, auth flow shell, R1.3 brand + 5 hotfixes, R1.4 audit + scope guards |
| **Typing + role dashboards (R2-R5)** | R2 → R5 | 43 of 45 `@ts-nocheck` retired, 10 role dashboards, audit-on-mutation lint, R5 login redesign |
| **Theme + RTL (R6-R6.6)** | R6 → R6.6 | Classroom redesign, global white+navy palette, RTL navbar fix |
| **A11y + Performance sweep (R7.x)** | R7.3 → R7.12 | Lighthouse a11y subset 88→100, aria-valid-attr cleared, role-routing 3→10, mini-variant sidebar, a/b/c/d a11y sweep |
| **Performance track (R7.1+R7.2)** | D33 ship, D36 close | Vite manualChunks, React.lazy 8 routes, @fontsource self-host, Google Fonts CDN dropped |
| **Performance fine-tuning (R7.1.1, R7.1.5)** | R7.1.1 → R7.1.5.b | Style+Layout reduction, hero LCP optimization, **sharp image compression -11.6 MB** |
| **Landing redesign pivot (R-Landing-v2)** | D37 → D58 (7 rounds) | New Home structure with Jahad+AIRAC brand + 8 faculty + 3 student testimonials + partners section + mobile hamburger |
| **Gate A close** | D59 (2026-05-26) | Cumulative D13 ack, dossier FINAL, retrospective + Phase B kickoff memo |

---

## Sub-R inventory

| # | Sub-R | Output | Closure |
|---|---|---|---|
| 1 | R1.1 | AppShell + chrome scaffolding | D13 |
| 2 | R1.2 | Auth flow shell | D13 |
| 3 | R1.3 | Brand + 5-bug sprint (B1-B5) | D13 |
| 4 | R1.4 | Audit + 3 fixes + B4/B5 scope-leak fixes + Brand-deploy | D13 |
| 5 | R2 | `@ts-nocheck` retirement (43/45) | D13 |
| 6 | R3 | 10 role dashboards | D13 |
| 7 | R4 | Audit-on-mutation lint | D13 |
| 8 | R5 | Login redesign | D13 |
| 9 | R6 | Classroom redesign | D13 |
| 10 | R6.5 | Global white+navy theme | D13 |
| 11 | R6.6 | Navbar RTL fix | D13 |
| 12 | R7.3 | Lighthouse a11y subset 88→100 | D13 |
| 13 | R7.5 | aria-valid-attr-value 53→0 | D13 |
| 14 | R7.6 | Token darkening for 4.5:1 contrast | D13 |
| 15 | R7.7 | a/b/c/d a11y sweep | D13 |
| 16 | R7.9 | apiRoleToLocal 3→10 + D18 flow spec | D13 |
| 17 | R7.12 | Mini-rail persistent sidebar | D13 |
| 18 | R7.1+R7.2 | Vite chunks + font self-host | D13 (variance-band) |
| 19 | R7.1.1 | Style + Layout reduction | D13 |
| 20 | R7.1.5.a | Hero LCP swap + fetchpriority | D13 |
| 21 | R7.1.5.b | Sharp image optimization (-11.6 MB) | D13 |
| 22-28 | R-Landing-v2 rounds 1-7 | Home rewrite + 7 polish rounds | D13 (D58) |

Cumulative ship count by category:
- AppShell + auth/chrome: 4 sub-Rs
- Type safety + lint: 2 sub-Rs
- Role differentiation: 1 sub-R (10 distinct dashboards)
- Theme + RTL: 3 sub-Rs
- A11y: 4 sub-Rs (R7.3 / R7.5 / R7.6 / R7.7)
- Routing: 1 sub-R (R7.9)
- Sidebar: 1 sub-R (R7.12)
- Performance: 5 sub-Rs (R7.1+R7.2 / R7.1.1 / R7.1.5.a / R7.1.5.b + R-Landing-v2 image weight cleanup)
- Landing redesign: 7 sub-Rs (R-Landing-v2 vol-1 + rounds 2-7)

---

## D-decisions by phase

| D-range | Theme |
|---|---|
| **D1-D10** | Workflow discipline: D11 scope, D12 visual contract, D13 manual smoke, D14 owner override, D18 flow assertion |
| **D11-D20** | R1.x sprint + R3 role dashboard differentiation |
| **D21-D30** | A11y + role routing (R7.3, R7.5, R7.6, R7.7, R7.9) |
| **D31-D35** | Gate A axe verdict + R7.12 mini-rail + R7.1+R7.2 Performance ship |
| **D36** | First Gate A close attempt (Path A — partial-with-variance §1) |
| **D37-D40** | R-Landing v1 catastrophe + forensic audit + rollback |
| **D41-D44** | R-Landing v1 postmortem + R7.0 SW fix memo + Phase B defer + R-Landing-v2 plan |
| **D45-D55** | R-Landing-v2 7-round polish (branding, navbar, hero, faculty, testimonials, partners, hero stats, hero logo) |
| **D56-D58** | R-Landing-v2 closed + R7.1+R7.2 resume + R7.1.5 fine-tuning + logo restore |
| **D59** | Gate A FINAL close + cumulative D13 ack + Phase B kickoff |

---

## Key lessons learned

### 1. D12 visual contract (semantic over pixel)
DOM + computed-style assertions outlasted baseline pixel resets across R7.12 mini-rail, R-Landing-v2 logo redesigns, and R-Landing-v2 D55 hero logo swap. Semantic D12 specs never required a baseline reset. **Adopt for Phase B:** every visual spec must assert DOM structure + ARIA + computed colors, never raw pixels.

### 2. D13 owner manual smoke is authoritative
Playwright + axe + Lighthouse single-run all returned green when R1 navbar scrolled off, R1.3-B5 leaked auth user, R-Landing v1 landed with 27-page scope mismatch. Owner real-device smoke caught what automation missed every time. **Adopt for Phase B:** D13 is not optional. No sub-R closes without it.

### 3. D18 flow assertion (state-machine journey-level testing)
R7.9 caught the apiRoleToLocal 3-out-of-10 bug that D12-alone missed because each individual screen rendered correctly — the failure was in the routing transition. **Adopt for Phase B:** every state-machine sub-R (StudentApplication, CourseOffering, AssessmentLive, …) needs a D18 flow spec that walks the journey end-to-end.

### 4. SW + Workbox precache pitfall
R-Landing v1 broke the whole site because Workbox precache-and-route served stale bundles. Two-layer fix: D45 disposed SW + bumped KILL_FLAG, D42 staged R7.0 memo for proper network-first cache strategy post-Gate-A. **Adopt for Phase B:** SW reactivation goes in its own R7.0 sub-R with explicit owner ack on cache strategy. No SW changes piggybacked onto other ships.

### 5. External resource fetch risk
R-Landing v1 fetched a 27-file template from `docs/my-upload/landing-page/` and assumed all pages were in scope — owner only wanted Home. R-Landing v2 had a forensic-audit-first rule + D38 explicit Home-only scope. **Adopt for Phase B:** any external/template/skill fetch goes through audit-first + owner explicit scope ack before code.

### 6. Scope discipline D11 + explicit override patterns D14/D49
Strict D11 «scope creep blocked» worked for 90% of sub-Rs. D14 (owner explicit override) and D49 (one-line minor AppShell exception under urgency umbrella) were the legitimate escape hatches. Silent additions to shared.tsx or AppShell were never allowed. **Adopt for Phase B:** memo every owner-authorized override.

### 7. Lighthouse variance reality
R7.1.1 5-run study documented 24-32 point variance on identical commits. R7.1.5.b confirmed: 3 runs on / yielded 43 / 65 / 45 / 29 (36-pt spread). **Adopt for Phase B:** single-run Lighthouse is never authoritative. Either run 5-run median (slow) or use D13 owner real-device smoke as the canonical signal.

### 8. Performance budget per sub-R (asset audit before ship)
R-Landing-v2 vol-1 shipped 12.3 MB of uncompressed PNG portraits unnoticed until R7.1.5.b Lighthouse baseline revealed the catastrophe. **Adopt for Phase B:** every sub-R that adds binary assets runs a size audit pre-commit. Total page-weight delta must be in the review doc. A weight budget per route would be even better (e.g., `/` ≤ 1.5 MB target).

### 9. Single source of truth pattern
R7.9 extracted `apiRoleToLocal` from 3 separate locations into one map. Duplicate-and-drift was the root cause of 7 roles landing on /progress. **Adopt for Phase B:** anywhere two files store the same data, extract to a single module + import. Especially for routing tables, role definitions, permission matrices.

### 10. Scope creep red flags + audit-first workflow
R-Landing v1: scope crept from "Home polish" to "27-page rebuild". R-Landing v2: audit-first locked scope to Home-only with explicit D38 ack. **Adopt for Phase B:** every owner request with ambiguous scope gets an audit doc + memo + scope acknowledgment BEFORE code begins. The «single-ping if blocked» pattern (D29) keeps this honest.

---

## What Phase B should know

1. **Memo-then-code-then-test-then-D13 workflow is non-negotiable.** Every Phase B sub-R starts with a memo (`docs/PHASE_B_R*_MEMO.md`), waits for owner ack, then ships code in atomic commits, then has a D12+D18 spec, then awaits owner D13 ack. No shortcuts.

2. **D11 scope discipline strict.** Every sub-R has an explicit scope boundary. Touching shared.tsx, AppShell, workspace routes, auth flow, or global tokens from inside a "small" sub-R requires owner explicit ack (D14 pattern). Silent additions get reverted.

3. **D18 flow assertion mandatory for state machines.** StudentApplication, InstructorApplication, CourseOffering migration, Assessment grading lifecycle — every state-machine ships with a flow spec.

4. **Performance budget per sub-R.** Asset weight audit + bundle delta + Lighthouse delta in every review doc.

5. **SW re-enable is its own sub-R.** R7.0 (per D42) ships network-first cache strategy for HTML/JS + cache-first for static assets + auto-cleanup. Not piggybacked.

6. **R-Landing-v2 static-HTML variant.** Per D43, landing's lifecycle should decouple from SPA bundle in a dedicated sub-R post-Gate-A. Reduces risk of landing-side ships affecting workspace routes.

7. **Migration policy (additive + dual-write).** Per D44, Phase B Academic Hierarchy + CourseOffering migrations follow additive + dual-write pattern with `MigrationSyncLog` audit. `docs/MIGRATION_POLICY.md` is the source of truth (to be authored in R1).

8. **Audit-on-mutation lint enforced.** Every new mutation endpoint in Phase B must use the audit decorator or write directly to AuditLog. Lint will fail otherwise.

9. **Variance-aware verification.** Don't trust single-run Lighthouse. D13 owner smoke + 5-run median when numbers matter.

10. **Compass Roadmap as the north star.** Phase B targets the Academic Hierarchy + Course + Assessment + Live-class + AI Tutor track per the runbook. Each phase has its own gate.

---

— Phase A author, 2026-05-26. `phase-a-complete` tag pushed. Phase B unblocked pending R1 memo ack.
