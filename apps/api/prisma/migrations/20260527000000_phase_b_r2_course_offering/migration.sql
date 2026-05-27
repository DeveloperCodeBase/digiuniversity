-- Phase B R2 (D65) — CourseOffering + MigrationSyncLog + dual-source FKs.
--
-- Per MIGRATION_POLICY:
--   • §2 greenfield: CourseOffering + MigrationSyncLog are brand-new tables.
--   • §4 additive: Enrollment.offeringId + Cohort.upgradedToOfferingId are
--     nullable columns on existing tables — no backfill risk.
--   • §5 dual-write window: Cohort + CourseOffering both live. The legacy
--     /v1/cohorts emits Sunset / Deprecation / Link response headers
--     announcing the migration. Drop date no earlier than 2026-12-31
--     (4-sprint Sunset window per §6).
--   • §10 rollback caveat: Cohort.upgradedToOfferingId has NO Prisma FK
--     constraint to CourseOffering.id — the dual-write interceptor
--     maintains referential integrity in app code, so a `git revert` of
--     R2 leaves the production DB in a recoverable state without
--     orphaning data.
--
-- instructorId is INTENTIONALLY ABSENT (deferred to R3 Identity track
-- per D65 Q2 modification).

-- ---------- Enums ----------

CREATE TYPE "OfferingStatus" AS ENUM ('SCHEDULED', 'OPEN', 'ACTIVE', 'COMPLETED', 'CANCELED');

CREATE TYPE "OfferingMode" AS ENUM ('SYNCHRONOUS', 'ASYNCHRONOUS', 'HYBRID');

-- ---------- CourseOffering (new) ----------

CREATE TABLE "CourseOffering" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameFa" TEXT NOT NULL,
    "nameEn" TEXT,
    "shortCode" TEXT,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "capacity" INTEGER,
    "mode" "OfferingMode" NOT NULL DEFAULT 'SYNCHRONOUS',
    "status" "OfferingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "legacyCohortId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "CourseOffering_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CourseOffering_tenantId_slug_key" ON "CourseOffering"("tenantId", "slug");
CREATE INDEX "CourseOffering_tenantId_status_idx" ON "CourseOffering"("tenantId", "status");
CREATE INDEX "CourseOffering_programId_idx" ON "CourseOffering"("programId");
CREATE INDEX "CourseOffering_legacyCohortId_idx" ON "CourseOffering"("legacyCohortId");
CREATE INDEX "CourseOffering_deletedAt_idx" ON "CourseOffering"("deletedAt");

ALTER TABLE "CourseOffering"
  ADD CONSTRAINT "CourseOffering_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CourseOffering"
  ADD CONSTRAINT "CourseOffering_programId_fkey"
  FOREIGN KEY ("programId") REFERENCES "Program"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------- MigrationSyncLog (new) ----------

CREATE TABLE "MigrationSyncLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "rowId" TEXT NOT NULL,
    "targetId" TEXT,
    "action" TEXT NOT NULL,
    "notes" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncedBy" TEXT,

    CONSTRAINT "MigrationSyncLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MigrationSyncLog_tenantId_syncedAt_idx" ON "MigrationSyncLog"("tenantId", "syncedAt");
CREATE INDEX "MigrationSyncLog_source_syncedAt_idx" ON "MigrationSyncLog"("source", "syncedAt");
CREATE INDEX "MigrationSyncLog_rowId_idx" ON "MigrationSyncLog"("rowId");

ALTER TABLE "MigrationSyncLog"
  ADD CONSTRAINT "MigrationSyncLog_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------- Additive columns on existing tables ----------

-- Cohort: backlink to its upgraded CourseOffering (no FK constraint — app-level)
ALTER TABLE "Cohort" ADD COLUMN "upgradedToOfferingId" TEXT;
CREATE INDEX "Cohort_upgradedToOfferingId_idx" ON "Cohort"("upgradedToOfferingId");

-- Enrollment: dual-source FK alongside the existing cohortId
ALTER TABLE "Enrollment" ADD COLUMN "offeringId" TEXT;
CREATE INDEX "Enrollment_offeringId_idx" ON "Enrollment"("offeringId");

ALTER TABLE "Enrollment"
  ADD CONSTRAINT "Enrollment_offeringId_fkey"
  FOREIGN KEY ("offeringId") REFERENCES "CourseOffering"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
