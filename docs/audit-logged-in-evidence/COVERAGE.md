# Audit coverage matrix

Generated from `apps/web/tests/visual/audit-logged-in.spec.ts` (commit
`5d5b32e`) running against `https://digiuniversity.ir` (post-Gate-2 deploy
at `1bd44d8`).

**Spec / evidence path note:** the user-spec asked for `docs/audit-evidence/`
but the project's `remote.ps1 visual -Service <name>` auto-routes to
`docs/<name>-evidence/`. The PNGs landed at
`docs/audit-logged-in-evidence/` — same content, slightly different folder
name. AUDIT_HONEST.md references this path consistently.

## Cells (5 roles × 6 viewports × 5 pages = 150 PNG)

|        | 320 | 375 | 768 | 1024 | 1280 | 1536 |
|---|---|---|---|---|---|---|
| **student**      | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 |
| **instructor**   | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 |
| **admin**        | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 |
| **parent**       | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 |
| **organization** | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 | 5 / 5 |

Per-cell PNGs:
- `01-login.png` — login form with the role chip pre-selected (BEFORE submit), demo creds panel visible.
- `02-dashboard.png` — `/dashboard` post-login, `fullPage: true`.
- `03-sidebar.png` — `/dashboard` with the sidebar interaction. On `<md` the hamburger is clicked first, on `≥md` captured as-is.
- `04-workspace.png` — role-distinctive primary work surface (`/my-courses`, `/instructor`, `/admin`, `/parent`, `/admin` for org), `fullPage: true`.
- `05-classroom.png` — `/classroom` (the page the owner flagged as the worst).

## Login outcomes

Every role logged in successfully with `apps/api/src/prisma/seed.ts` defaults — there were zero
`*-LOGIN_FAILED.png` or `*-ERROR.png` files. The VPS isn't overriding `SEED_*_PASSWORD`.

## What is NOT covered in this evidence

These are deliberate gaps the audit doesn't speak to:

- Workspace interaction beyond first paint (open course details, start a class, submit an assignment).
- Live classroom transitions: poll appearing mid-session, breakout drawer, reactions, AI tutor panel. We captured the lobby, not the live phase.
- The 5 Phase-15 additional roles (ta, content_manager, support, moderator, super_admin). Out of scope per user instruction (5 primary roles).
- Settings, profile, billing, search, command palette open state.
- Forms that error (invalid input, expired session).

If the user's site complaint spans those surfaces too, AUDIT_HONEST.md
under-counts the broken set.
