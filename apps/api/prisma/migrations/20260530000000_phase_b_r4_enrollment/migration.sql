-- Phase B R4 (D73 + D74) — Enrollment lifecycle: close the D72 spine gap.
--
-- Per MIGRATION_POLICY:
--   • §4 additive (SAFE widening): Enrollment.courseId NOT NULL → NULL.
--     Widening a NOT-NULL constraint to nullable NEVER invalidates
--     existing rows — every current Enrollment keeps its courseId set
--     and stays valid. This is the Q0.a two-shape model:
--       - course-level (legacy): courseId SET
--       - program-term admission (R4 new): courseId NULL + offeringId SET
--   • §4 additive: StudentApplication.targetOfferingId (Q1.a) +
--     resultingEnrollmentId (Q5.a) — nullable columns, no backfill.
--   • D74 Q2 = service-layer: Enrollment.status STAYS a String column.
--     NO Postgres enum, NO data migration on status. The existing
--     Phase-7 lowercase values (active/completed/dropped/withdrawn) +
--     the existing RBAC status controller are untouched. The R4 admin
--     transition endpoint enforces ALLOWED_TRANSITIONS at the service
--     layer.
--   • Dual-write forward-only (D73): R4 enrollments populate offeringId
--     only; no cohort back-write. This migration touches no Cohort data.
--
-- ⚠️ The partial unique index (program-term admission) is authored as
-- raw SQL here because Prisma's schema DSL cannot express partial
-- (WHERE-clause) unique indexes. It is NOT in schema.prisma; it lives
-- only in this migration. Future `prisma migrate` runs leave it intact
-- (Prisma only drops what it manages).

-- ---------- Enrollment.courseId: relax NOT NULL → nullable ----------
--
-- Pure constraint relax. Existing rows unaffected (they all have
-- courseId). The existing FK (Enrollment_courseId_fkey ON DELETE
-- CASCADE) remains valid against a nullable column — no drop/recreate
-- needed (a nullable FK column simply permits NULL = "no reference").

ALTER TABLE "Enrollment" ALTER COLUMN "courseId" DROP NOT NULL;

-- ---------- Partial unique: one program-term admission per (tenant, user, offering) ----------
--
-- The existing @@unique([tenantId, userId, courseId]) still enforces
-- one-per-course for course-level rows. With courseId now nullable,
-- Postgres treats NULL as DISTINCT in that index, so program-term rows
-- (courseId IS NULL) are NOT constrained by it. This partial unique
-- fills that gap: at most one *active* program-term admission per
-- (tenantId, userId, offeringId). The `deletedAt IS NULL` clause lets a
-- soft-deleted admission be re-created (re-enroll after withdraw — Q3.a).

CREATE UNIQUE INDEX "Enrollment_program_term_admission_key"
  ON "Enrollment"("tenantId", "userId", "offeringId")
  WHERE "courseId" IS NULL AND "deletedAt" IS NULL;

-- ---------- StudentApplication: targetOfferingId (Q1.a) + resultingEnrollmentId (Q5.a) ----------

ALTER TABLE "StudentApplication" ADD COLUMN "targetOfferingId" TEXT;
ALTER TABLE "StudentApplication" ADD COLUMN "resultingEnrollmentId" TEXT;

-- resultingEnrollmentId is 1:0..1 with Enrollment.id (Postgres allows
-- many NULLs in a unique index, so un-enrolled apps are fine).
CREATE UNIQUE INDEX "StudentApplication_resultingEnrollmentId_key"
  ON "StudentApplication"("resultingEnrollmentId");
CREATE INDEX "StudentApplication_targetOfferingId_idx"
  ON "StudentApplication"("targetOfferingId");

ALTER TABLE "StudentApplication"
  ADD CONSTRAINT "StudentApplication_targetOfferingId_fkey"
  FOREIGN KEY ("targetOfferingId") REFERENCES "CourseOffering"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StudentApplication"
  ADD CONSTRAINT "StudentApplication_resultingEnrollmentId_fkey"
  FOREIGN KEY ("resultingEnrollmentId") REFERENCES "Enrollment"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
