ALTER TABLE "StaffordosInboundAutomationEmail"
  ADD COLUMN "claimToken" TEXT,
  ADD COLUMN "claimStartedAt" TIMESTAMP(3),
  ADD COLUMN "claimExpiresAt" TIMESTAMP(3),
  ADD COLUMN "firstAttemptAt" TIMESTAMP(3);

CREATE INDEX "StaffordosInboundAutomationEmail_claimExpiresAt_idx"
  ON "StaffordosInboundAutomationEmail"("claimExpiresAt");
