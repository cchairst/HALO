ALTER TABLE "CareRecipient"
ADD COLUMN "allergies" TEXT,
ADD COLUMN "room" TEXT;

ALTER TABLE "Resource"
ADD COLUMN "type" TEXT NOT NULL DEFAULT 'note',
ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'low',
ADD COLUMN "resolvedAt" TIMESTAMP(3);

CREATE INDEX "Resource_recipientId_priority_resolvedAt_idx" ON "Resource"("recipientId", "priority", "resolvedAt");
CREATE INDEX "Resource_type_createdAt_idx" ON "Resource"("type", "createdAt");
