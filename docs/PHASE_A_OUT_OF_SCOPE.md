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

### 2026-05-22 — R1.1 — Harden `remote.ps1` docs-sweep cleanup (post-Gate-A infra task)
File:        scripts/remote.ps1 (the `up`, `restart`, `pull`, `build` actions)
What I saw:  The current `git checkout -- docs/ 2>/dev/null; git clean -fd docs/ 2>/dev/null` prefix silently fails when Playwright-container PNGs are owned by a UID the VPS user can't unlink, so the subsequent `git pull` aborts on untracked-file conflict.
Why I didn't fix it: out of scope for R1.1 (AppShell). Modifying a cross-cutting infra script mid-R1 risks scope creep and needs its own testing.
Candidate destination: dedicated **post-Gate-A infra PR** "harden remote.ps1 docs sweep".
Recommended fix per R1.1-D8: replace the silent `git clean -fd docs/` with `sudo git -c safe.directory=$PWD clean -fdx docs/ 2>/dev/null || true`. The `-x` flag also clears `.gitignore`'d files, and `sudo` defeats the Playwright-container UID problem. Avoid `find -newer .git/HEAD` — it deletes tracked PNGs too (verified the hard way 2026-05-22 during the cleanup attempt). See `PHASE_A_DECISIONS.md#R1.1-D8`.
