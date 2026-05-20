-- Phase 3 — university domain (additive).
--
-- Tables: Faculty → Department → Program → Course (+ CourseModule + Lesson),
-- Program → Cohort, User × Course → Enrollment.
--
-- Every row carries tenantId, audit fields (createdBy/updatedBy +
-- createdAt/updatedAt) and a nullable deletedAt for soft delete.

-- ---------- Faculty ----------
CREATE TABLE "Faculty" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "Faculty_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Faculty_tenantId_slug_key" ON "Faculty"("tenantId", "slug");
CREATE INDEX "Faculty_tenantId_idx" ON "Faculty"("tenantId");
CREATE INDEX "Faculty_deletedAt_idx" ON "Faculty"("deletedAt");
ALTER TABLE "Faculty" ADD CONSTRAINT "Faculty_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------- Department ----------
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Department_tenantId_slug_key" ON "Department"("tenantId", "slug");
CREATE INDEX "Department_tenantId_idx" ON "Department"("tenantId");
CREATE INDEX "Department_facultyId_idx" ON "Department"("facultyId");
CREATE INDEX "Department_deletedAt_idx" ON "Department"("deletedAt");
ALTER TABLE "Department" ADD CONSTRAINT "Department_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Department" ADD CONSTRAINT "Department_facultyId_fkey"
    FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------- Program ----------
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "degreeLevel" TEXT NOT NULL,
    "durationSemesters" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Program_tenantId_slug_key" ON "Program"("tenantId", "slug");
CREATE INDEX "Program_tenantId_idx" ON "Program"("tenantId");
CREATE INDEX "Program_departmentId_idx" ON "Program"("departmentId");
CREATE INDEX "Program_deletedAt_idx" ON "Program"("deletedAt");
ALTER TABLE "Program" ADD CONSTRAINT "Program_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Program" ADD CONSTRAINT "Program_departmentId_fkey"
    FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------- Course ----------
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 3,
    "language" TEXT NOT NULL DEFAULT 'fa',
    "level" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Course_tenantId_code_key" ON "Course"("tenantId", "code");
CREATE INDEX "Course_tenantId_idx" ON "Course"("tenantId");
CREATE INDEX "Course_programId_idx" ON "Course"("programId");
CREATE INDEX "Course_deletedAt_idx" ON "Course"("deletedAt");
ALTER TABLE "Course" ADD CONSTRAINT "Course_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Course" ADD CONSTRAINT "Course_programId_fkey"
    FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------- CourseModule ----------
CREATE TABLE "CourseModule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "CourseModule_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CourseModule_tenantId_idx" ON "CourseModule"("tenantId");
CREATE INDEX "CourseModule_courseId_idx" ON "CourseModule"("courseId");
CREATE INDEX "CourseModule_deletedAt_idx" ON "CourseModule"("deletedAt");
ALTER TABLE "CourseModule" ADD CONSTRAINT "CourseModule_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseModule" ADD CONSTRAINT "CourseModule_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------- Lesson ----------
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contentMarkdown" TEXT,
    "durationMinutes" INTEGER,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Lesson_tenantId_idx" ON "Lesson"("tenantId");
CREATE INDEX "Lesson_moduleId_idx" ON "Lesson"("moduleId");
CREATE INDEX "Lesson_deletedAt_idx" ON "Lesson"("deletedAt");
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_moduleId_fkey"
    FOREIGN KEY ("moduleId") REFERENCES "CourseModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------- Cohort ----------
CREATE TABLE "Cohort" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "Cohort_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Cohort_tenantId_slug_key" ON "Cohort"("tenantId", "slug");
CREATE INDEX "Cohort_tenantId_idx" ON "Cohort"("tenantId");
CREATE INDEX "Cohort_programId_idx" ON "Cohort"("programId");
CREATE INDEX "Cohort_deletedAt_idx" ON "Cohort"("deletedAt");
ALTER TABLE "Cohort" ADD CONSTRAINT "Cohort_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Cohort" ADD CONSTRAINT "Cohort_programId_fkey"
    FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------- Enrollment ----------
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "cohortId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Enrollment_tenantId_userId_courseId_key" ON "Enrollment"("tenantId", "userId", "courseId");
CREATE INDEX "Enrollment_tenantId_idx" ON "Enrollment"("tenantId");
CREATE INDEX "Enrollment_userId_idx" ON "Enrollment"("userId");
CREATE INDEX "Enrollment_courseId_idx" ON "Enrollment"("courseId");
CREATE INDEX "Enrollment_deletedAt_idx" ON "Enrollment"("deletedAt");
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_cohortId_fkey"
    FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE SET NULL ON UPDATE CASCADE;
