# Phase 14.5 review — Critical-file `@ts-nocheck` retirement

**Scope.** A focused mini-phase between Phase 14 (monorepo + TS rename + BrowserRouter) and Phase 15 (RBAC + CASL + audit_log). Goal: type the files Phase 15 will build on so the new RBAC code lands on a typed foundation, not on `@ts-nocheck`.

Six commits, ten files, three real bugs surfaced.

| Commit | Files | Bugs surfaced |
|---|---|---|
| C1 [`070808c`](https://github.com/DeveloperCodeBase/digiuniversity/commit/070808c) | `role.tsx` | localStorage role-id not validated before trust |
| C2 [`6ec8db7`](https://github.com/DeveloperCodeBase/digiuniversity/commit/6ec8db7) | `auth/AuthContext.tsx`, `auth/ErrorBoundary.tsx` | useEffect cleanup returned `boolean` not `void` |
| C3 [`af8a540`](https://github.com/DeveloperCodeBase/digiuniversity/commit/af8a540) | `router.tsx`, `App.tsx`, `main.tsx` | `useGo` truncated `param===0`; #root non-null not asserted |
| C4 [`db9f6dc`](https://github.com/DeveloperCodeBase/digiuniversity/commit/db9f6dc) | `shared.tsx`, `sidenav.tsx` | `e.target.closest` on `EventTarget` (not `Element`) |
| C5 [`4fe39a8`](https://github.com/DeveloperCodeBase/digiuniversity/commit/4fe39a8) | `ui.tsx` | Theme not validated before trust; toast input not narrowed |
| C6 [`f4d86bf`](https://github.com/DeveloperCodeBase/digiuniversity/commit/f4d86bf) | `pages/Auth.tsx` | catch-err.message read on `unknown`; Icon style silently dropped; toggle implicit-any |

## The typed contract Phase 15 inherits

Everything Phase 15's RBAC + CASL + AuditLog work depends on now has a proper TypeScript interface:

```ts
// role.tsx — RBAC foundation
export type RoleId = "student" | "instructor" | "admin" | "parent" | "org";
export type RolePermission = "learn" | "submit" | ... (17 entries);
export interface Role { id, label, name, ..., permissions: RolePermission[] }
export interface RoleContextValue { role, setRole: (id: RoleId) => void }
export const ROLES: Record<RoleId, Role>;

// auth/AuthContext.tsx — session shape mirrors /v1/auth/me
export interface AuthUser { userId, tenantId, tenantSlug, email, roles: string[] }
export interface AuthSession { accessToken, refreshToken, user: AuthUser, ... }
export interface AuthContextValue { session, user, isAuthenticated, hasRole, login, register, logout }

// router.tsx — navigation contract for all 140 page call sites
export type Go = (id: string, param?: string | number | null) => void;
export const useGo: () => Go;
export interface CurrentRoute { id: string; param: string | null }

// ui.tsx — chrome contract
export type Theme = "dark" | "light";
export interface UseThemeReturn { theme, setTheme: (t: Theme) => void }
export interface ToastMessage / ToastInput / UseToastReturn / ConfirmActionOptions
declare global { interface Window { toast, confirmAction, openCommandPalette } }

// shared.tsx + sidenav.tsx — typed nav surface
interface NavItem { id, label, live? }
const NAV_ITEMS_BY_ROLE: Record<RoleId, NavItem[]>
type SidebarEntry = SidebarHeader | SidebarLink  // discriminated union
const SIDEBAR_BY_ROLE: Record<RoleId, SidebarEntry[]>

// pages/Auth.tsx — auth pages
interface AuthPageProps { go: Go }
interface LoginErrors { tenantSlug?, email?, password?, general? }
```

Phase 15's CASL `abilities-factory.ts` can `import type { Role, RolePermission, RoleId } from "../role"` and the abilities-builder will get exhaustive narrowing on the role-id switch. Phase 15's `<Can I={...} a={...}>` component can wrap the existing `<Layout>` chrome (typed via router.tsx) without any `any` leaking.

## Bugs caught (worth their own retro section)

The plan said "types واقعی اضافه کن (نه any)" — strict typing surfaced three bugs that had been hidden under `@ts-nocheck` since Phase 14 R2. Phase 14.5 was worth the spend just for these.

1. **`sessionStore.subscribe` returned `() => boolean` to useEffect's `() => void` cleanup contract.** Auth state subscriber. Not a runtime crash today (React tolerates falsy returns) but a forward-compatibility hazard. C2 [`AuthContext.tsx:91`](apps/web/src/auth/AuthContext.tsx#L91).

2. **`useGo("course", 0)` silently dropped the `0` param** because `param ?` treats 0 as falsy. Nothing passes numeric params today, but C3 made the typing `string | number | null` which surfaced the bug and fixed it with `param != null && param !== ""`. C3 [`router.tsx`](apps/web/src/router.tsx).

3. **`<Icon ... style={{ color }} />` in `AuthVisualSecurity` was silently dropped** because Icon's signature doesn't accept `style`. Visually: the check icon never actually rendered in `var(--accent)` color despite the code claiming so. C6 wrapped in `<span style={{ color }}>` so currentColor propagates. The accent-coloured check now shows correctly. C6 [`pages/Auth.tsx`](apps/web/src/pages/Auth.tsx).

## What's still `@ts-nocheck`'d

Per the user's scope ("only 10-15 critical files, leave the rest"): 45 files retain `@ts-nocheck` for now. Retirement plan stays the same — any PR that touches a `.tsx` file removes its `@ts-nocheck` and types the file's props. Hard target: zero by end of Phase 18.

Notably still nocheck'd:
- `icons.tsx` — Icon component itself; would need a careful prop interface. Phase 15 likely touches this when wiring CASL `<Can>`.
- All 46 other page files (`Catalog.tsx`, `Dashboard.tsx`, etc.) — bulk of the SPA. Retire as touched.
- `components/*` widgets — small, leaf-level components.
- `motion.tsx` — `<ScrollProgress />` and animation helpers.

Phase 15 RBAC work won't be blocked by any of these because the chrome + entry chain + auth + role context are all properly typed now.

## What's running on the VPS

After the closing P14.5 deploy:

```
NAME                        STATUS                  PORTS
digiuniversity-ai-gateway   Up (healthy)            8000/tcp
digiuniversity-api          Up (healthy)            4000/tcp
digiuniversity-app          Up (healthy)            80/tcp
digiuniversity-postgres     Up (healthy)            5432/tcp
```

Live URL: all 6 paths in `spa-probe` return 200 + text/html. Bundle: `dist/assets/index-Bgfpp_UH.js` (669 KB / 192 KB gzipped) — same order of magnitude as pre-P14.5 (the strict-mode bug fixes added ~1 KB raw). Demo users still work.

## Methodology lessons for the next phase

1. **`@ts-nocheck` retirement surfaces real bugs.** Six files, three bugs caught — none would have been found by review. The cost is +1 hour per file; the benefit is real correctness.

2. **Catch-block error narrowing is non-negotiable under strict.** `catch (err)` gives `unknown`. Every `err.message` access needs an `instanceof Error` guard. Cheap rule, catches "undefined error message" toast bugs.

3. **Empty-default useState needs explicit type.** `useState({})` infers `{}`, which makes every property access an error. Either pass an initial value with all the keys, or annotate: `useState<LoginErrors>({})`.

4. **Type a callback's signature precisely or it leaks.** The `go(id, param)` signature was the right place to lock down `string | number | null` so numeric params don't get silently truncated by a `param ?` falsy check.

5. **`declare global { interface Window {} }` belongs in the file that assigns the property, not in a consumer.** P14.5 moved `Window.toast` / `confirmAction` / `openCommandPalette` from `shared.tsx` (consumer) to `ui.tsx` (definer). The wrong-shape declaration in shared.tsx had `confirmAction: (msg: string)` instead of `(opts: ConfirmActionOptions)` — caller code in Academic.tsx was lying about what it passed.

## Sign-off

Phase 14.5 closes with `role.tsx`, `auth/AuthContext.tsx`, `auth/ErrorBoundary.tsx`, `router.tsx`, `App.tsx`, `main.tsx`, `shared.tsx`, `sidenav.tsx`, `ui.tsx`, and `pages/Auth.tsx` fully typed under `strict: true`. Phase 15 RBAC + CASL + AuditLog work picks up from this typed foundation. The remaining 45 `.tsx` files retire `@ts-nocheck` per-PR as they're touched.
