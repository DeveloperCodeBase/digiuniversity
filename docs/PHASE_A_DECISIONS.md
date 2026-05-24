# Phase A — Decisions log

> Architectural decisions taken during Phase A that aren't in the Master Runbook or the approved plan. Each entry is timestamped and includes the alternatives I considered + the reason I picked one. Future-me (or a reviewer) can re-litigate if needed but has the trace.

## Schema

```
### R{n.n}-D{m} — <short title>
Context: <one sentence>
Options considered:
  A. <option>
  B. <option>
Choice: <A or B>
Why: <reason>
Source: <user instruction, plan section, runbook chapter, or "my call">
```

## Entries

### R1-D1 — Breadcrumbs placement
**Context:** Master Runbook says AppShell must have breadcrumbs but doesn't specify location.
**Options considered:**
  A. Below topbar, own row, full-width (Canvas/Open-edX pattern)
  B. Inside main content, top of page (iOS Files / GitHub PR pattern)
  C. Inline with topbar, right of brand (Linear / Notion pattern)
  D. Defer to R3
**Choice:** A — below topbar, own row, 36px height, full-width.
**Why:** User chose A on 2026-05-22 with explicit responsive truncation specs.
**Source:** user-chat-2026-05-22, AskUserQuestion#1.

### R1-D2 — Drawer pattern at <lg
**Context:** Existing `Nav` has a hamburger drawer for top-nav links. Workspace routes also need RoleSideNav accessible at <lg.
**Options considered:**
  A. Two separate drawers (Nav drawer + Sidebar drawer)
  B. One combined drawer (Nav absorbs sidebar items)
  C. Sidebar drawer only on workspace, top-nav drawer on public
**Choice:** C — context-aware single hamburger.
**Why:** Mental model match: workspace user doesn't need Home/About in the drawer. Public user doesn't need Dashboard. Single hamburger, single drawer, mode-driven content.
**Source:** user-chat-2026-05-22, AskUserQuestion#2.

### R1-D3 — Sheet `side` prop in RTL
**Context:** Existing Sheet primitive uses `side="start" | "end" | "top" | "bottom"`. User spec said drawer should open from right in RTL.
**Options considered:**
  A. Use `side="start"` — Sheet.tsx maps start to `inset-y-0 start-0`, which under RTL = right
  B. Use `side="end"` — would be left in RTL (wrong direction)
  C. Add a new `right` literal
**Choice:** A.
**Why:** Logical properties; no Sheet primitive change needed.
**Source:** my call, derived from Sheet.tsx implementation already read.

### R1-D4 — R1 split into R1.1 + R1.2
**Context:** Combined R1 deliverable (AppShell + 3-mode + breadcrumbs + truncation popover + Playwright) exceeds 300 lines.
**Options considered:**
  A. Ship R1 as one ~500-line PR with rationale
  B. Split into R1.1 (shell) + R1.2 (breadcrumbs) under one review doc
  C. Cut breadcrumbs from R1, defer to R3
**Choice:** B.
**Why:** Honours the ≤300-line rule; preserves R1's deliverable scope; single user smoke pause after R1.2.
**Source:** my call, per the explicit ≤300-line rule.

### R1.3-D10 — Manual smoke is authoritative; Playwright `toBeVisible` does NOT prove visual correctness
**Context:** R1's 23 assertions all passed but the owner's manual smoke surfaced 6 bugs the spec didn't catch (sticky navbar, login layout broken, dashboard not responsive, drawer not actually opening, landing leak, classroom mobile broken). Playwright assertions like `expect(navbar).toBeVisible()` returned true even though the navbar wasn't sticky and scrolled off on mobile.
**Rule:** Manual smoke on a real device (or DevTools mobile emulation, run twice) is the authoritative visual-fidelity check. Playwright spec is necessary but **not sufficient**. Every sub-R review must include manual smoke evidence, not just spec output.
**Application:** Every sub-R from R1.3 onward includes a "Manual smoke required" step before claiming green. Owner re-runs the smoke after the agent reports — agent does NOT mark the sub-R done until owner ack.
**Memory:** Saved to `feedback_manual_smoke_required.md` so future sessions inherit the rule.
**Source:** owner instruction 2026-05-22, post-R1 smoke.

### R1.3-D9 — Sidebar is hamburger-toggle on every viewport (Notion / Linear pattern)
**Context:** R1.1 shipped a sidebar fixed at lg+ and Sheet-drawer at <lg. Owner's preferred pattern is hamburger-toggle on **every** viewport — modern UX (Notion, Linear, Gmail, GitHub), more content room for widgets, mobile/desktop consistency.
**Rule:**
  - Hamburger button visible on every viewport (not only <lg)
  - Sidebar closed by default on every viewport
  - Click hamburger → drawer slides in from right (RTL)
  - Click any sidebar item → navigate + auto-close drawer
  - Click hamburger again or click backdrop → close
  - State persisted in localStorage as `digiu_sidebar_pref` per user
  - **Exception:** at viewport ≥3xl (1536px) **and** in workspace **and** the user previously had it open → stays open (power users on large monitors)
**Source:** owner instruction 2026-05-22.

### R1.3-D12 — Visual assertion contract: `toBeVisible()` is not a visual claim
**Context:** R1.3 shipped 39/39 automated assertions green. Owner manual smoke found all 6 bugs still present on a real device. The assertions verified DOM presence + computed style flags, not visual fidelity.
**Rule:** Every visual claim must assert **all five** of these, not just `toBeVisible()`:
  1. **Element present in DOM** (`toBeAttached()` / `toHaveCount(n)`).
  2. **Computed style matches design exactly** — position, size, color, font-weight, gap. Not "is set" — _matches the design token_.
  3. **Element in correct viewport scroll position** — `getBoundingClientRect()` against the viewport bounds. Not just "exists" — _visible at the expected pixel coordinates after scroll_.
  4. **No overlap with surrounding elements** — `boundingClientRect()` collision check against siblings. Catches cases where the element exists but is hidden behind a stacked sibling.
  5. **Pixel diff against baseline ≤ 0.1%** — Playwright `toHaveScreenshot()` with the design baseline PNG. Catches drift the structural checks miss.

`toBeVisible()` alone is not accepted from this point. Any spec that uses it without the other four is a structural test, not a visual test, and must be labelled as such (e.g., `describe("R1.3 — structural (not visual)", ...)`).

**Application:** Every R1.4 assertion will satisfy all five. The visual baseline PNGs land in `docs/visual-baselines/{sub-r}-{bug}.png` and `toHaveScreenshot` compares against them.
**Source:** owner instruction 2026-05-22 after R1.3 manual-smoke failure.

### R1.3-D13 — Real-device manual smoke is a formal gate
**Context:** R1.3 shipped 39/39 automated and was claimed as "verified". The owner ran manual smoke on a real phone and found the same 6 bugs the sub-R was supposed to fix. Visible from the docs alone, the gap looked like victory; from the device alone, like nothing changed.
**Rule:** Manual smoke from the owner is a formal gate. **If manual fails, the sub-R fails — regardless of automated pass rate.** No sub-R can be claimed "shipped" or "verified" on automated alone. The acceptance grammar is:

  - PASS = automated green AND owner manual smoke green.
  - FAIL = either side red.

No "76% ready, move on". No "automated passed, ship it". Manual is non-negotiable.

**Procedure when manual fails:**
1. STOP writing code. Do not retry, do not extend.
2. Owner sends screenshots.
3. Fill `PHASE_A_R{n}_AUDIT.md` columns 4–6 (what screenshot shows, gap cause, fix) per row.
4. Author new assertions per D12 (the 5-point visual contract).
5. Execute fixes one bug per commit, verify each against BOTH the new assertion AND a follow-up manual smoke.
6. Only then advance.

**Application:** R1.3 is officially FAILED until the audit + R1.4 fixes land + the owner re-smokes green. R2 stays gated.
**Source:** owner instruction 2026-05-22 after R1.3 manual-smoke failure.

### R1.1-D8 — `find -newer .git/HEAD` is unsafe for git-tracked dirs
**Context:** When unblocking the VPS pull, an attempted cleanup with `find docs -name '*.png' -newer .git/HEAD -delete` matched and deleted tracked PNGs too. Recovery: `git checkout HEAD -- docs/` restored tracked files; `sudo rm` on the untracked dir finished the job.
**Rule:** Never use `find -newer .git/HEAD` to discriminate untracked vs tracked files. The mtime-vs-HEAD-mtime comparison isn't reliable — touched files, rebased commits, and clone-fresh checkouts all break the heuristic.
**Correct primitive:** `git clean -fdx <dir>` (git-aware: removes untracked + ignored, leaves tracked alone). If write permissions block clean, escalate to `sudo git -c safe.directory=$PWD clean -fdx <dir>` rather than improvising with `find`.
**Application:** `remote.ps1`'s `up` / `pull` / `restart` actions currently use `git checkout -- docs/ 2>/dev/null; git clean -fd docs/ 2>/dev/null` which silently swallows the permission failure. Replace with `sudo git clean -fdx docs/ 2>/dev/null || true` (or chmod files post-Playwright-write so the VPS user can unlink). Logged as post-Gate-A infra task.
**Source:** user instruction + recovery sequence 2026-05-22.

### R1.1-D7 — Line budget is a target, not a ceiling; never split code from test
**Context:** I initially proposed moving R1.1's test spec to R1.2 to keep R1.1 under 300 lines. The user rejected this as the Phase-16 vasle-pinneh pattern returning under a new name.
**Rule (now Phase-A invariant):**
  - The ≤300 line cap is a **target**, not a hard ceiling. 10–15% over (≤345 lines) is acceptable when splitting would break a coherent unit.
  - **Never split test from code to fit the budget.** Tests and the code they verify ship in the same PR so the reviewer can read both in one pass.
  - If a PR genuinely doesn't fit even with the 10–15% grace, the split must be **vertical** (smaller feature + its complete test) — not **horizontal** (code in one PR, test in another).
**Why:** Tests are the contract for the code. Reviewing them separately invites the "deploy now, write tests later" rot pattern. Phase 16's lessons explicitly warned against this.
**Application to R1.1:** ship code + test together in one PR. Expected size ~340–360 lines. The review doc will note the overage and the reason.
**Source:** user instruction 2026-05-22 after my mistaken horizontal-split proposal.

### R1-D6 — VPS docs sweep failure (deploy blocker)
**Context:** On first attempt to deploy R1.1 via `.\scripts\remote.ps1 up`, git pull on the VPS aborted with "untracked working tree files would be overwritten" against `docs/audit-logged-in-evidence/` and `docs/gate-2-evidence/smoke/`. These dirs hold PNGs written previously by the `web-visual` Playwright docker container.
**Diagnosis:** `remote.ps1`'s `up` action prefixes the pull with `git checkout -- docs/ 2>/dev/null; git clean -fd docs/ 2>/dev/null;`. The `clean -fd` silently failed (errors swallowed by `2>/dev/null`). Most likely cause: the docker container writes files with a different UID than the VPS user, so the VPS user can't `unlink()` them despite the parent dir being chmod 777. The fix in `remote.ps1` would be `sudo rm -rf` or `find ... -delete` with appropriate ownership.
**Options considered:**
  A. Patch `remote.ps1` cleanup prefix (add `sudo rm -rf docs/audit-logged-in-evidence/ docs/gate-2-evidence/smoke/ 2>/dev/null || true` before the git clean) — small infra fix, but touches a cross-cutting script mid-R1
  B. Ask the user to ssh to VPS once and run a one-shot cleanup, then retry `up`
  C. Push a commit that untracks the PNGs so pull doesn't conflict — destroys the 150 PNG dossier evidence, ruled out
**Choice:** B for this round (unblock R1.1 deploy now). Open a follow-up "infra: harden remote.ps1 docs sweep" ticket; logged in `PHASE_A_OUT_OF_SCOPE.md`.
**Why:** Modifying `remote.ps1` mid-R1.1 expands scope and the fix needs testing. A one-shot manual cleanup is faster and preserves R1's focus on AppShell.
**Source:** my call, after `.\scripts\remote.ps1 up` and `.\scripts\remote.ps1 pull` both failed identically.

### R1-D5 — `.workspace-grid` breakpoint 980px → 1024px
**Context:** Current CSS breaks the grid at 980px (sidebar stacks above content). Compass says fixed sidebar at lg+ which is 1024px in tailwind config.
**Options considered:**
  A. Change to 1024px (match `lg` token)
  B. Leave at 980px and let AppShell override via class
**Choice:** A.
**Why:** Tailwind `lg` token = 1024px. Consistency. Drawer takes over at the same breakpoint that everywhere else uses.
**Source:** my call, derived from tailwind.config.js + AppShell drawer logic.

### R6+R6.5-D14 — Owner-approved mid-Phase-A pivot (Classroom redesign + theme + brand logo)
**Context:** Between R5 (login) and the planned R6 (audit lint backfill / Gate-A start), the owner explicitly requested three pieces of scope that were NOT in the original Compass Roadmap or the Phase-A plan locked in `~/.claude/plans/c-users-98912-downloads-compass-artifac-partitioned-eclipse.md`:
  - **R6 Classroom redesign** — apply the owner-uploaded template at `docs/my-upload/classroom/` to the کلاس زنده + AI page, port to typed React inside AppShell, retire the Classroom `@ts-nocheck`.
  - **R6.5 Global theme switch** — replace the off-white-paper + oxford-blue light theme with the white + navy + brand-blue + gold palette from the R6 template; default theme `dark` → `light`.
  - **JDO logo + brand attribution** — wire the owner-supplied `darklogo.png` / `lightlogo.png` JDO marks into the footer + co-brand strip across PUBLIC + WORKSPACE + AUTH_FLOW (R1.3 Brand and CoBrandFooter inside R5).

**The question this entry settles:** are these D11 violations? (D11 = "no addition outside the locked plan without explicit owner message".)

**Answer:** **No.** All three pivots arrived as explicit, in-band user messages in the chat transcript:
  - R6: «use this style and design for کلاس زنده + AI page exactly like this and make it responsive for all pages...i put template in root of project: C:\digiuniversity\docs\my-upload\classroom»
  - R6.5: «continue as plan make theme color white and blue navy»
  - JDO logo: «darklogo.png و lightlogo.png در C:\digiuniversity\ هستن» + the earlier R5 template upload that included `assets/jahad-dark.png` + `assets/jahad-light.png`.

Each message is an explicit owner authorization to deviate from the locked plan. The pivots were ratified on-the-fly, executed under the same Phase-A workflow (memo→code→deploy→spec→review→D13 manual smoke), and recorded as sub-Rs (R6, R6.5; R1.3 Brand was the original logo work). **No D11 violation.**

**D11 reaffirmed for future features.** Every future addition — whether mid-Phase-A or in Phase B+ — needs the same explicit owner-message authorization. The pattern is:
  - Owner writes a clear instruction in the chat.
  - I memo the addition before code (per the established workflow).
  - I cite the message that authorized it in the memo.
  - The PR review doc references this decision (so future agents see the trail).

**What this entry is NOT:** a blanket pre-approval for me to widen scope on perceived owner intent. Implicit, ambiguous, or interpreted messages don't qualify. The owner must say the words.

**Source:** owner messages on 2026-05-23 (R6 Classroom redesign request, R6.5 theme color, JDO logo) and 2026-05-22 (R5 template + jahad logo files).

### R6.6-D16 — Owner D13 ack: R6.6 manual smoke 4/4 pass, R6.6 closed
**Context:** R6.6 shipped the navbar RTL fix (workspace hamburger at start edge + `margin-inline-start: auto` on `.nav-actions`). Automated 12/12 + R1.1 regression 13/13. Owner ran manual smoke on real device per D13 (real Persian phone + desktop + incognito).
**Result:** 4/4 checkpoints pass —
  1. ✅ Public mode RTL (logo right, user-menu left, mobile hamburger at end)
  2. ✅ Workspace mode RTL (hamburger right edge, brand follows, user-menu left edge)
  3. ✅ Desktop chrome (no overlap, no drift; nav-actions pinned to left)
  4. ✅ Spot-check overlap (no z-index issues; drawer slides in from right under RTL)
**Status:** **R6.6 closed.** D13 ack confirmed.
**Effect:** Phase-A D12 assertion roster is locked at 68/68 with owner ack on R5 (positive feedback) + R6.6. Remaining D13 acks: R1.1+R1.2+R1.3+R1.4, R2, R3, R4, R6, R6.5 (7 sub-Rs pending owner manual smoke).
**Source:** owner message 2026-05-23 ("R6.6 manual smoke pass شد (4/4 checkpoint pass)…").

### R7.6-D19 — R7.6 D13 ack confirmed, token contrast darken passes
**Context:** R7.6 darkened `--fg-mute` (5.39:1 → 6.96:1) and `--fg-dim` (2.64:1 → 3.97:1) per owner-prescribed values. 49/49 D12 regression green; axe-scan showed the scoped target (fg-mute + fg-dim text on white) cleared 100%. Owner ran D13 manual smoke on real device.
**Result:** **PASS.** Owner verified text legibility on real mobile + incognito + hard reload. The avatar-placeholder issue raised in the same review pass is **separate** (logged as OWNER-FINDING-1; scaffolding from the original SPA mock content, slated for Phase B Profile-model sub-R) and does not block R7.6.
**Status:** **R7.6 closed.** D13 ack confirmed. R7.5 unblocked per D17 ordering.
**Source:** owner message 2026-05-23 («R7.6 D13 PASS»).

### R7.12-D27 — R7.12 D13 ack confirmed, mini-variant sidebar shipped + verified
**Context:** R7.12 shipped on `phase-a/r7-12-mini-rail` per D26. Branch deploy was live for owner D13 smoke. 72/72 specs green across all affected suites (R7.12 new 13/13, R1.1 13/13, R3 12/12, R6 12/12, R6.6 12/12 with workspace split, gate-a-role-routing 10/10). axe-scan delta: 0 a11y regressions (6 critical / 64 serious — identical to post-R7.5 baseline).
**Result:** **PASS.** Owner verified on real device:
  - ✅ Desktop ≥1024px: rail visible right edge, ~72px mini default, no shadow, clipped under navbar, no hamburger in topbar
  - ✅ Hover tooltip working (native `title` attribute per Q2)
  - ✅ Toggle chevron: smooth animation, groups + labels appear in expanded mode
  - ✅ Persistence: reload preserves mode
  - ✅ Mobile <1024px: unchanged from R6.6 (hamburger + Sheet drawer)
  - ✅ Spot check role differences (student vs parent vs super_admin) — R7.9 + R7.12 integrated correctly
**Notable side note:** D25 Risk 3 was **better than memo predicted**. Memo expected ~36 `UPDATE_BASELINES=1` resets; actual was 0. Semantic-assertion discipline from R1.1 → R5 → R6 → R6.6 paid off — the affected specs already encoded "what the user sees" rather than "exactly these pixels", so the chrome architecture change flowed through without touching baselines. Two specs needed assertion adaptation (R1.1 test #9 + R6.6 workspace split), zero needed baseline reset.
**Status:** **R7.12 closed.** D13 ack confirmed.
**Next per D25 sequencing:**
  1. Merge `phase-a/r7-12-mini-rail` → `main` (merge commit per D26 — preserve branch history)
  2. Deploy from main
  3. Critical-path measurement re-run (§1 Lighthouse a11y subset + §2 axe-scan + §5 role routing)
  4. Update `GATE_A_DOSSIER.md` (§1, §2, §5, §0 status table)
  5. Report to owner → next decision: start R7.7 long-tail or wait
**Source:** owner message 2026-05-23 («R7.12 D13 PASS» + 6 explicit smoke checkpoints).

### R7.12-D26 — R7.12 feature-branch convention (first Phase-A exception)
**Context:** R7.12 (~1230 line scope) is the largest sub-R since R6 (Classroom redesign, ~2,300 lines) AND the first sub-R with a heavy baseline-reset surface (~36 D12 snapshots across R1.1, R3, R6, R6.6 specs). Phase A convention to date has been "code on main, deploy from main, owner D13 smoke on prod" — small sub-Rs, no baseline resets, low blast radius.

**Owner decision (2026-05-23):** R7.12 lands on a feature branch, not main. Phase A's first exception to the main-direct convention.

**Owner rationale:**
  - Risk profile differs from prior sub-Rs (1230 lines + 36 baselines vs. typical 300 lines + 0 baselines).
  - If a baseline gets accepted in error, reverting from a feature branch is cleaner than reverting from main's commit history.
  - Main's history stays unaffected during the R7.12 iteration cycle.

**Branch name:** `phase-a/r7-12-mini-rail`.

**Workflow:**
  1. Branch created from main.
  2. All R7.12 work (code + spec + baseline update) commits to the branch.
  3. Deploy from the branch — preview environment if available (e.g., `digiuniversity.ir/preview` or a subdomain). If no preview infra exists, deploy to prod from the branch is acceptable (Phase A convention) so long as the commit history stays on the branch for review.
  4. Owner D13 smoke on the branch deploy.
  5. After ack: merge to main. Strategy (rebase vs merge commit) is the agent's choice.
  6. After merge: tag or PHASE_A_DECISIONS.md note (the next-available decision ID).

**Scope of exception:** R7.12 only. R7.13+ revert to main-direct convention **unless** they have a similar scope profile (>1000 lines OR >20 baseline updates). The convention can broaden in Phase B+ if owner sees value.

**No infrastructure changes** to remote.ps1 or scripts/ for R7.12 — branch is handled via plain `git` workflow on the agent's side; deploy still uses `remote.ps1 up` which pulls whatever's pushed to the configured remote+branch (main today; can be parameterised in a future infra R if needed).

**Source:** owner message 2026-05-23 («Q3: Branch vs main = feature branch (اولین استثنا در Phase A)»).

### R7.9-D24 — R7.9 D13 ack confirmed, apiRoleToLocal complete fix verified
**Context:** R7.9 completed the role mapper (3 → 10 API roles), extracted to a shared module (`apps/web/src/auth/role-map.ts`), and shipped the first D18 flow regression spec (`gate-a-role-routing.spec.ts`). 10/10 demo users now route correctly; R1.1 13/13 + R6.6 12/12 regression green. Owner ran D13 manual smoke on real device.
**Result:** **PASS.** Owner verified on real mobile + incognito + hard reload:
  1. ✅ student → `/progress` + student sidebar (baseline; no change from before)
  2. ✅ parent → **`/parent` + parent sidebar (NEW — was `/progress`)** — visibly distinct from student
  3. ✅ super_admin → **`/super` + super-admin sidebar (NEW — was `/progress`)** — visibly distinct from both student AND parent
**Status:**
  - **R7.9 closed.** D13 ack confirmed.
  - **Gate A §5 unblocked.** Routing is now 10/10. Pending measurement re-run after R7.12 to formalize PASS in the dossier.
  - **OWNER-FINDING-2 resolved.** No separate R8 sub-R needed (per D21 — diagnosed as upstream-only bug).
  - **D18 first instance in suite.** `gate-a-role-routing.spec.ts` is the template for future state-machine + multi-step-journey specs in Phase B+ (per D18's scope rule).
**Source:** owner message 2026-05-23 («R7.9 D13 PASS»).

### R7.12-D25 — R7.12 plan acked; Performance track runs sequentially AFTER R7.12 + R7.7
**Context:** R7.12 (mini-variant persistent sidebar per D23) was scope-approved but not yet plan-approved. Performance track (R7.1 Vite manual chunks + R7.2 Vazirmatn self-host + R7.3 a11y sweep + R7.4 authed-route Lighthouse runner) was on hold for ordering decision: parallel with R7.12 vs sequential after.
**Owner decision: SEQUENTIAL.**

**Owner rationale (verbatim from message 2026-05-23):**
  - R7.12 and R7.1+R7.2 both touch AppShell + router — parallel work would create merge-conflict potential.
  - Parallel = both tracks need D13 manual smoke simultaneously = overhead.
  - Regression debugging is cleaner when single chrome-or-perf cause is in play («chrome شکست یا code split؟»).
  - Time cost: R7.12 ~3-4 days + Performance track ~1 week. Sequential = ~3 weeks; Parallel = ~2 weeks. Owner judges the 1-week premium worth it for clean execution.

**R7.12 plan ack — three risks acknowledged by owner:**
  1. ✅ **Architecture rewrite** (Sheet drawer → persistent rail). AppShell + RoleSideNav are restructured, not tweaked. Expected.
  2. ✅ **Content margin audit per workspace route.** Every workspace route's content area inherits `margin-inline-start: 72px` (mini) or `280px` (expanded). Per-page spacing check required.
  3. ✅ **Baseline reset** for R1.1 / R3 / R6 / R6.6 specs. `UPDATE_BASELINES=1` expected. Snapshot diff > 1% is normal for a chrome architecture change. R7.12 review doc must explicitly document `before/after baseline diff per spec, reason: chrome architecture change`.

**Approved ordering (linear, no parallelism):**

  1. **R7.12** — Mini-variant persistent sidebar (~3-4 days)
  2. **Measurement re-run** — §1 a11y + §2 + §5 to confirm R7.12 doesn't regress and that the post-R7.5+R7.9 deltas hold
  3. **R7.7a + R7.7b + R7.7c + R7.7d** — long-tail a11y (color-contrast cleanup, per D20), only if measurement still shows serious violations
  4. **R7.1** — Vite manual chunks + `React.lazy` route splitting (Performance: 35/66/66 → ~70+)
  5. **R7.2** — Self-host Vazirmatn + drop unused font families (Performance: ~70 → ~85+)
  6. **R7.3** — Lighthouse a11y sweep (any residual button-name / heading-order / label-mismatch / aria-toggle gaps)
  7. **R7.4** — Authed-route Lighthouse runner (Playwright + `lighthouse({port})`)
  8. **Final measurement** — §1 (now including authed routes) + §2 + §5 all GREEN
  9. **Gate A close** — dossier flips RE-REVIEW DRAFT → FINAL
  10. **Phase B start** — Academic Hierarchy + Onboarding per the Compass Roadmap §B locked plan

**No step starts without explicit owner ack of the previous step's D13 smoke.** D11/D14/D17 discipline applies through the whole tail.

**Source:** owner message 2026-05-23 («Performance track timing: SEQUENTIAL» with full rationale + ordering).

### R7.5-D22 — R7.5 D13 ack confirmed, chrome aria fix verified
**Context:** R7.5 swapped the workspace hamburger's `aria-controls="appshell-sidebar-drawer"` (unresolvable IDREF because Radix Sheet lazy-mounts) for the canonical disclosure-widget pattern `aria-expanded={open} + aria-haspopup="dialog"`. axe-scan delta: `aria-valid-attr-value` 53 → 0; routes with ≥1 critical 54 → 6 (the 6 residuals are pre-existing R7.7 long-tail items — button-name, label, select-name). R1.1 13/13 + R6.6 12/12 regression green. Owner ran D13 manual smoke.
**Result:** **PASS.** Owner verified on real mobile + incognito:
  1. ✅ 3 random workspace routes — drawer behavior preserved, no visible change for sighted users
  2. ✅ Keyboard nav — Tab → Enter opens drawer, Esc closes + focus returns to hamburger
**Status:** **R7.5 closed.** D13 ack confirmed. Critical violations now at 6 (all R7.7d-gated long-tail). R7.9 unblocked per D17.
**Source:** owner message 2026-05-23 («R7.5 D13 PASS»).

### R7.12-D23 — Mini-variant persistent sidebar (owner-requested scope addition)
**Context:** During the R7.5 ack pass, the owner explicitly requested a new sub-R: replace the current hamburger-drawer sidebar with the Material Design **Mini variant drawer** pattern (https://mui.com/material-ui/react-drawer/#mini-variant-drawer) — persistent navigation that changes width between a 72px icon-only "mini" rail and an expanded standard drawer.
**Owner specifications:**
  - **Viewport gate:** ≥1024px (desktop + tablet). <1024px keeps the existing R6.6 Sheet drawer overlay (mobile pattern). R1.3-D9 (hamburger drawer everywhere) is **partially superseded** — superseded only on ≥1024px; <1024px stays as-is.
  - **Default state:** collapsed (mini). User sees icon-only rail; toggles to expanded via a click on a chevron / the active item.
  - **Per-user persistence:** localStorage key `digiu_sidebar_pref` extended from the current `"open" | "closed"` to `{ mode: "mini" | "expanded" }`. Migration: existing `"open"` → `"expanded"`, `"closed"` → `"mini"`.
  - **Clipped by app bar:** the navbar (app bar) stays full-width. The sidebar begins **below** the navbar, not from the top of the viewport.
  - **Same elevation as content:** no shadow on the sidebar. `z-index` matches content (not a higher-elevation overlay).

**Authorization:** explicit owner-message scope addition 2026-05-23 — legitimate per D11/D14 (every scope addition needs explicit owner authorization; this satisfies that).

**Position in R7 sweep:** between R7.9 and the critical-path measurement re-run. The full ordering becomes: ~~R7.6 → R7.5 →~~ R7.9 → **R7.12** → measurement re-run → owner gate for R7.7 + Performance track.

**Three risks (must be in R7.12 memo, owner reviews before code starts):**
  1. **Architecture change.** Current sidebar = Radix Sheet (lazy-mount, overlay, dismiss on outside-click). New sidebar = persistent rail (always in DOM, width animation between 72px / 280px). This is a **rewrite of `AppShell`'s sidebar mount path** + a refactor of `RoleSideNav` to render an icon-only mode + a tooltip-on-hover affordance. Not a tweak — a structural change.
  2. **Content layout shift.** Every workspace route's content area currently runs full-width below the navbar. After R7.12, content must have `margin-inline-start: 72px` (mini) or `280px` (expanded). A per-page spacing audit is needed because some pages may have their own grid / hero / canvas elements that would clip or overlap with the new rail.
  3. **Baseline reset.** R1.1 (13 assertions), R3 (12), R6 (12), R6.6 (12) — all tested against the current workspace chrome. R7.12 will produce a sidebar that's **always in the DOM at ≥1024px**, vs. today's drawer-on-demand. Snapshot diff > 1% is expected. R7.12 must explicitly document the before/after diff per spec in its review doc and bump baselines via `UPDATE_BASELINES=1` with reasoning.

**Sequencing constraint:** R7.12 does NOT start until:
  - R7.9 ships + D13 ack received, AND
  - Owner explicitly approves the R7.12 memo (which surfaces the 3 risks above).

**Source:** owner message 2026-05-23 («NEW SCOPE: R7.12 — Mini-variant persistent sidebar» with viewport + state + persistence + elevation specs).

### R7.7a-D20 — Path 1 approved: replace accent-as-text with `--fg`
**Context:** R7.6 cleared `--fg-mute`/`--fg-dim` violations but exposed 31 routes where `--accent` (#2f5fd3 family) is rendered as TEXT against white/bg-soft at ~4.17:1 — just below WCAG SC 1.4.3 AA-normal. Two paths were on the table in the R7.6 review:
  - **Path 1**: replace accent-as-text with `--fg` (navy ink). Reserves `--accent` for borders/fills/icons/focus rings only.
  - **Path 2**: globally darken `--accent` itself (e.g., to #2647a8) so accent-as-text passes contrast.

**Choice: Path 1.**

**Owner rationale:**
  - **D11/D14 protection.** R6.5 (D14) explicitly approved `--accent: #2f5fd3` as the brand-blue palette value. Path 2 would silently darken the brand color — that's a D11/D14 violation in spirit (palette change without an explicit owner re-decision).
  - **UX correctness independent of WCAG.** Accent-as-text is an anti-pattern regardless of contrast. Brand colors are best reserved for "interactive" tones (borders, fills, icons, focus rings) — body text should be the ink token. Demoting accent away from text duty makes the design more legible AND more semantically consistent.
  - **Surgical scope.** Path 1 only touches the CSS classes that currently use `--accent` as a `color:` value. Path 2 is a global token edit with broad visual impact on every accent-tinted UI element.

**Application (R7.7a):** find every `color: var(--accent)` / `color: var(--accent-2)` / `color: var(--cyan)` rule in components + global styles. Replace with `var(--fg)` unless the visual intent is non-text (e.g., the rule is decorative tinting on an icon or a divider that happens to be set via `color`). The 31 affected routes will all clear `color-contrast` once the underlying classes are repointed.

**R7.7 sweep updates (also approved):**
  - **R7.7b** (gold-as-text, 13 routes) — replace gold-as-text with `--fg`. Gold (`#e7c87a`) is reserved for badge backgrounds, icon fills, MockBadge pill, and celebration moments only.
  - **R7.7c** (1 route, footer dark bg) — add `--fg-mute-on-dark` token (lighter mute, e.g. `#aab0c4` matching dark-theme `--fg-mute`). Wire the footer CSS to use it.
  - **R7.7d** (4 routes, accent-button on-color) — per-button audit, measurement first, owner decision per case if > 2 routes still fail after R7.7a-c land (R7.7a removes some of the surface area).

**Source:** owner message 2026-05-23 («R7.7a Path 1 approved» + explicit reasoning).

### R8-D21 — R8 (role-aware nav sub-R) deleted from the R7 sweep; subsumed by R7.9
**Context:** Owner-reported FINDING 2 ("all 10 roles see the same navbar/sidebar/user-menu") looked like a missing R8 sub-R. A diagnostic audit (`docs/PHASE_A_R8_ROLE_NAV_AUDIT.md`) checked the actual data in code:
  - `NAV_ITEMS_BY_ROLE` (`apps/web/src/shared.tsx:32`) — 10 of 10 roles defined with distinct item lists (3-6 items each).
  - `SIDEBAR_BY_ROLE` (`apps/web/src/sidenav.tsx:28`) — 10 of 10 roles defined with distinct group + item lists (7-28 entries each).
  - Both consumers (`Nav`, `RoleSideNav`) use `useRole()` to pick the right entry.

**Audit verdict:** the role-aware navigation **is fully defined in code**. The visible "same nav for everyone" symptom is the **same upstream bug** as Gate A §5 — `apiRoleToLocal` maps only 3 of 10 API roles, so the 7 non-default roles all collapse to `"student"` and both consumers read the student entries.

**Decision: R8 deleted from the R7 sweep plan.** No separate sub-R for nav data is needed because the data already exists. R7.9 fixes the upstream mapper, which immediately surfaces the correct nav per role for free.

**R7.9 spec extension (per D18 deepening):** R7.9's existing flow-regression spec (`gate-a-role-routing.spec.ts`) was scoped to assert URL match per role. The audit recommends extending it with a **`ROLE_DISTINCTIVE` sentinel map** — one item id per role that no other role's nav contains. The spec then asserts that sentinel is visible after login. Catches two failure modes in one pass:
  - Routing drift (URL mismatch, the original D18 case)
  - Nav-data drift (per-role data is silently overwritten or misordered, e.g., if a future R touches `NAV_ITEMS_BY_ROLE` and accidentally loses a role)

**Implementation:** R7.9 carries the extended spec. R8 line removed from the R7 sweep plan in `docs/GATE_A_DOSSIER.md` next time that file is touched.

**Source:** owner message 2026-05-23 («R8 NOT NEEDED — accept the diagnosis») + diagnostic audit `docs/PHASE_A_R8_ROLE_NAV_AUDIT.md` 2026-05-23.

### R7-D17 — R7 sweep approved as the Gate-A unblock path, critical-path-first ordering
**Context:** Gate A measurement returned 3 of 6 criteria 🔴 FAIL:
  - §1 Lighthouse mobile — Perf 35 / 66 / 66, A11y 88 / 88 / 87 on `/`, `/login`, `/programs`
  - §2 axe-core — 65 of 67 routes have ≥1 serious, 54 of 67 have ≥1 critical
  - §5 Role-routing — 7 of 10 demo users land on `/progress` because `apiRoleToLocal` maps only 3 of 10 API roles

The dossier proposed an 11-sub-R sweep (R7.1-R7.11) clustered on 4 root causes. Owner reviewed and authorized.

**Authorization:** owner message 2026-05-23 — «owner R7 sweep رو به‌عنوان unblock path approve کرد». R7 is out-of-original-Phase-A-plan scope but legitimized by explicit message per D11/D14.

**Ordering (chosen by owner): critical-path-first.**
  1. **R7.6** — Darken `--fg-mute` + `--fg-dim` theme tokens (0.5d, simplest, single CSS block)
  2. **R7.5** — Fix chrome-level `aria-valid-attr-value` (1d, debug axe details first to find exact selector)
  3. **R7.9** — Complete `apiRoleToLocal` (3 → 10 roles), extract to shared file, add flow regression spec (0.5d)
  4. **Re-run** §1 (subset: a11y only), §2 (full), §5 (full) measurement specs
  5. **Stop**, report, await owner explicit gate before starting Performance track (R7.1 + R7.2 + R7.3 + R7.7 + R7.8)

**Why critical-path-first:** the 3 sub-Rs above clear most of the FAIL surface in ~2 working days. R7.1+R7.2 (Performance: Vite chunks + Vazirmatn self-host) are bigger surgery and can wait until the FAIL criteria are flipped to PASS/yellow.

**R7.11** (multi-role hierarchy decision) is gated on owner — not in scope for the critical path. R7.9 review will surface it as an open question.

**No R7 sub-R may start until both:**
  - This decision is recorded (D17, this entry), AND
  - The specific sub-R's memo is committed before its code.

**Source:** owner instruction 2026-05-23 («R7 sweep رو به‌عنوان unblock path approve کرد. ترتیب: critical-path-first»).

### D18 — Flow assertions required on every multi-step user journey
**Context:** R3 shipped 10 role dashboards with 12/12 D12 assertions green. Gate A measurement caught that 7 of 10 roles never reach their dashboard because `apiRoleToLocal` was incomplete. **D12 verified the destination, not the journey.** Visiting `/super` directly worked; logging in as `superadmin@…` and being routed to `/super` did not — and D12 had no way of catching that.

**Rule:** every sub-R that touches a multi-step user journey must ship **two flavors** of assertion:
  a. **D12 5-point per landing page** (the existing rule — DOM, computed style, viewport position, no overlap, baseline). This verifies that, when reached, the landing is visually correct.
  b. **Flow assertion(s)**: a Playwright test that starts from the journey's entry point, executes the journey (clicks, form fills, submissions), and verifies the **expected landing URL + landing element**. This catches mapper drift, redirect regressions, state-machine routing bugs, and any other "destination is fine but the path is broken" class of bug.

**Multi-step journeys that fall under this rule:**
  - Login → role-aware home redirect (R7.9 — first instance)
  - Register → onboarding → first-page (Phase B onboarding R)
  - Application submit → confirmation → application status (Phase B StudentApplication/InstructorApplication state machine)
  - Quiz / assignment submit → grade → transcript update (Phase C learning loop)
  - Enrollment → first lesson → progress recorded (Phase B + C overlap)
  - Live class join → recorded → transcript ready (Phase D)
  - Every XState state-machine transition that the SPA exposes to users (every state machine sub-R in Phase B + C)

**What R7.9 ships as the first D18 instance:**
  - `apps/web/tests/visual/gate-a-role-routing.spec.ts` — logs in as each of 10 demo users, asserts `expect(page.url()).toMatch(new RegExp(escapeRegex(expectedHomeRoute) + "$"))`.
  - Runs in the existing visual docker profile via `.\scripts\remote.ps1 visual -Service gate-a-role-routing`.
  - Tagged so the suite can be cherry-picked into CI's `pretest` hook (or any "smoke before push" step Phase B introduces).

**Why "expected landing URL + landing element" not just URL:** URL alone catches the routing bug; the additional landing-element check (e.g., `expect(page.locator(".r6-classroom-shell")).toBeVisible()` for the classroom flow) catches the case where the route is correct but the page failed to mount (auth race, missing data, hydration error).

**Application:** D18 takes effect immediately. R7.9 is the first sub-R that must satisfy it. Phase B onboarding work and every Phase C state-machine sub-R inherit the rule. Phase A's already-shipped sub-Rs (R1.x, R2, R3, R4, R5, R6, R6.5, R6.6) won't be retro-fitted — they predate D18 and any flow gaps from them are addressable through R7.x sub-Rs as discovered.

**Source:** owner instruction 2026-05-23 («D18 از این به بعد روی هر sub-R که چند گام دارد aplly می‌شه»).

### R6.6-D15 — Logical CSS properties are the canonical RTL fix
**Context:** R6.6 fixed a user-reported navbar RTL bug. Two CSS choices for pushing `.nav-actions` to the end edge:
  - A. `margin-left: auto` (physical) — works only in LTR; in RTL the "left" side is the END so this would push the wrong way.
  - B. `margin-inline-start: auto` (logical) — under RTL "inline-start" is the right edge; absorbing the start-side margin pushes the box toward the end (left). One rule, both directions correct.
**Choice:** B.
**Why:** Single source of truth for both LTR (Phase-F en-US locale, if ever) and RTL (current). No `[dir="rtl"]` override needed. Aligns with the existing `inset-inline-start` / `inset-inline-end` patterns already used in AppShell's Sheet drawer (R1.1) and the R6 classroom CSS.
**Application:** R6.6 used `margin-inline-start: auto` on `.nav-actions`. Future RTL fixes that involve directional margins, padding, or absolute positioning must use logical-property equivalents (`margin-inline-*`, `padding-inline-*`, `inset-inline-*`, `border-inline-*`, `start-*` / `end-*` Tailwind utilities) — never `margin-left/right`, `padding-left/right`, `left/right`, etc.
**Source:** owner-prescribed debug-step list 2026-05-23 («ml-* و mr-* استفاده شده یا ms-* و me-*؟»).
