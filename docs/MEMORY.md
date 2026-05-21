# Project memory — Phase-16 era

Short, durable facts that should outlive any single chat. Each bullet
must answer "why" the decision exists; if you can't, the bullet is
clutter and should be pruned.

## Conventions

- **Edit on Windows, run on VPS.** All Docker / build / test / deploy
  flows through `.\scripts\remote.ps1`. Never run `docker compose ...`
  on Windows. Never `ssh my-vps "..."` outside the script.

- **Persian-first UI.** Hard-coded English copy in JSX is a bug. Vazirmatn
  is the primary font; `dir="rtl"` is set at the root.

- **OKLCh tokens, no hardcoded colours.** `var(--accent)`, `var(--bg)`,
  `var(--surface-2)`, etc. New CSS that hardcodes `#0d0d0c` or
  `oklch(0.5 ...)` inline fails review.

## Phase plan deferrals

- **`@ts-nocheck` retirement = Phase 16.5, NOT during Phase 16.**

  Many `.tsx` files (Home.tsx ~530 LOC, Classroom.tsx, Dashboard.tsx,
  MyCourses.tsx, Catalog.tsx, and ~38 others) still carry the
  `// @ts-nocheck — Phase-14 R2 bulk JSX→TSX rename` escape hatch.
  Removing them all surfaces hundreds of "implicit any" + "Property
  does not exist on type" errors that need real annotations.

  Owner ruling at Gate 1 (2026-05-21): do **not** touch `@ts-nocheck`
  during Phase 16. The phase is about UI / responsive / design system,
  not type sweep. Phase 16.5 is the dedicated retirement sprint and
  will go file-by-file, one PR per file, with the new typed primitives
  from R3 as the typing target.

- **Breakpoints**: `xs=320, sm=480, md=768, lg=1024, xl=1280, 2xl=1536`
  (fixed in commit `cacc428` after Gate-1 evidence found 320×568
  overflow). `xs=320` covers iPhone SE 1st gen which is still common
  in Iran per owner.

- **Visual evidence**: every Phase-16 gate captures Playwright
  screenshots via `.\scripts\remote.ps1 visual -Service <gate>`. The
  docker `web-visual` profile in compose runs against the live
  `https://digiuniversity.ir` (the app container's nginx does not proxy
  `/api/*` — that's Caddy's job). PNGs land in `docs/<gate>-evidence/`
  and commit alongside the code.

- **UI primitives at `apps/web/src/ui/`.** Phase-16 R3 onward. Built on
  `@radix-ui/react-*`. No `framer-motion`. No `shadcn/ui` CLI. Forms use
  `react-hook-form + @hookform/resolvers + zod`. Toast uses Radix
  (not Sonner) to keep bundle small.

- **Bundle budget for primitives**: ≤ 30 KB gzipped for the full
  `apps/web/src/ui/` barrel. Verified at the end of R3.

## Why these decisions, not the alternatives

- **Radix over shadcn CLI**: shadcn assumes Tailwind-only styling +
  clean-slate `globals.css`. Our 4,482-line `styles.css` uses OKLCh
  CSS variables that shadcn's generator doesn't speak. Radix
  primitives + thin custom wrappers compose cleanly with our tokens.

- **Production URL for visual tests**: the in-network `http://app/`
  doesn't have `/api/*` proxied (Caddy does that on the host).
  Hitting the live URL doubles as a post-deploy smoke and exercises
  the full CDN → Caddy → app + api path.

- **`isAuthenticated` redirect uses `<AuthLoadingSkeleton/>`, not
  `return null`**: one-frame blank-page flash between mount and
  useEffect was visible to users. Skeleton is layout-stable so the
  swap is silent.
