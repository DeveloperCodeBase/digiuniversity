# Demo users

The `demo` tenant ships with one seeded user per role so anyone with the
URL can log in and explore the role-aware UI without admin having to
create accounts by hand. The login page (`/login`) shows a one-click
"پر کردن خودکار" button that fills these credentials for the active role
tab — you should never need to copy/paste from this file.

> If you're shipping a real tenant, the demo-credentials panel hides
> automatically because it's gated on `tenantSlug === "demo"`.

## Credentials

All users live in the `demo` tenant.

| Role | Email | Password | Lands on |
| --- | --- | --- | --- |
| **Student** (دانشجو) | `student1@digiuniversity.ir` | `StudentPass!1` | `/progress` (live data) |
| **Instructor** (استاد) | `instructor1@digiuniversity.ir` | `InstructorPass!1` | `/progress` (live data) |
| **Admin** (مدیر) | `admin@digiuniversity.ir` | `ChangeMe!2026` | `/progress` (live data) |
| **Parent** (والد) | `parent1@digiuniversity.ir` | `ParentPass!1` | `/parent` (mock) |
| **Org** (سازمان) | `org1@digiuniversity.ir` | `OrgPass!1` | `/admin` (mock) |

## Where these are defined

Three places, kept in sync manually:

1. **API seed** — [`apps/api/src/prisma/seed.ts`](../apps/api/src/prisma/seed.ts).
   The actual user creation happens here. `RUN_SEED=false` is the
   production default (Phase 13 R2); re-run explicitly via:
   ```powershell
   .\scripts\remote.ps1 seed
   ```
   That's idempotent — existing users are skipped, only missing ones
   are created.

2. **Login page panel** — [`apps/web/src/pages/Auth.tsx`](../apps/web/src/pages/Auth.tsx)
   `DEMO_CREDS` constant. Drives the one-click "پر کردن خودکار" button.

3. **This file** — readable canonical list.

## Rotating a password

The seed file's password env vars are:
- `SEED_ADMIN_PASSWORD` (default `ChangeMe!2026`)
- `SEED_INSTRUCTOR_PASSWORD` (default `InstructorPass!1`)
- `SEED_STUDENT_PASSWORD` (default `StudentPass!1`)
- `SEED_PARENT_PASSWORD` (default `ParentPass!1`)
- `SEED_ORG_PASSWORD` (default `OrgPass!1`)

But `seed.ts` is also explicit that **it never overwrites an existing
user's password** — passwords are rotated through the API's
`/v1/users/me/change-password` endpoint, not the seed. So for the
existing demo users on the live VPS the passwords above are the ones
that work, regardless of what `.env` says.

To genuinely rotate a demo user's password, you have two options:

```powershell
# Option A — change-password endpoint (preserves user id, roles, history):
.\scripts\remote.ps1 shell
# then on the VPS:
docker exec digiuniversity-api node -e "..."   # call the password-change API

# Option B — delete + re-seed (clean slate, NEW user id):
docker exec digiuniversity-postgres psql -U digiuniversity -d digiuniversity \
  -c "DELETE FROM \"User\" WHERE email = 'parent1@digiuniversity.ir';"
.\scripts\remote.ps1 seed
```

Phase 15+ will add a Super-Admin "Reset demo passwords" button to make
this less manual.

## Why parent1 + org1 didn't exist before Phase 14.6

Phase 11's original seed only created admin, instructor, and student.
The LoginPage UI shipped with 5 role tabs (student/instructor/admin/
parent/org), but selecting `parent` or `org` and trying to log in
failed silently because no matching user existed. F-120 in
[`docs/QUALITY_FINDINGS.md`](QUALITY_FINDINGS.md) covers this.

## Why "I don't see any changes" after a deploy

Until Phase 14.6, the PWA was `registerType: "autoUpdate"` with no
`skipWaiting` / `clientsClaim`. A new service worker installed in the
background but didn't activate until every tab of the site was closed
and reopened. On a long-lived LMS tab, users could see the old SPA
for hours after a deploy.

Phase-14.6 added `skipWaiting: true`, `clientsClaim: true`, and
`cleanupOutdatedCaches: true` to the workbox config. Now every deploy
takes effect on the next page navigation. F-121.

If you're STILL seeing old code after Phase 14.6:
1. Hard refresh: `Ctrl+Shift+R` / `Cmd+Shift+R`.
2. If still cached, in DevTools → Application → Service Workers →
   Unregister, then reload.
3. If still cached, clear site data: DevTools → Application →
   Storage → Clear site data.
