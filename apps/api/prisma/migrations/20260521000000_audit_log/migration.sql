-- Phase 15 R1 — generic AuditLog for sensitive state-changing actions.
-- AiInteractionLog covers AI-specific calls; LearningEvent covers
-- learner-facing user events; this table is the catch-all for
-- role grants, course delete/publish, refunds, tenant config changes
-- — anything that should be reconstructable from the log if disputed.

CREATE TABLE "AuditLog" (
    "id"         TEXT NOT NULL,
    "tenantId"   TEXT NOT NULL,
    "actorId"    TEXT,
    "action"     TEXT NOT NULL,
    "subject"    TEXT NOT NULL,
    "before"     JSONB,
    "after"      JSONB,
    "ip"         VARCHAR(64),
    "userAgent"  VARCHAR(512),
    "requestId"  TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- Indexes match @@index in schema.prisma. Composite (tenantId, createdAt)
-- supports the most common query: "show the latest N events for this
-- tenant", which is what the admin audit-log viewer will paginate.
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");
CREATE INDEX "AuditLog_actorId_createdAt_idx"  ON "AuditLog"("actorId", "createdAt");
CREATE INDEX "AuditLog_action_idx"             ON "AuditLog"("action");
CREATE INDEX "AuditLog_subject_idx"            ON "AuditLog"("subject");
CREATE INDEX "AuditLog_requestId_idx"          ON "AuditLog"("requestId");

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- actorId is nullable + ON DELETE SET NULL so deleting a user doesn't
-- cascade-erase their audit trail (the trail must outlive the user
-- for forensic + compliance reasons).
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
