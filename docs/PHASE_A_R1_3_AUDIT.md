# Phase A R1.3 — Manual-smoke audit

> R1.3 shipped 39/39 automated assertions green. Owner manual smoke found the same 6 bugs R1.3 was supposed to fix. This document reconciles the gap, screenshot by screenshot.
>
> Skeleton committed before any code. Columns 4 (screenshot), 5 (gap cause), and 6 (fix) are filled in only when the owner's screenshots arrive. Until then this file is the contract for what must happen next.

## Rule (R1.3-D13)

If owner manual smoke fails, the sub-R fails — regardless of automated pass rate. R1.3 "passed" 39 assertions and still failed on a real device. The automated number means nothing in isolation.

## Audit table

| # | Bug | R1.3 assertion | What the assertion verified (and passed) | What the screenshot shows | Why the assertion missed it | Fix |
|---|---|---|---|---|---|---|
| 1 | **B1** — Navbar not sticky on mobile (scrolls up with content) | `phase-a-r1-3-fixes.spec.ts:42` "nav has position: sticky and html[data-scrolled] toggles past 4px" | Computed `position` on `nav.nav` === `sticky` at viewport 375. `html[data-scrolled]` attribute toggled after scrollY > 4. | _awaiting screenshot_ | _awaiting screenshot_ | _awaiting screenshot_ |
| 2 | **B2** — Login layout broken / role chips wrong on mobile | `phase-a-r1-3-fixes.spec.ts:145` "login role tabs render as 2-column grid at 375 (assert via child positions)" + `:166` form-side max-width 420 + `:176` no horizontal overflow | 5 chips at 375 produced 3 unique offsetTop values (= 3 rows of 2+2+1). Form-side computed max-width === "420px". `scrollWidth - innerWidth ≤ 2`. | _awaiting screenshot_ | _awaiting screenshot_ | _awaiting screenshot_ |
| 3 | **B3** — Dashboard + Profile not responsive on mobile | `phase-a-r1-3-fixes.spec.ts:186` dashboard at 375 no horizontal overflow + `:197` stat-row collapses to single col + `:208` profile no h-overflow + stacks 1fr-320px grid | `scrollWidth - innerWidth ≤ 2` on /dashboard and /profile at 375. Stat-row computed `gridTemplateColumns` had 1 value. Profile grid had 1 value. | _awaiting screenshot_ | _awaiting screenshot_ | _awaiting screenshot_ |
| 4 | **B4** — Workspace mobile sidebar drawer not opening | `phase-a-r1-3-fixes.spec.ts:70` "B4: at 375px, hamburger opens the workspace drawer with sidebar items (not public nav-links)" | After login + goto /dashboard + click `button.nav-toggle`, a `[aria-label='منوی workspace']` element became visible. The Sheet content contained `.side-nav`. | _awaiting screenshot_ | _awaiting screenshot_ | _awaiting screenshot_ |
| 5 | **B5** — Landing leaks logged-in user info | `phase-a-r1-3-fixes.spec.ts:262` "authed student on / never sees Nav before redirect" | requestAnimationFrame poll in the browser saw `nav.nav` never co-exist with pathname `/` or `/home`. Redirect to `/dashboard` confirmed. | _awaiting screenshot_ | _awaiting screenshot_ | _awaiting screenshot_ |
| 6 | **D9** — Sidebar hamburger-toggle on every viewport | `phase-a-r1-3-fixes.spec.ts:88` lg hamburger visible + `:97` localStorage pref toggles + `:115` ≥3xl pinned-inline + `:132` <3xl always drawer | Hamburger visible at 1280. localStorage `digiu_sidebar_pref` flipped on click. At 1536 with pref=open, `.workspace-grid[data-sidebar-pinned]` rendered. At <1536, even with pref=open the Sheet drawer opened. | _awaiting screenshot_ | _awaiting screenshot_ | _awaiting screenshot_ |
| 7 | **Brand** — JDO logos, footer copyright, About paragraph | `phase-a-r1-3-fixes.spec.ts:219`–`:259` four assertions on `.org-attribution-full`, `.org-attribution-compact`, About-page paragraph fragments | All four selectors found in DOM. Persian text fragments visible. `<img>` elements with correct `src` attributes attached. | _awaiting screenshot_ | _awaiting screenshot_ | _awaiting screenshot_ |

## Procedure once screenshots arrive

1. For each row, fill columns 4–6 from the screenshot.
2. The fix column lists the **exact** file + line to change. No hand-wavy "improve responsive" — only "Auth.tsx:215 add `.role-tab-strip-fixed` class with explicit 2-col CSS, no inline."
3. For each row, write a NEW assertion (per D12 — the 5-point visual contract) that would have caught what the screenshot shows.
4. Commit the filled audit. Then execute the fixes one bug per commit. Then re-verify with the new assertions AND a follow-up manual smoke.

## What the rule says now

- **D12** — every visual claim asserts 5 things, not just `toBeVisible()`. See `PHASE_A_DECISIONS.md#R1.3-D12`.
- **D13** — manual smoke is a formal gate; automated pass without manual pass is not a pass. See `PHASE_A_DECISIONS.md#R1.3-D13`.

Both rules saved to memory so they outlive this session.

## What does not happen until screenshots arrive

No R1.4 code. No R2. No new specs. No retries. Waiting.
