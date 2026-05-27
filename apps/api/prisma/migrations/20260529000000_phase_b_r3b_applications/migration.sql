-- Phase B R3.b (D71) — StudentApplication + InstructorApplication +
-- NotificationLog + AppStatus enum + reverse-relation FK columns are
-- already-present (no FK ADDs to existing tables; the relations live
-- entirely on the new tables).
--
-- Per MIGRATION_POLICY:
--   • §2 greenfield: 3 brand-new tables + 1 new enum.
--   • §4 additive reverse relations: every reverse-relation declaration
--     on User / Tenant / Profile / Program / Department / Student /
--     Instructor is Prisma-side-only (a "back ref" that requires no
--     SQL column change). The FK columns live on the application
--     tables themselves — `userId`, `programId`, `departmentId`,
--     `resultingStudentId`, `resultingInstructorId`,
--     `studentApplicationId`, `instructorApplicationId`.
--   • Q4.a (D68) nullable userId: applicant may submit without an
--     account; ACCEPTED → ENROLLED side effect (Q5.a find-or-create-or-
--     link) populates it transactionally in the service layer.
--   • Q2.a verification gate: `applicantEmailVerifiedAt` +
--     `applicantPhoneVerifiedAt` columns are nullable; service-layer
--     guard enforces both-non-null before any UNDER_REVIEW exit.
--   • Q8.a idempotency: unique indices on the application tables
--     enforce "same applicant+target = same row" at the DB level.
--   • Q5.a sequence (find-or-create-or-link) lives in the service
--     transaction, not SQL.

-- ---------- Enum ----------

CREATE TYPE "AppStatus" AS ENUM (
  'SUBMITTED',
  'UNDER_REVIEW',
  'INTERVIEW',
  'ACCEPTED',
  'ENROLLED',
  'REJECTED',
  'WITHDRAWN'
);

-- ---------- StudentApplication ----------

CREATE TABLE "StudentApplication" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT,
  "programId" TEXT NOT NULL,
  "applicantFullName" TEXT NOT NULL,
  "applicantEmail" TEXT NOT NULL,
  "applicantPhone" TEXT,
  "applicantNationalId" TEXT,
  "applicantBio" TEXT,
  "applicantEmailVerifiedAt" TIMESTAMP(3),
  "applicantPhoneVerifiedAt" TIMESTAMP(3),
  "status" "AppStatus" NOT NULL DEFAULT 'SUBMITTED',
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decidedAt" TIMESTAMP(3),
  "decidedBy" TEXT,
  "resultingStudentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "createdBy" TEXT,
  "updatedBy" TEXT,

  CONSTRAINT "StudentApplication_pkey" PRIMARY KEY ("id")
);

-- Q8.a idempotency — same applicant + program returns existing row.
CREATE UNIQUE INDEX "StudentApplication_tenantId_applicantEmail_programId_key"
  ON "StudentApplication"("tenantId", "applicantEmail", "programId");

-- resultingStudentId is 1:0..1 with Student.id.
CREATE UNIQUE INDEX "StudentApplication_resultingStudentId_key"
  ON "StudentApplication"("resultingStudentId");

CREATE INDEX "StudentApplication_tenantId_status_idx"
  ON "StudentApplication"("tenantId", "status");
CREATE INDEX "StudentApplication_userId_idx"
  ON "StudentApplication"("userId");
CREATE INDEX "StudentApplication_deletedAt_idx"
  ON "StudentApplication"("deletedAt");

ALTER TABLE "StudentApplication"
  ADD CONSTRAINT "StudentApplication_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentApplication"
  ADD CONSTRAINT "StudentApplication_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StudentApplication"
  ADD CONSTRAINT "StudentApplication_programId_fkey"
  FOREIGN KEY ("programId") REFERENCES "Program"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentApplication"
  ADD CONSTRAINT "StudentApplication_resultingStudentId_fkey"
  FOREIGN KEY ("resultingStudentId") REFERENCES "Student"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------- InstructorApplication ----------

CREATE TABLE "InstructorApplication" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT,
  "departmentId" TEXT,
  "preferredDepartmentSlug" TEXT,
  "applicantFullName" TEXT NOT NULL,
  "applicantEmail" TEXT NOT NULL,
  "applicantPhone" TEXT,
  "applicantNationalId" TEXT,
  "applicantBio" TEXT,
  "desiredRank" "InstructorRank",
  "expertise" TEXT[],
  "cvUrl" TEXT,
  "applicantEmailVerifiedAt" TIMESTAMP(3),
  "applicantPhoneVerifiedAt" TIMESTAMP(3),
  "status" "AppStatus" NOT NULL DEFAULT 'SUBMITTED',
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decidedAt" TIMESTAMP(3),
  "decidedBy" TEXT,
  "resultingInstructorId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "createdBy" TEXT,
  "updatedBy" TEXT,

  CONSTRAINT "InstructorApplication_pkey" PRIMARY KEY ("id")
);

-- Q8.a idempotency — one instructor app per applicant per tenant.
-- (Re-application after soft-delete needs admin to undelete; rare path.)
CREATE UNIQUE INDEX "InstructorApplication_tenantId_applicantEmail_key"
  ON "InstructorApplication"("tenantId", "applicantEmail");

CREATE UNIQUE INDEX "InstructorApplication_resultingInstructorId_key"
  ON "InstructorApplication"("resultingInstructorId");

CREATE INDEX "InstructorApplication_tenantId_status_idx"
  ON "InstructorApplication"("tenantId", "status");
CREATE INDEX "InstructorApplication_userId_idx"
  ON "InstructorApplication"("userId");
CREATE INDEX "InstructorApplication_deletedAt_idx"
  ON "InstructorApplication"("deletedAt");

ALTER TABLE "InstructorApplication"
  ADD CONSTRAINT "InstructorApplication_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InstructorApplication"
  ADD CONSTRAINT "InstructorApplication_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InstructorApplication"
  ADD CONSTRAINT "InstructorApplication_departmentId_fkey"
  FOREIGN KEY ("departmentId") REFERENCES "Department"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InstructorApplication"
  ADD CONSTRAINT "InstructorApplication_resultingInstructorId_fkey"
  FOREIGN KEY ("resultingInstructorId") REFERENCES "Instructor"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------- NotificationLog ----------

CREATE TABLE "NotificationLog" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "template" TEXT NOT NULL,
  "targetEmail" TEXT,
  "targetPhone" TEXT,
  "subject" TEXT,
  "body" TEXT NOT NULL,
  "studentApplicationId" TEXT,
  "instructorApplicationId" TEXT,
  "userId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NotificationLog_tenantId_createdAt_idx"
  ON "NotificationLog"("tenantId", "createdAt");
CREATE INDEX "NotificationLog_status_idx"
  ON "NotificationLog"("status");
CREATE INDEX "NotificationLog_template_idx"
  ON "NotificationLog"("template");
CREATE INDEX "NotificationLog_studentApplicationId_idx"
  ON "NotificationLog"("studentApplicationId");
CREATE INDEX "NotificationLog_instructorApplicationId_idx"
  ON "NotificationLog"("instructorApplicationId");

ALTER TABLE "NotificationLog"
  ADD CONSTRAINT "NotificationLog_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NotificationLog"
  ADD CONSTRAINT "NotificationLog_studentApplicationId_fkey"
  FOREIGN KEY ("studentApplicationId") REFERENCES "StudentApplication"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "NotificationLog"
  ADD CONSTRAINT "NotificationLog_instructorApplicationId_fkey"
  FOREIGN KEY ("instructorApplicationId") REFERENCES "InstructorApplication"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "NotificationLog"
  ADD CONSTRAINT "NotificationLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
