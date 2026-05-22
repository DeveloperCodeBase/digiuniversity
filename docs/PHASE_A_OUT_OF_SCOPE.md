# Phase A — Out-of-scope log

> Running record of issues spotted **during** a sub-R that are not part of that sub-R's scope. Each entry has a sub-R origin, a file/line if known, and a candidate destination (which later phase/PR should fix it). Never silently fix mid-stream — that's the vasle-pinneh pattern this log exists to prevent.

## Schema

```
### YYYY-MM-DD — R{n.n} — <short title>
File:        <path:line or "n/a">
What I saw:  <one sentence>
Why I didn't fix it: <out of scope for R{n.n}>
Candidate destination: <Phase B / R{n}, or a separate ticket name>
```

## Entries

### 2026-05-22 — R1.1 — Harden `remote.ps1` docs-sweep cleanup
File:        scripts/remote.ps1 (the `up`, `restart`, `pull`, `build` actions)
What I saw:  The `git checkout -- docs/ 2>/dev/null; git clean -fd docs/ 2>/dev/null` prefix silently fails when Playwright-container PNGs are owned by a UID the VPS user can't unlink, so the subsequent `git pull` aborts on untracked-file conflict.
Why I didn't fix it: out of scope for R1.1 (AppShell). Modifying a cross-cutting infra script mid-R1 risks scope creep and needs its own testing.
Candidate destination: dedicated "infra: harden remote.ps1 docs sweep" PR after Gate A. Suggested fix: replace silent `git clean -fd docs/ 2>/dev/null` with `sudo rm -rf docs/audit-logged-in-evidence docs/gate-2-evidence/smoke 2>/dev/null || true` (sweep the two known evidence dirs that aren't tracked at the VPS commit baseline), or alternatively make the Playwright run chmod files post-write so the VPS user can delete them. See `PHASE_A_DECISIONS.md` R1-D6 for the diagnosis.
