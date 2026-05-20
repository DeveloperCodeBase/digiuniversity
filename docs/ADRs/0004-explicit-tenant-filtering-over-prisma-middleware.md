# ADR 0004: Explicit tenant filtering, not Prisma middleware

Date: 2026-05-20

## Status

Accepted.

## Context

`AGENTS.md` and `docs/product/PRODUCT_BRIEF.md` mandate multi-tenant
isolation in every query. Two implementations are common:

1. **Prisma middleware (`$extends` / `$use`)** that injects
   `where: { tenantId }` automatically on every read/write.
2. **Explicit filtering** in every service method, with the tenantId
   coming from the authenticated principal.

Middleware feels safer at first — "you can't forget the filter, the
middleware adds it." But:

- It only knows about top-level operations; nested `include` / `connect`
  queries can still cross tenants if the model graph allows it.
- Raw SQL, `$queryRaw`, and aggregations bypass it silently.
- Forgetting to wire the middleware into one client (tests, scripts,
  the seed) leaks data without anyone noticing.
- Read review becomes harder: the security property "this query is
  tenant-scoped" is no longer visible at the call site.

## Decision

Phase 2 enforces tenant isolation **explicitly**, at the service /
controller layer, using the `tenantId` carried in the JWT and resolved
into `AuthenticatedUser.tenantId`.

- Every `prisma.<model>.findMany / findUnique / update / delete` call
  passes `where: { tenantId: user.tenantId, ... }` explicitly.
- The Prisma schema enforces a foreign key + index per `tenantId`
  column, so the DB itself is structurally aware.
- DTO inputs never accept a free-text `tenantId` — it always comes from
  the authenticated principal.
- A future linting rule (Phase 6) will flag prisma calls in service
  files that don't reference `user.tenantId`.

## Consequences

- The security property is visible at every call site (auditable via
  `grep`).
- We pay a small repetition cost — the price of making leaks obvious.
- Re-using the same Prisma client for tenant + cross-tenant operations
  (e.g. seed, admin migration scripts) is straightforward.
- If we ever want middleware *in addition*, we can layer it on as
  belt-and-suspenders without redesigning anything.
