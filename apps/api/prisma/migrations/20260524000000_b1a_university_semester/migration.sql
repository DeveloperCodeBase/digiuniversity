-- Phase B B.1a — Academic Hierarchy (additive).
--
-- Tables: University + Semester. Both tenant-scoped, soft-delete enabled
-- (deletedAt nullable), audit fields (createdBy/updatedBy + timestamps)
-- per the standing Phase-A convention. NEW tables only — no destructive
-- changes to any Phase-A surface. Cascade from Tenant on delete.
--
-- Semester is scoped under University AND Tenant (denormalized tenantId)
-- so list/get queries can `WHERE tenantId = $user.tenantId` without
-- joining through University every time — same pattern Department uses
-- (Department has both tenantId + facultyId).

-- ---------- University ----------
CREATE TABLE "University" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameFa" TEXT NOT NULL,
    "nameEn" TEXT,
    "shortCode" TEXT NOT NULL,
    "charterDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "University_tenantId_slug_key" ON "University"("tenantId", "slug");
CREATE UNIQUE INDEX "University_tenantId_shortCode_key" ON "University"("tenantId", "shortCode");
CREATE INDEX "University_tenantId_idx" ON "University"("tenantId");
CREATE INDEX "University_deletedAt_idx" ON "University"("deletedAt");
ALTER TABLE "University" ADD CONSTRAINT "University_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------- Semester ----------
CREATE TABLE "Semester" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameFa" TEXT NOT NULL,
    "termType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "registrationOpen" TIMESTAMP(3),
    "registrationClose" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "Semester_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Semester_universityId_code_key" ON "Semester"("universityId", "code");
CREATE INDEX "Semester_tenantId_idx" ON "Semester"("tenantId");
CREATE INDEX "Semester_universityId_idx" ON "Semester"("universityId");
CREATE INDEX "Semester_deletedAt_idx" ON "Semester"("deletedAt");
ALTER TABLE "Semester" ADD CONSTRAINT "Semester_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Semester" ADD CONSTRAINT "Semester_universityId_fkey"
    FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;
