CREATE TABLE "StaffordosInboundAutomationEmail" (
  "id" TEXT NOT NULL,
  "inquiryId" TEXT NOT NULL,
  "messageType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "providerId" TEXT,
  "lastError" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3),
  "nextAttemptAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StaffordosInboundAutomationEmail_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StaffordosInboundAutomationEmail_inquiryId_fkey"
    FOREIGN KEY ("inquiryId") REFERENCES "StaffordosInboundAutomationInquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "StaffordosInboundAutomationEmail_idempotencyKey_key"
  ON "StaffordosInboundAutomationEmail"("idempotencyKey");
CREATE UNIQUE INDEX "StaffordosInboundAutomationEmail_inquiryId_messageType_key"
  ON "StaffordosInboundAutomationEmail"("inquiryId", "messageType");
CREATE INDEX "StaffordosInboundAutomationEmail_status_nextAttemptAt_idx"
  ON "StaffordosInboundAutomationEmail"("status", "nextAttemptAt");
