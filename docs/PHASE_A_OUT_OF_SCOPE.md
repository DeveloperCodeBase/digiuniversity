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

### 2026-05-22 — R1.3 — B6: Live classroom mobile rewrite (deferred to Phase D R1)
File:        apps/web/src/pages/Classroom.tsx
What I saw:  Manual smoke on R1 found the classroom page broken on <md viewports. The current implementation predates the LiveKit integration that Phase D ships and would need to be re-done from scratch regardless.
Why I didn't fix it: R1.3 scope is post-smoke fixes + sidebar redesign + brand. Touching classroom now means writing throwaway code that Phase D's ground-up rewrite would discard.
Candidate destination: Phase D R1 (LiveKit integration). The full rewrite will include mobile-first layout (bottom sheet for participants, swipe gestures, full-bleed video on <md per Master Runbook §D specs). Owner notified.

### 2026-05-22 — R1.2 — Extract a shared "auth-once" Playwright helper (post-Gate-A test infra task)
File:        apps/web/tests/visual/_setup/ (new) or playwright.visual.config.js globalSetup
What I saw:  Auth flow is throttled at 10/min per IP. The visual docker runs all specs from the same IP, so by the 11th login attempt in a minute the API returns 429 and `page.waitForURL` times out. R1.2's first run had 5 failures because R1.1's 13 logins consumed the bucket. Workaround inside R1.2 spec: one beforeAll login + sharedContext for all login-required tests.
Why I didn't fix it: would require touching playwright.visual.config.js or adding a global-setup file; bigger than R1.2.
Candidate destination: post-Gate-A test-infra PR "shared auth context for visual specs". Suggested approach: Playwright globalSetup writes auth state JSON to disk; each spec uses `test.use({ storageState })`. Eliminates per-spec login overhead and dodges the rate limit. The R2/R3/R5 specs will all need it.

### 2026-05-23 — OWNER-FINDING-1 — Avatar placeholder needs design pass (Phase B Profile model)
File:        apps/web/src/pages/About.tsx (and likely Home / Programs / any "team" section)
What I saw:  Owner-shared screenshot of `/about` shows a team grid using **avatar placeholders** that:
  - Render as bullet/oval shapes, not circles (CSS `border-radius` not applied to a `1:1` aspect-ratio container).
  - Use mismatched colors against the navy + gold palette set in R6.5 — visible turquoise, coral, green, orange chips. Pre-R6.5 random-color seed never got updated.
  - Display **Latin initials** ("AA", "SM", "MK", "BF", "RT", "SR", "AN", "MK", "JK", "TT") on a Persian-locale site that uses Persian everywhere else.
  - Carry **zero context** — no name, no role label, no specialty / department. Placeholder copy is empty.
This is scaffolding from the original SPA's mock content. R6.5 (theme switch) didn't address it because it was outside that sub-R's scope; R1.3 (brand work) only touched the footer + global logo.

Why I didn't fix it: this is a **product-content gap**, not an a11y/contrast/RTL bug. The right fix needs:
  - Real team data (or a justified placeholder set with proper Persian initials)
  - A circular avatar component aligned to the navy + gold palette
  - Role/specialty/department metadata + an optional bio popover
That's design + content work, not Phase A "Foundation Repair" code work. Owner confirmed this is a "report, do not fix in Phase A" — record here, resolve under Phase B (Academic Hierarchy + Profile model adds Faculty / Instructor / Student profile records with real fullName + role + specialty).

Candidate destination: **Phase B — Profile model sub-R**. When `Profile`, `Instructor`, `Faculty`, `StudentApplication` ship in Phase B (per the Compass Roadmap §B locked plan), an "Avatar" component lands at the same time. Design tokens to use:
  - circular `border-radius: 50%` on `aspect-ratio: 1`
  - background from a deterministic hash of full-name → navy-700 / navy-600 / navy-800 / gold (4 brand-aligned variants, no random turquoise/coral)
  - Persian initials extracted from `fullName.split(" ").slice(0, 2).map(p => p[0]).join("")`
  - alt text = full name
  - optional badge for role icon at bottom-right

Owner notified 2026-05-23. Implementation gated on Phase B start (which itself is gated on Gate A pass per D17).

### 2026-05-23 — OWNER-FINDING-2 — Role-aware navigation differentiation (subsumed by R7.9)
File:        n/a (root cause traced to apps/web/src/pages/auth/LoginPage.tsx::apiRoleToLocal)
What I saw:  Owner reported all 10 demo roles see the same navbar / sidebar / user menu after login. Initial read: another R3-style gap where 6 new roles never got their own nav items.
Diagnostic outcome: **the navigation IS role-aware in code.** See `docs/PHASE_A_R8_ROLE_NAV_AUDIT.md` for the full per-role × per-component table. Both `SIDEBAR_BY_ROLE` (apps/web/src/sidenav.tsx) and `NAV_ITEMS_BY_ROLE` (apps/web/src/shared.tsx) define 10 distinct entries — one per role — with role-appropriate item lists. Both consume `useRole()` to pick the right one.

The visible symptom (same nav for everyone) is the **same root cause as Gate A §5**: `apiRoleToLocal` maps only 3 of 10 API roles, so parent/org/ta/cm/support/moderator/super_admin all get bucketed as "student" → `setRole("student")` → both `useRole()` consumers (Nav + RoleSideNav) read the student entries. One upstream bug, multiple downstream symptoms.

Why I didn't fix it as a separate sub-R: R7.9 (already on the critical path per D17) fixes the upstream mapper. Once R7.9 ships, the navigation differentiation appears automatically because the data + wiring already exist.

Candidate destination: **R7.9** (already planned). Per D18, R7.9's flow regression spec must also assert the sidebar + navbar content per role to catch any future regression of the same shape:
  - After login as `parent`, expect at least one `--side-nav <a>` whose `id` is `parent`
  - After login as `super_admin`, expect a nav-link `audit` to be visible
  - …per the audit doc's role × item matrix
This extends D18's flow-assertion scope from "URL match" to "URL match + role-tailored content visible".

### 2026-05-22 — R1.1 — Harden `remote.ps1` docs-sweep cleanup (post-Gate-A infra task)
File:        scripts/remote.ps1 (the `up`, `restart`, `pull`, `build` actions)
What I saw:  The current `git checkout -- docs/ 2>/dev/null; git clean -fd docs/ 2>/dev/null` prefix silently fails when Playwright-container PNGs are owned by a UID the VPS user can't unlink, so the subsequent `git pull` aborts on untracked-file conflict.
Why I didn't fix it: out of scope for R1.1 (AppShell). Modifying a cross-cutting infra script mid-R1 risks scope creep and needs its own testing.
Candidate destination: dedicated **post-Gate-A infra PR** "harden remote.ps1 docs sweep".
Recommended fix per R1.1-D8: replace the silent `git clean -fd docs/` with `sudo git -c safe.directory=$PWD clean -fdx docs/ 2>/dev/null || true`. The `-x` flag also clears `.gitignore`'d files, and `sudo` defeats the Playwright-container UID problem. Avoid `find -newer .git/HEAD` — it deletes tracked PNGs too (verified the hard way 2026-05-22 during the cleanup attempt). See `PHASE_A_DECISIONS.md#R1.1-D8`.
