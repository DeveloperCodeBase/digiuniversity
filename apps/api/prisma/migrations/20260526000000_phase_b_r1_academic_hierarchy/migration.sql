-- Phase B R1 (D62 + D63) — Academic Hierarchy additive migration.
--
-- Adds the new "School" table (greenfield per MIGRATION_POLICY §2) one
-- level above Faculty, and adds nullable language/code columns to the
-- existing Faculty/Department/Program tables (additive per §4 — Q4.a
-- "spirit" interpretation: dual-language available without renaming
-- the existing `name` column).
--
-- Hierarchy now: School → Faculty → Department → Program → (Course | Cohort).
--
-- Safety properties:
--   • School is brand-new — no backfill risk.
--   • Faculty.schoolId is nullable — existing rows remain valid with NULL
--     until admin assigns each Faculty to a School via the admin UI.
--   • nameEn / shortCode on Faculty/Department/Program are nullable — no
--     constraint failure on existing rows.
--   • No `name` column is renamed (Q4.a spirit per D63). The existing
--     `name` stays as the Persian source-of-truth; `nameEn` is the new
--     optional English mirror.
--   • Tenant.id FK cascade preserved for School (matches Faculty pattern).
--   • School.id ← Faculty.schoolId FK uses default RESTRICT (Prisma
--     omits ON DELETE for nullable optional relations). Admin must
--     reassign or null-out Faculty rows before deleting their parent
--     School.

-- ---------- School (new) ----------
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameFa" TEXT NOT NULL,
    "nameEn" TEXT,
    "shortCode" TEXT,
    "description" TEXT,
    "iconName" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "charterDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "School_tenantId_slug_key"      ON "School"("tenantId", "slug");
CREATE UNIQUE INDEX "School_tenantId_shortCode_key" ON "School"("tenantId", "shortCode");
CREATE INDEX        "School_tenantId_idx"           ON "School"("tenantId");
CREATE INDEX        "School_deletedAt_idx"          ON "School"("deletedAt");

ALTER TABLE "School" ADD CONSTRAINT "School_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------- Faculty (additive: schoolId + nameEn + shortCode) ----------
ALTER TABLE "Faculty" ADD COLUMN "nameEn"    TEXT;
ALTER TABLE "Faculty" ADD COLUMN "shortCode" TEXT;
ALTER TABLE "Faculty" ADD COLUMN "schoolId"  TEXT;

CREATE INDEX "Faculty_schoolId_idx" ON "Faculty"("schoolId");

ALTER TABLE "Faculty" ADD CONSTRAINT "Faculty_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------- Department (additive: nameEn + shortCode) ----------
ALTER TABLE "Department" ADD COLUMN "nameEn"    TEXT;
ALTER TABLE "Department" ADD COLUMN "shortCode" TEXT;

-- ---------- Program (additive: nameEn + shortCode) ----------
ALTER TABLE "Program" ADD COLUMN "nameEn"    TEXT;
ALTER TABLE "Program" ADD COLUMN "shortCode" TEXT;
