CREATE TABLE "StaffordosInboundAutomationRateLimit" (
    "visitorHash" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StaffordosInboundAutomationRateLimit_pkey" PRIMARY KEY ("visitorHash", "windowStart")
);

CREATE INDEX "StaffordosInboundAutomationRateLimit_windowStart_idx" ON "StaffordosInboundAutomationRateLimit"("windowStart");
