CREATE TABLE "StaffordosInboundAutomationInquiry" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "briefHash" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'staffordmedia_automate',
  "status" TEXT NOT NULL DEFAULT 'NEEDS_REVIEW',
  "name" TEXT,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "companyName" TEXT,
  "businessType" TEXT,
  "improvements" JSONB NOT NULL,
  "systems" JSONB NOT NULL,
  "currentWorkflow" TEXT,
  "desiredWorkflow" TEXT,
  "contactAcknowledgement" BOOLEAN NOT NULL DEFAULT false,
  "possibleDuplicateOfId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewedBy" TEXT,
  "nextAction" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "StaffordosInboundAutomationInquiry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffordosInboundAutomationInquiry_submissionId_key"
  ON "StaffordosInboundAutomationInquiry"("submissionId");
CREATE INDEX "StaffordosInboundAutomationInquiry_email_createdAt_idx"
  ON "StaffordosInboundAutomationInquiry"("email", "createdAt");
CREATE INDEX "StaffordosInboundAutomationInquiry_status_createdAt_idx"
  ON "StaffordosInboundAutomationInquiry"("status", "createdAt");
