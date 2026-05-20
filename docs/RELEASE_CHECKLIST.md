# Release checklist

Pre-flight before flipping a tenant from "demo" to "production".

## 1. Secrets

- [ ] `JWT_SECRET` is set to a unique 32+ char value (rotate from
      the `.env.example` placeholder).
- [ ] `POSTGRES_PASSWORD` is set to a unique value, not the
      `digiuniversity_dev` default.
- [ ] `SEED_ADMIN_PASSWORD` was changed on first login (the seed
      logs a warning when it's still the default).
- [ ] `RUN_SEED=false` in any environment that already has real data.
- [ ] `AI_SERVICES_API_KEY` is set if `AI_MODE=external_api` is
      enabled.

## 2. Database

- [ ] `prisma migrate deploy` ran cleanly on container start (see
      `docker compose logs api | head -50`).
- [ ] At least one off-VPS backup of the `postgres-data` volume
      exists. Today's manual procedure:
      `docker exec digiuniversity-postgres pg_dump -U digiuniversity digiuniversity > backup-YYYYMMDD.sql`.
- [ ] Periodic backup is scheduled (Phase 10.5 wires this into a cron
      under `infra/`).

## 3. Auth + RBAC

- [ ] The seed admin password has been rotated.
- [ ] The seed admin user has been replaced or its `email` updated to
      a real person.
- [ ] At least one non-seed admin exists per tenant before deleting
      the seed admin (so you don't lock yourself out).
- [ ] `JWT_ACCESS_TTL` and `JWT_REFRESH_TTL` match your session
      policy (defaults: `15m` / `30d`).

## 4. Domain + TLS

- [ ] `https://digiuniversity.ir` resolves and returns the SPA
      (`curl -sSI https://digiuniversity.ir/` → `200`).
- [ ] `https://digiuniversity.ir/api/v1/health` returns
      `{"status":"ok",...,"checks":{"database":"ok"}}`.
- [ ] `https://digiuniversity.ir/ai/v1/health` returns the gateway
      version + mode.
- [ ] `https://digiuniversity.ir/api/docs` loads (Swagger).
- [ ] Caddy certificate auto-renews. Check
      `docker logs hooshgate_caddy 2>&1 | grep -i 'obtained'` from
      the last 60 days.

## 5. Tests

- [ ] `.\scripts\remote.ps1 test` exits 0. The suite covers auth,
      RBAC, enrollment, tutor.

## 6. Logs + observability

- [ ] All four containers report `Up (healthy)` in
      `.\scripts\remote.ps1 status`.
- [ ] `docker compose logs api | tail -200` shows no
      stack traces during the last deploy.
- [ ] Disk usage on the VPS is under 70% (`df -h /` from the host).
- [ ] `AiInteractionLog` row count grows when the tutor or analyze
      buttons are exercised — i.e. the audit log is actually
      receiving writes (`SELECT count(*) FROM "AiInteractionLog"`).

## 7. AI governance

- [ ] `AI_MODE=mock` in any environment where you don't want
      external network calls from the gateway (read
      `docs/AI_GOVERNANCE.md` first).
- [ ] If `AI_MODE=external_api`, the tenant's data-processing
      agreement covers the chosen provider.
- [ ] Risk-score floor: spot-check `/v1/analytics/risk/me` returns
      `humanReviewRequired: true` for a low-confidence student.

## 8. Frontend

- [ ] `digiuniversity.ir/#login` accepts the seed admin and lands on
      `#progress`.
- [ ] `#catalog` shows the seed course (`CS101`).
- [ ] `#course-live/<id>` renders modules, lessons, the live session,
      and the assessment.
- [ ] `#tutor` accepts a question and renders an assistant turn with
      citations + the `humanReviewRequired` banner.

## 9. Rollback

- [ ] You know which commit was deployed (`git log -1` on the VPS).
- [ ] You know how to roll back: `git reset --hard <previous-sha>`
      then `.\scripts\remote.ps1 restart`.
- [ ] DB rollback path: restore the most recent `pg_dump` into the
      same `postgres` service and `prisma migrate resolve --rolled-back
      <migration>` if the schema needs to step back.

## 10. Done?

Every box ticked → safe to onboard a real tenant.
