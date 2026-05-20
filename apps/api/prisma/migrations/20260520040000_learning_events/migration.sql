-- Phase 8 — learning events (additive).

CREATE TABLE "LearningEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "courseId" TEXT,
    "lessonId" TEXT,
    "assessmentId" TEXT,
    "classSessionId" TEXT,
    "data" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearningEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LearningEvent_tenantId_idx" ON "LearningEvent"("tenantId");
CREATE INDEX "LearningEvent_userId_idx" ON "LearningEvent"("userId");
CREATE INDEX "LearningEvent_type_idx" ON "LearningEvent"("type");
CREATE INDEX "LearningEvent_occurredAt_idx" ON "LearningEvent"("occurredAt");
CREATE INDEX "LearningEvent_courseId_idx" ON "LearningEvent"("courseId");
CREATE INDEX "LearningEvent_assessmentId_idx" ON "LearningEvent"("assessmentId");
CREATE INDEX "LearningEvent_classSessionId_idx" ON "LearningEvent"("classSessionId");
ALTER TABLE "LearningEvent" ADD CONSTRAINT "LearningEvent_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningEvent" ADD CONSTRAINT "LearningEvent_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
