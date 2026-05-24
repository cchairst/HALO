CREATE TABLE "TimelineWhy" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "entryKey" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "confidence" TEXT NOT NULL DEFAULT 'high',
    "sourceEntryIds" TEXT[],
    "draftedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimelineWhy_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TimelineWhy_entryKey_locale_key" ON "TimelineWhy"("entryKey", "locale");
CREATE INDEX "TimelineWhy_recipientId_idx" ON "TimelineWhy"("recipientId");
