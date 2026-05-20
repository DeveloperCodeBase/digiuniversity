-- Phase 9 — RAG-ready tutor (additive).
-- Document corpus + chunks (vector column is JSON for now; future
-- migrations can switch to pgvector without losing rows).

CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT,
    "title" TEXT NOT NULL,
    "source" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'text',
    "content" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'fa',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Document_tenantId_idx" ON "Document"("tenantId");
CREATE INDEX "Document_courseId_idx" ON "Document"("courseId");
CREATE INDEX "Document_deletedAt_idx" ON "Document"("deletedAt");
ALTER TABLE "Document" ADD CONSTRAINT "Document_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "DocumentChunk" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "text" TEXT NOT NULL,
    "tokenCount" INTEGER,
    "embedding" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentChunk_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "DocumentChunk_tenantId_idx" ON "DocumentChunk"("tenantId");
CREATE INDEX "DocumentChunk_documentId_idx" ON "DocumentChunk"("documentId");
ALTER TABLE "DocumentChunk" ADD CONSTRAINT "DocumentChunk_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentChunk" ADD CONSTRAINT "DocumentChunk_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TutorSession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT,
    "title" TEXT NOT NULL DEFAULT 'گفت‌و‌گوی جدید',
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "TutorSession_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TutorSession_tenantId_idx" ON "TutorSession"("tenantId");
CREATE INDEX "TutorSession_userId_idx" ON "TutorSession"("userId");
CREATE INDEX "TutorSession_courseId_idx" ON "TutorSession"("courseId");
CREATE INDEX "TutorSession_lastMessageAt_idx" ON "TutorSession"("lastMessageAt");
CREATE INDEX "TutorSession_deletedAt_idx" ON "TutorSession"("deletedAt");
ALTER TABLE "TutorSession" ADD CONSTRAINT "TutorSession_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TutorSession" ADD CONSTRAINT "TutorSession_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TutorMessage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "citations" JSONB,
    "aiRequestId" TEXT,
    "confidence" DOUBLE PRECISION,
    "humanReviewRequired" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TutorMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TutorMessage_tenantId_idx" ON "TutorMessage"("tenantId");
CREATE INDEX "TutorMessage_sessionId_idx" ON "TutorMessage"("sessionId");
CREATE INDEX "TutorMessage_createdAt_idx" ON "TutorMessage"("createdAt");
ALTER TABLE "TutorMessage" ADD CONSTRAINT "TutorMessage_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TutorMessage" ADD CONSTRAINT "TutorMessage_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "TutorSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TutorMessage" ADD CONSTRAINT "TutorMessage_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
