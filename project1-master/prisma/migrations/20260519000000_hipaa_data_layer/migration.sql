-- HIPAA data-layer additions: state/NPI on User, AuditLog table for PHI
-- access logging, ConsentForm table for release/treatment consent records.

ALTER TABLE "User"
  ADD COLUMN "state"         TEXT,
  ADD COLUMN "npi"           TEXT,
  ADD COLUMN "npiVerified"   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "npiCredential" TEXT;

CREATE TABLE "AuditLog" (
  "id"          TEXT PRIMARY KEY,
  "actorId"     TEXT,
  "recipientId" TEXT,
  "action"      TEXT NOT NULL,
  "target"      TEXT,
  "ip"          TEXT,
  "userAgent"   TEXT,
  "metadata"    JSONB,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_actor_fkey"
    FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL,
  CONSTRAINT "AuditLog_recipient_fkey"
    FOREIGN KEY ("recipientId") REFERENCES "CareRecipient"("id") ON DELETE SET NULL
);

CREATE INDEX "AuditLog_recipientId_createdAt_idx" ON "AuditLog" ("recipientId", "createdAt");
CREATE INDEX "AuditLog_actorId_createdAt_idx"     ON "AuditLog" ("actorId", "createdAt");
CREATE INDEX "AuditLog_action_createdAt_idx"      ON "AuditLog" ("action", "createdAt");

CREATE TABLE "ConsentForm" (
  "id"              TEXT PRIMARY KEY,
  "threadId"        TEXT NOT NULL,
  "recipientId"     TEXT,
  "requestedById"   TEXT NOT NULL,
  "signerId"        TEXT NOT NULL,
  "formType"        TEXT NOT NULL,
  "title"           TEXT NOT NULL,
  "body"            TEXT NOT NULL,
  "state"           TEXT,
  "status"          TEXT NOT NULL DEFAULT 'pending',
  "signedAt"        TIMESTAMP(3),
  "signedName"      TEXT,
  "signedIp"        TEXT,
  "signedUserAgent" TEXT,
  "decisionNote"    TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ConsentForm_recipient_fkey"
    FOREIGN KEY ("recipientId") REFERENCES "CareRecipient"("id") ON DELETE SET NULL,
  CONSTRAINT "ConsentForm_requestedBy_fkey"
    FOREIGN KEY ("requestedById") REFERENCES "User"("id"),
  CONSTRAINT "ConsentForm_signer_fkey"
    FOREIGN KEY ("signerId") REFERENCES "User"("id")
);

CREATE INDEX "ConsentForm_threadId_createdAt_idx"   ON "ConsentForm" ("threadId", "createdAt");
CREATE INDEX "ConsentForm_recipientId_status_idx"  ON "ConsentForm" ("recipientId", "status");
CREATE INDEX "ConsentForm_signerId_status_idx"     ON "ConsentForm" ("signerId", "status");
