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
