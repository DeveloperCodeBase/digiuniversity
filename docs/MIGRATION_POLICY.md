# Migration Policy

**Authority:** Phase B R0.5 (per D60 Q1.a + D62 close)
**Audience:** every Phase B+ sub-R that touches `apps/api/prisma/schema.prisma` or any migration under `apps/api/prisma/migrations/`.
**Source of truth:** this file. Conflicts with Compass Roadmap §Cross-cutting → flag in PR description; this doc updates by explicit owner ack.

---

## 0. Quick Decision Tree (start here)

Before writing any Prisma change, answer these questions in order. First «yes» → jump to the section listed.

1. **Adding a brand-new model with no existing data to migrate?** → **§2 Greenfield**.
2. **Adding a nullable column to an existing model (no backfill required)?** → **§4 Additive field**.
3. **Renaming a column but the data type and meaning stay the same?** → **§5 Field rename**.
4. **Removing a column the application still reads?** → **§6 Deprecation**.
5. **Reshaping an existing model (split one into two, change FK semantics, change cascade behavior on existing rows)?** → **§3 Existing model modification** + likely **§1 Dual-write**.
6. **None of the above and you're not sure?** → stop. Ping owner with the proposed change. Do not invent a path.

After picking a section, also check **§7 Cascade** (FK shape), **§8 Soft-delete** (if the model is user-facing data), and **§9 Testing**. Always finish with the **§11 Commit checklist**.

---

## 1. Dual-write strategy

**When required:** any change where the legacy endpoint and the new model both serve data the frontend (or external consumers) might read. Examples: `Cohort → CourseOffering` rename in R2, splitting `User.fullName` into `firstName + lastName` later.

**When NOT required:** greenfield models (§2). New nullable columns (§4). Renames where no client reads the old name (rare — usually clients exist).

**Pattern:**

```ts
// apps/api/src/modules/course-offering/legacy-sync.service.ts
@Injectable()
export class LegacySyncService {
  // On every CourseOffering write, mirror the relevant fields to the
  // legacy Cohort row (or create one). Record the sync for rollback.
  async syncToLegacy(newRow: CourseOffering) {
    await this.prisma.cohort.upsert({ /* mirror shape */ });
    await this.prisma.migrationSyncLog.create({
      data: { source: "CourseOffering", target: "Cohort", rowId: newRow.id, syncedAt: new Date() },
    });
  }
}
```

The legacy endpoint stays alive with `Sunset: Wed, 31 Dec 2026 23:59:59 GMT` + `Deprecation: true` HTTP headers for **≥ 4 sprints** (~8 weeks) before drop. See §6 for the deprecation window.

## 2. New model addition (greenfield)

R1's 4-level hierarchy (`School / Faculty / Department / Program`) is the canonical example. No existing data → no dual-write needed.

**Pattern:**
1. Add the model(s) to `schema.prisma` with all audit fields + cascade FKs + indexes.
2. Generate migration: `npx prisma migrate dev --name b1a_<name>`.
3. Seed in `apps/api/src/prisma/seed.ts`.
4. Ship endpoints + UI in the same sub-R or the next per scope.
5. No backfill, no dual-write, no Sunset headers.

## 3. Existing model modification

Touching an existing model (Cohort, Faculty, User, etc.) means there is real data in production. Two flavors:

- **Reshape (split/merge/restructure):** requires §1 dual-write + §5 rename pattern combined. Multi-sprint rollout.
- **Behavior change** (e.g., switch a FK from `onDelete: CASCADE` to `SET NULL`): considered breaking. Same dual-write window. Document the live-row impact before pushing.

R1's `Faculty.schoolId` addition is **§4 Additive field**, NOT §3, because the column is nullable and pre-existing rows keep working with `schoolId = NULL`.

## 4. Additive field (nullable column)

Cheapest migration shape. Safe by default if:
- The column is nullable OR has a default value.
- The application code tolerates the old shape until clients deploy.
- No FK constraint that would reject existing rows (e.g., `NOT NULL` FK with no backfill).

```prisma
model Faculty {
  // existing fields preserved
  schoolId  String?    // NEW, nullable for backward compat
  school    School?    @relation(fields: [schoolId], references: [id])
}
```

Migration applies in seconds; no downtime; no dual-write.

## 5. Field rename (or column-type widening)

Three-stage rollout. Each stage = one sub-R sprint.

| Stage | Source-of-truth read | Write |
|---|---|---|
| Stage 1 | old column | **both** (old + new) — dual-write |
| Stage 2 | **new** column | both (read-from-new, keep mirroring) |
| Stage 3 | new column | new column only — drop the old |

Between stages, the `MigrationSyncLog` proves zero traffic on the old column path before dropping. Stage 3 ship requires 7 consecutive days of zero log rows for the old reader.

## 6. Field removal (deprecation)

Even for a nullable, unused-looking column: assume something external reads it. Path:

1. Sub-R N+0: announce in changelog + add `Sunset: <date>` header on any endpoint exposing the field. Code keeps writing it.
2. Sub-R N+1: stop writing it. Reads still tolerated (returns last value or null).
3. Sub-R N+2: dev environment banner («این فیلد قطع خواهد شد») on any UI surface.
4. Sub-R N+3: verify 7-day zero traffic in `MigrationSyncLog` or access log.
5. Sub-R N+4: drop. Migration is `ALTER TABLE ... DROP COLUMN` only at this stage.

Total: ≥ 4 sprints (~8 weeks). Owner can shorten with explicit ack if the field is provably unused.

## 7. Cascade strategy

Pick at FK-creation time. Changing later is §3 territory.

| Semantic | Use when | Prisma |
|---|---|---|
| **CASCADE** | child row has no meaning without parent (Department → its Programs) | `onDelete: Cascade` |
| **SET NULL** | child can exist orphaned, but should lose its parent reference | `onDelete: SetNull` + column must be nullable |
| **RESTRICT** | parent deletion should fail if any child exists (default — safest) | `onDelete: Restrict` |
| **Soft-delete** | user-facing data; want audit trail of deletion + recovery option | application-level (see §8) |

**R1 default:** soft-delete at all 4 levels, plus `onDelete: Cascade` on the FK for the rare hard-delete super_admin escape hatch.

## 8. Soft-delete pattern

Every user-facing model gets:

```prisma
model School {
  // ...
  deletedAt   DateTime?
  deletedBy   String?   // user id who deleted

  @@index([tenantId, deletedAt])   // partial index: WHERE deletedAt IS NULL
}
```

**Hygiene:**
- All `findMany` queries default-filter `WHERE deletedAt IS NULL`. Centralize the where-clause via a Prisma middleware or a base repository.
- Soft-delete mutations carry `@AuditAction("soft_delete")` per Phase A R4 lint.
- `?includeDeleted=true` query param on list endpoints surfaces hidden rows (super_admin only).
- Restore = clearing `deletedAt`; also an `@AuditAction`.

## 9. Migration testing

Every migration commit must pass:

1. **Dry-run on staging Prisma:** `prisma migrate dev --create-only` then inspect the generated SQL by eye.
2. **Apply to a dev DB:** `prisma migrate dev` → confirms forward apply works.
3. **Seed runs cleanly:** `npm run prisma:seed` against the new schema → no constraint errors.
4. **e2e suite green:** `npm test` + `playwright test --grep <sub-R>`.
5. **Cascade verification (if FK):** explicit e2e test that deletes a parent and asserts the soft-delete (or cascade) propagated as documented.

The api Dockerfile entrypoint runs `prisma migrate deploy` on container start (`apps/api/docker-entrypoint.sh` line 10) — production rollout is automated once the commit ships. There is no manual migration step in production.

## 10. Rollback strategy

Forward migrations are committed; rollback uses git revert + `prisma migrate resolve`. **Caveat per D44:** a `git revert` of a migration commit removes the migration file from source, but the production DB **already has the migration applied**. The tables remain dormant until either:

(a) The reverted migration is reinstated (a re-commit) — `prisma migrate deploy` is then a no-op for that migration name; **OR**
(b) An explicit `DROP TABLE` migration ships to remove the dormant table.

**Choose at revert time.** D44 chose path (a) implicitly — `University` + `Semester` tables sit dormant in production today, waiting for a future R that reinstates them. Document the choice in the revert commit body.

## 11. Reference links + commit checklist

- Prisma migrate workflow: https://www.prisma.io/docs/orm/prisma-migrate/workflows/production-and-testing
- Phase A R4 audit-on-mutation lint: enforced via `tools/eslint-rules/audit-on-mutation.js` — every mutation handler on a Prisma-touching controller MUST carry `@AuditAction()` or fail CI.
- Compass Roadmap §Cross-cutting policies (additive + dual-write + Sunset + MigrationSyncLog).

**5-point commit checklist** — every migration PR description includes:

- [ ] Migration is additive (or §3 dual-write window started)
- [ ] If dual-write: interceptor present + Sunset/Deprecation headers on legacy endpoint
- [ ] MigrationSyncLog row written on every dual-write path
- [ ] Old + new endpoint tests both green
- [ ] Backward compat verified: `git checkout HEAD~1 && .\scripts\remote.ps1 up` still boots

— Migration Policy v1.0, 2026-05-26. Updates by explicit owner ack.
