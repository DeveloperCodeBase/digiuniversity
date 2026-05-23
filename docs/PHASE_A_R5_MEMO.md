# Phase A R5 — Memo (Login redesign per owner template)

> Written before code. Commits before any implementation file. Owner dropped a complete template at `docs/my-upload/login/` with HTML + LoginPage.tsx + KnowledgeGraph.tsx + assets. R5 is the integration sub-R: apply the design exactly, wire to the real auth flow, ship responsive at every viewport.

## What I'm going to build

A redesigned `/login` page that exactly matches the owner template's visual design:

- **Split layout** at lg+: brand panel (left in RTL = visually right) with animated knowledge-graph backdrop + testimonial + editorial headline + stats row; form panel (right in RTL = visually left) with the actual auth form.
- **Single-column collapse** ≤880px (brand becomes a 260px-max strip).
- **Form-only** ≤720px (brand panel hidden entirely; phone gets the whole screen).
- **Tightened controls** ≤420px (role chip icons hidden, smaller padding).
- **Light + dark theme** — white/navy palette (light) → deep-navy/lavender palette (dark). Driven by `html[data-theme]` (already wired via existing ThemeProvider).
- **Animated knowledge graph** — SVG nodes drift with edges fading in/out within proximity. Theme-aware accent.
- **Role selector** — segmented control with sliding indicator (Radix-free, ResizeObserver-based).
- **Demo credentials box** — dark card with one-click auto-fill button.
- **Password strength meter** — 4-bar visual indicator.
- **SSO buttons** — Google + National Gateway (ID.IR) + Org (SAML/SSO). Stubbed for now — clicks render a toast saying "نمونه".
- **Co-brand footer** — Jahad mark + org name + the 4 footer links (privacy, support, status, API).
- **Toast** — bottom-left, auto-dismiss after 2.8s.

The template's "tweaks panel" (dev-only toolbar) is **NOT** integrated — that's a Storybook-dev feature, not production.

## Existing auth wiring to PRESERVE

The current `apps/web/src/pages/Auth.tsx` LoginPage already has the real auth flow:

- `auth.login({ tenantSlug, email, password })` → calls `/v1/auth/login` via the api client.
- On success: `apiRoleToLocal(user.roles)` maps the API role array to one of the local RoleId values, then `setRole(localRole)` + `go(ROLES[localRole].homeRoute)`.
- On error: `err instanceof ApiError` → reads `displayMessage`; else `Error.message`; toast with kind=warn.
- DEMO_CREDS dict has 10 roles seeded (student/instructor/admin/parent/org/ta/content_manager/support/moderator/super_admin) with their seed credentials.
- Validation: tenant + email + password required; email format check; password ≥8 chars.

R5 must NOT change any of this — only the visual shell.

## Files I will touch (max 15)

| # | File | New / Modify | Purpose |
|---|---|---|---|
| 1 | `apps/web/src/components/KnowledgeGraph.tsx` | NEW | Animated SVG nodes + edges, typed, theme-aware |
| 2 | `apps/web/src/pages/auth/LoginPage.tsx` | NEW | The redesigned LoginPage — replaces the inline LoginPage that lives in `Auth.tsx` |
| 3 | `apps/web/src/pages/auth/login-atoms.tsx` | NEW | Atoms reused from the template: Field, TextInput, Checkbox, Eyebrow, PillButton, Wordmark, DemoBox, SsoButton, GoogleGlyph, NationalGlyph, OrgGlyph, PassStrength, Spinner |
| 4 | `apps/web/src/pages/auth/BrandPanel.tsx` | NEW | The lg+ brand panel (knowledge graph + testimonial + headline + stats) |
| 5 | `apps/web/src/pages/auth/CoBrandFooter.tsx` | NEW | Jahad mark + footer links |
| 6 | `apps/web/src/pages/Auth.tsx` | MODIFY | Replace inline LoginPage with import from `./auth/LoginPage`; keep RegisterPage / ForgotPage / TwoFactorPage / VerifyEmailPage / OnboardingPage unchanged (R5 scope is login only) |
| 7 | `apps/web/styles.css` | MODIFY (+~80 lines) | New `.r5-login-*` scope for the redesign (CSS vars + responsive media queries); old `.auth-grid` + `.auth-visual` rules deprecated under the new design |
| 8 | `apps/web/src/router.tsx` | MODIFY (1 line) | Import LoginPage from `./pages/auth/LoginPage` instead of `./pages/Auth` (Auth.tsx still exports it as re-export for back-compat) |
| 9 | `apps/web/tests/visual/phase-a-r5-login.spec.ts` | NEW | 5-point D12 visual contract at 6 viewports (xs/sm/md/lg/xl/2xl) |
| 10 | `docs/PHASE_A_R5_MEMO.md` | NEW (this file) | Plan lock |
| 11 | `docs/PHASE_A_R5_REVIEW.md` | NEW (after R5 deploys) | Review doc + manual smoke checklist |

Logo files already in place at `apps/web/public/logos/jdo-{light,dark}.png` from R1.4. The template's `assets/jahad-{light,dark}.png` are duplicates; we use the existing path.

## Risks

1. **CSS-var-name collision.** The template uses `--paper`, `--ink`, `--muted`, `--line-strong`, `--sage`, `--sage-deep` — names not in our existing `tailwind.config.js` token set. I'll scope these to a `.r5-login-shell` class so they don't leak into the rest of the SPA. Existing tokens (`--surface`, `--fg`, `--fg-mute`, `--accent`) keep working everywhere else.
2. **Inline-style heavy template.** The template uses inline `style={{}}` extensively (it's a single-file HTML proof). I'll preserve the inline styles as-is — moving them to CSS would be a separate cosmetic refactor and isn't R5 scope. Performance-wise it's fine for a single page.
3. **`teacher` vs `instructor`.** The template uses `"teacher"` as the role id; our codebase uses `"instructor"`. I'll keep the template's visible label "استاد" but map the id to `"instructor"` so the role chip drives the correct DEMO_CREDS lookup + setRole call.
4. **KnowledgeGraph performance on low-end mobile.** The animation runs at 60fps on desktop but is CPU-heavy on phones. **Mitigation:** at <880px viewport (when brand panel collapses) AND at `prefers-reduced-motion`, the graph is skipped entirely (the brand panel itself is hidden ≤720px).
5. **D12 5-point contract.** Each assertion in the new spec covers: DOM, computed style, viewport position, no overlap, snapshot diff. Baselines gated behind `UPDATE_BASELINES=1` per the R1.4 workflow.

## Out of scope for R5

- Register / Forgot / Verify-email / Two-factor / Onboarding pages — these stay on the current Auth.tsx implementation. The redesign is **login only** per the template scope.
- SSO actual integration (Google OIDC, ID.IR, SAML). R5 ships the buttons + stub toast. Real SSO is Phase F deliverable per compass.
- 2FA flow — checkbox is preserved as a "ON by default" preference, but the actual 2FA challenge after login still uses the existing `/2fa-setup` route.
- Lockout countdown UI — server-side rate-limit returns 429; we'll surface the error via toast (current behavior) but don't add the visual countdown timer in R5. That's Phase F polish.
- The template's "tweaks panel" — dev-only Storybook feature, not production.

## DoD for R5

- [ ] `/login` at 1280×800 shows the split layout with brand panel + form
- [ ] `/login` at 768×1024 shows single-column with brand strip on top
- [ ] `/login` at 375×800 shows form only (brand panel hidden)
- [ ] All 5 demo roles in the role selector slide the indicator + show the role-specific hint
- [ ] "پر کردن خودکار" auto-fills the demo credentials for the active role
- [ ] Submit calls the existing `auth.login()` flow (no behavior regression)
- [ ] Successful login redirects to `ROLES[localRole].homeRoute` (existing behavior)
- [ ] Failed login surfaces error via toast (existing behavior)
- [ ] Theme toggle (top-right pill) flips light/dark; KnowledgeGraph accent re-themes
- [ ] Knowledge-graph animation pauses on `prefers-reduced-motion`
- [ ] D12 5-point assertions pass: structural + computed style + bounding-box + no-overlap + (gated baseline)
- [ ] All R1.x + R2 specs still green (no regression on existing pages)
- [ ] **Owner manual smoke on real device** — 5-step checklist
- [ ] D13 gate: only "shipped" after owner manual ack

## Verification flow

```powershell
git add -A
git commit -m "Phase A R5: <slug>"
.\scripts\remote.ps1 up                           # vite build + deploy
.\scripts\remote.ps1 logs                         # clean boot
.\scripts\remote.ps1 visual -Service phase-a-r5-login    # D12 spec
.\scripts\remote.ps1 visual -Service phase-a-r1-1-appshell   # regression
.\scripts\remote.ps1 visual -Service phase-a-r1-4-fixes      # regression
# write PHASE_A_R5_REVIEW.md
# pause for owner manual smoke per D13
```
