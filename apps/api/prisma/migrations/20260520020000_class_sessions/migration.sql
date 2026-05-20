-- Phase 6 — class sessions, recordings, attendance (additive).

-- ---------- ClassSession ----------
CREATE TABLE "ClassSession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "hostUserId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "joinPolicy" TEXT NOT NULL DEFAULT 'enrolled',
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "providerMeetingId" TEXT,
    "joinUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "ClassSession_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ClassSession_tenantId_idx" ON "ClassSession"("tenantId");
CREATE INDEX "ClassSession_courseId_idx" ON "ClassSession"("courseId");
CREATE INDEX "ClassSession_scheduledStart_idx" ON "ClassSession"("scheduledStart");
CREATE INDEX "ClassSession_deletedAt_idx" ON "ClassSession"("deletedAt");
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_hostUserId_fkey"
    FOREIGN KEY ("hostUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------- Recording ----------
CREATE TABLE "Recording" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "classSessionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'none',
    "mediaUrl" TEXT,
    "transcriptUrl" TEXT,
    "durationSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "Recording_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Recording_classSessionId_key" ON "Recording"("classSessionId");
CREATE INDEX "Recording_tenantId_idx" ON "Recording"("tenantId");
CREATE INDEX "Recording_deletedAt_idx" ON "Recording"("deletedAt");
ALTER TABLE "Recording" ADD CONSTRAINT "Recording_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Recording" ADD CONSTRAINT "Recording_classSessionId_fkey"
    FOREIGN KEY ("classSessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------- Attendance ----------
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "classSessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Attendance_classSessionId_userId_joinedAt_key" ON "Attendance"("classSessionId", "userId", "joinedAt");
CREATE INDEX "Attendance_tenantId_idx" ON "Attendance"("tenantId");
CREATE INDEX "Attendance_classSessionId_idx" ON "Attendance"("classSessionId");
CREATE INDEX "Attendance_userId_idx" ON "Attendance"("userId");
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_classSessionId_fkey"
    FOREIGN KEY ("classSessionId") REFERENCES "ClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
