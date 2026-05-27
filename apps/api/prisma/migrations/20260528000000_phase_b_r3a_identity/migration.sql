-- Phase B R3.a (D68) — Identity track: Profile + Student + Instructor models
-- + R2 CourseOffering.instructorId additive wire (Q3.a).
--
-- Per MIGRATION_POLICY:
--   • §2 greenfield: Profile / Student / Instructor are brand-new tables.
--     Three new enums likewise (StudentStatus / InstructorStatus / InstructorRank).
--   • §4 additive: CourseOffering.instructorId is a nullable column on the
--     existing R2 table — no backfill risk, no contract change for current
--     CourseOffering consumers.
--   • State machines (StudentApplication / InstructorApplication and the
--     associated transition guards) are INTENTIONALLY ABSENT — they live
--     in R3.b per D68 split. R3.a stores Student.status and Instructor.status
--     as plain enum fields admins can set freely.
--   • Q2.a strict 1:1 Profile-to-User enforced by Profile.userId UNIQUE.
--   • Q3.a single instructorId per offering; team-teaching deferred per memo
--     risks section (additive junction model in R4+).
--   • Audit semantic per D69: AuditLog.actorId = request.user.id always.
--     No new audit columns needed; existing R4 audit lint covers mutations.

-- ---------- Enums ----------

CREATE TYPE "StudentStatus" AS ENUM ('ENROLLED', 'ON_LEAVE', 'GRADUATED', 'WITHDRAWN', 'DISMISSED');

CREATE TYPE "InstructorStatus" AS ENUM ('ACTIVE', 'ON_SABBATICAL', 'INACTIVE', 'TERMINATED');

CREATE TYPE "InstructorRank" AS ENUM ('ASSISTANT', 'ASSOCIATE', 'FULL', 'EMERITUS');

-- ---------- Profile (new, 1:1 with User per Q2.a) ----------

CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "phoneNumber" TEXT,
    "avatarUrl" TEXT,
    "address" TEXT,
    "nationalId" TEXT,
    "locale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");
CREATE INDEX "Profile_deletedAt_idx" ON "Profile"("deletedAt");

ALTER TABLE "Profile"
  ADD CONSTRAINT "Profile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------- Student (new) ----------

CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "studentCode" TEXT NOT NULL,
    "admissionDate" TIMESTAMP(3),
    "status" "StudentStatus" NOT NULL DEFAULT 'ENROLLED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");
CREATE UNIQUE INDEX "Student_tenantId_studentCode_key" ON "Student"("tenantId", "studentCode");
CREATE INDEX "Student_tenantId_status_idx" ON "Student"("tenantId", "status");
CREATE INDEX "Student_deletedAt_idx" ON "Student"("deletedAt");

ALTER TABLE "Student"
  ADD CONSTRAINT "Student_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Student"
  ADD CONSTRAINT "Student_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------- Instructor (new) ----------

CREATE TABLE "Instructor" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "instructorCode" TEXT NOT NULL,
    "departmentId" TEXT,
    "rank" "InstructorRank",
    "expertise" TEXT[],
    "hireDate" TIMESTAMP(3),
    "status" "InstructorStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "Instructor_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Instructor_userId_key" ON "Instructor"("userId");
CREATE UNIQUE INDEX "Instructor_tenantId_instructorCode_key" ON "Instructor"("tenantId", "instructorCode");
CREATE INDEX "Instructor_tenantId_status_idx" ON "Instructor"("tenantId", "status");
CREATE INDEX "Instructor_departmentId_idx" ON "Instructor"("departmentId");
CREATE INDEX "Instructor_deletedAt_idx" ON "Instructor"("deletedAt");

ALTER TABLE "Instructor"
  ADD CONSTRAINT "Instructor_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Instructor"
  ADD CONSTRAINT "Instructor_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Instructor"
  ADD CONSTRAINT "Instructor_departmentId_fkey"
  FOREIGN KEY ("departmentId") REFERENCES "Department"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------- Additive on existing CourseOffering (Q3.a) ----------

ALTER TABLE "CourseOffering" ADD COLUMN "instructorId" TEXT;
CREATE INDEX "CourseOffering_instructorId_idx" ON "CourseOffering"("instructorId");

ALTER TABLE "CourseOffering"
  ADD CONSTRAINT "CourseOffering_instructorId_fkey"
  FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
