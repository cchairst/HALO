CREATE TABLE "ChatChartSuggestion" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "familyContactId" TEXT,
    "field" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatChartSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChatChartSuggestion_recipientId_status_idx" ON "ChatChartSuggestion"("recipientId", "status");
CREATE INDEX "ChatChartSuggestion_messageId_idx" ON "ChatChartSuggestion"("messageId");

ALTER TABLE "ChatChartSuggestion" ADD CONSTRAINT "ChatChartSuggestion_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "DirectMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatChartSuggestion" ADD CONSTRAINT "ChatChartSuggestion_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "CareRecipient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChatChartSuggestion" ADD CONSTRAINT "ChatChartSuggestion_familyContactId_fkey" FOREIGN KEY ("familyContactId") REFERENCES "FamilyContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ChatChartSuggestion" ADD CONSTRAINT "ChatChartSuggestion_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
