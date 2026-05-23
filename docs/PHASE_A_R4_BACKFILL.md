# Phase A R4 — Backfill log

> Three mutation handlers were updated as a one-time backfill when the lint rule was introduced. This file documents each one so a future contributor doesn't strip the `@AuditSkip()` without understanding why.

## Why these three were unaudited

The `AuditInterceptor` in `apps/api/src/audit/audit.interceptor.ts` writes a row for every authenticated `POST` / `PATCH` / `PUT` / `DELETE` that returns 2xx — but it short-circuits when `req.user` is undefined (line 81-89 of the interceptor). Public, pre-authentication endpoints therefore can't be audited by the global interceptor. The three `@Public()` handlers in `auth.controller.ts` fall into this category. Their audit rows are written by `AuthService` from inside the service path, after the credential resolves to a concrete `tenantId`.

Before R4 these were implicitly "not audited at the controller layer." After R4 the intent is **explicit** via `@AuditSkip()` + a comment, so the lint rule passes and future readers don't have to reverse-engineer the interceptor's user-presence check to understand why.

## The three updates

All three live in `apps/api/src/auth/auth.controller.ts`. Diff is import + 3 decorators + 3 comments. No runtime behavior changed.

| Method | Decorators added | Why skip is correct |
|---|---|---|
| `register` | `@AuditSkip()` + comment | `AuthService.register` writes its own `auth.register` audit row once the tenant slug resolves to a tenantId. Decorator-level audit would have no tenantId to scope under. |
| `login` | `@AuditSkip()` + comment | `AuthService.login` writes `auth.login.success` / `.failure` rows after credential check, with the resolved tenantId. Pre-credential we have no identity to audit against. |
| `refresh` | `@AuditSkip()` + comment | Token rotation is recorded in the `RefreshToken` table (separate from `AuditLog`). Auditing at the decorator layer would double-log every silent refresh. |

## What was NOT touched

The rule itself doesn't backfill anything else — every other mutation handler in the repo already had `@AuditAction(...)`. The survey numbers from the R4 memo confirmed this: 44 of 49 handlers already canonical, 2 already `@AuditSkip`, 3 gap-filled here. After R4 the count is 44 + 5 = 49 (every mutation handler has an explicit audit decision).

## Rollback

If `@AuditSkip()` ever needs to be removed from one of these three handlers (e.g. Phase B introduces controller-layer audit that handles the no-tenant case via a sentinel tenant), the lint rule will then require the handler to have `@AuditAction("auth.register")` etc. — which is also correct. No re-thinking of the rule, just a swap of decorators.

## Anti-pattern to avoid

A future contributor might be tempted to make `@Public()` an implicit satisfier of the rule — "public routes can't audit so let the lint skip them." That would silently absolve every future public mutation from audit discipline (e.g. a webhook handler that public-faces but should still write a `webhook.received` row). The current shape — explicit `@AuditSkip()` with a comment — keeps the burden where it belongs: on the handler author to think about audit and record their decision.
