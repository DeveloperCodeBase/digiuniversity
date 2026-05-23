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
