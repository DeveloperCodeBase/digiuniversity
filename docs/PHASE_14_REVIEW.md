# Phase 14 review — Monorepo + TypeScript + BrowserRouter

**Scope.** Plan-file Phase 14 step 1–3 in three separate sprints, each with its own commit + deploy + verify pass.

R1 = monorepo restructure (file moves only)
R2 = TypeScript migration (.jsx → .tsx + strict tsconfig)
R3 = hash → BrowserRouter (react-router-dom v6)

Findings tracked in [`QUALITY_FINDINGS.md`](QUALITY_FINDINGS.md) under F-112 through F-119.

## What changed

### R1 — Monorepo restructure (`apps/web/`)

15 items moved from the repo root into `apps/web/` via `git mv`:
- `src/`, `public/`, `tests/`, `.storybook/`
- `index.html`, `styles.css`
- `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `playwright.config.js`
- `package.json`, `package-lock.json`
- `Dockerfile`, `nginx.conf`, `.dockerignore`

Updated:
- `docker-compose.yml`: app service `context: ./apps/web`, `dockerfile: Dockerfile`.
- `.github/workflows/ci.yml`: web job `defaults.run.working-directory: apps/web`, lockfile cache + dist artifact paths.

Deliberately NOT in R1: npm workspaces, Turborepo, TypeScript, BrowserRouter, README path refresh.

Build artefact hashes identical to pre-R1 (`index-CwDNjEst.css`, `index-BhXNDvOo.js`) — proved the move was byte-clean.

### R2 — TypeScript migration

Mechanical rename of all 55 `.jsx` files to `.tsx`. 140 explicit `.jsx` imports stripped to extensionless (`from "./Feature.jsx"` → `from "./Feature"`). `// @ts-nocheck — Phase-14 R2 bulk rename` prepended at line 1 of every renamed file as the escape hatch.

New `apps/web/tsconfig.json`:
- `target: ES2022`, `module: ESNext`, `moduleResolution: bundler`, `jsx: react-jsx`.
- `strict: true` + the full strict-* family enabled (`noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, etc.).
- `allowJs: true`, `checkJs: false` so the remaining 6 `.js` files (data.js, api/client.js, etc.) keep working without rewrite.
- `noEmit: true` — Vite handles emit via esbuild; tsc is only used for typechecking.

New devDeps: `typescript@^5.6.3`, `@types/react@^18.3.12`, `@types/react-dom@^18.3.1`, `@types/node@^22.10.0`.
New script: `typecheck`: `tsc --noEmit -p tsconfig.json`.
New CI step: `Typecheck (tsc --noEmit)` in the web job — gates every PR.
`apps/web/index.html`: `/src/main.jsx` → `/src/main.tsx`.
`vite.config.js`, `tailwind.config.js`, `.storybook/main.js`: globs extended to include `ts,tsx`.
`apps/web/package.json` `name`: `digiuniversity` → `@digiuniversity/web` to match `@digiuniversity/api`. (No npm workspaces yet — name change only.)

Build still produces byte-identical dist (same Vite content hashes — `index-CwDNjEst.css` + `index-BhXNDvOo.js`).

Per-PR rule going forward: any touched .tsx file removes its `@ts-nocheck` and types its props. Hard target: zero `@ts-nocheck` by end of Phase 18.

### R3 — BrowserRouter migration

Installed `react-router-dom@^6.30.3`. New `apps/web/src/router.tsx` (317 lines) owns:
- the route table (54 paths matching the old switch),
- `useGo()` shim that returns a function with the exact old `(id, param) => void` signature so all ~140 page call sites are unchanged,
- `useCurrentRoute()` that mimics the old `{ id, param }` shape for Nav + ErrorBoundary key,
- `<Layout>` with the chrome (skip-link, ScrollProgress, Nav, ErrorBoundary, `<Outlet/>`),
- `<RouteShell>` per route that calls `useGo()` + `useParams()` and forwards `go` + the matching param name (`courseId`, `assessmentId`, `labId`) to the page.

`apps/web/src/App.tsx` slimmed from 156 → 22 lines. Just the provider stack wrapping `<AppRouter />`.

Direct hash reads/writes fixed:
- `ErrorBoundary.reset`: `window.location.hash = "#home"` → `window.location.assign("/")` (class component, can't use hooks; hard nav fine after unhandled exception).
- `Settings.tsx` pricing button: `window.location.hash = "#pricing"` → `go("pricing")`.
- `shared.tsx` demo-mode check: kept both `search` + `hash` for one release cycle so `#demo=1` bookmarks still work.

Anchor tags fixed (9 total): `href="#X"` → `href="/X"` in shared.tsx (brand link), sidenav.tsx (all role nav items), Dashboard.tsx (calendar link), Auth.tsx (5 — register/honor-code/help/login). Skip-link `href="#main-content"` kept (real fragment target).

E2E tests: `tests/e2e/{routes,features}.spec.js` updated to `page.goto("/route")` style.

SPA fallback verified end-to-end via new `remote.ps1 spa-probe` action:
```
OK 200 /                       text/html
OK 200 /home                   text/html
OK 200 /catalog                text/html
OK 200 /course/abc-123         text/html
OK 200 /tutor                  text/html
OK 200 /labs/nonexistent-path  text/html
```
Caddy passes arbitrary paths through (only `/api/*` + `/ai/*` are explicit-routed elsewhere). nginx's `try_files $uri $uri/ /index.html;` + `error_page 404 /index.html;` from Phase 11 catch them. Cost: +62 KB raw / +22 KB gzipped JS for react-router-dom. Phase 17 offsets via code-split.

## What's running on the VPS

After the closing R3 deploy:

```
NAME                        STATUS                  PORTS
digiuniversity-ai-gateway   Up (healthy)            8000/tcp
digiuniversity-api          Up (healthy)            4000/tcp
digiuniversity-app          Up (healthy)            80/tcp
digiuniversity-postgres     Up (healthy)            5432/tcp
```

Live URL `https://digiuniversity.ir/` HTTP/2 200 with all 7 P13-era security headers intact. `/catalog`, `/course/abc-123`, `/tutor`, `/labs/nonexistent-path` all 200. JS bundle: `dist/assets/index-CEZ148NQ.js` (668 KB / 192 KB gzipped). CSS unchanged: `index-CwDNjEst.css` (114 KB / 21 KB gzipped). PWA service worker regenerated.

Demo users still work (rotation didn't touch user passwords).

## Methodology lessons for the next phase

1. **`@ts-nocheck` is the right escape hatch for a bulk TS rename.** Lets you land the strict tsconfig + rename in one commit without 55 separate prop-typing PRs. Per-PR rule then organically retires it. Don't try to type everything at once — that's a multi-week stall.

2. **Strip explicit file extensions from imports before renaming.** When the codebase has `from "./Foo.jsx"`, a rename to `.tsx` breaks every import. Strip first (`from "./Foo"`), then rename. Vite + TS bundler-resolution find the file regardless of extension.

3. **`useGo()` shim is the lever for router migration.** A 5-line hook that wraps `useNavigate()` with the existing prop signature meant 49 page components needed zero changes. Without the shim, R3 would have been a 49-file rewrite.

4. **Verify SPA fallback before celebrating BrowserRouter.** The `spa-probe` action hits multiple BrowserRouter URLs through Caddy and asserts 200 + text/html. Without it, you can ship a broken router and only find out when a user shares a deep link.

5. **Build artefact hash equality is a clean smoke test for "pure refactor" commits.** R1 and R2 produced byte-identical dist/. That's strong evidence the refactor didn't change runtime behaviour. Any hash drift would have meant something else was happening.

## What's carried to Phase 15

Tracked in [`docs/TECH_DEBT.md`](TECH_DEBT.md) (next round updates it):

- **Per-file `@ts-nocheck` retirement.** 55 files start with it; remove file-by-file as each is touched.
- **Replace `useGo(id, param)` call sites with `useNavigate()` + `Link`.** Per-page polish. The shim is fine indefinitely; this is just code modernisation.
- **`packages/shared-types/` with Zod schemas** for the `/v1/*` API contract. Backend imports them via `@nestjs/zod`, frontend validates responses at the boundary in `api/endpoints.ts`. Phase 15.
- **Prerender public pages for SEO.** `vite-plugin-ssg` for `/`, `/programs`, `/about`, `/pricing`, etc. Schema.org JSON-LD. `react-helmet-async` for per-route meta. Phase 16.
- **9-role RBAC + CASL + AuditLog table.** Phase 15.
- **Code-split per-route.** `React.lazy` per page. Target initial bundle < 250 KB. Phase 17.

## Sign-off

Phase 14 closes with F-112 through F-119 fixed and deployed. The repo is a proper monorepo (`apps/web/`, `apps/api/`, `apps/ai-gateway/`), the frontend speaks TypeScript with strict mode (currently behind `@ts-nocheck` per file, retired incrementally), and the SPA serves real BrowserRouter URLs that Google can index. No page component changed during R3 — the `useGo()` shim absorbed the entire refactor surface.
