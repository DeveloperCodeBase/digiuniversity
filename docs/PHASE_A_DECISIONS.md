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
