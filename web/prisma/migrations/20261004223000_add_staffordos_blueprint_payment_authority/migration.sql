CREATE TABLE "StaffordosBlueprintEngagement" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'PAID_IDENTITY_REVIEW',
    "associationStatus" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "stripeSessionId" TEXT NOT NULL,
    "stripePaymentLinkId" TEXT NOT NULL,
    "stripeProductId" TEXT NOT NULL,
    "stripePriceId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripePaymentIntentId" TEXT,
    "amountTotal" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "buyerEmail" TEXT,
    "buyerName" TEXT,
    "buyerPhone" TEXT,
    "claimedInquiryReference" TEXT,
    "clientId" TEXT,
    "inquiryId" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffordosBlueprintEngagement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StaffordosBlueprintPaymentEvent" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "stripeSessionId" TEXT NOT NULL,
    "stripeEventType" TEXT NOT NULL,
    "livemode" BOOLEAN NOT NULL,
    "engagementId" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffordosBlueprintPaymentEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffordosBlueprintEngagement_stripeSessionId_key" ON "StaffordosBlueprintEngagement"("stripeSessionId");
CREATE INDEX "StaffordosBlueprintEngagement_state_createdAt_idx" ON "StaffordosBlueprintEngagement"("state", "createdAt");
CREATE INDEX "StaffordosBlueprintEngagement_associationStatus_createdAt_idx" ON "StaffordosBlueprintEngagement"("associationStatus", "createdAt");
CREATE UNIQUE INDEX "StaffordosBlueprintPaymentEvent_stripeEventId_key" ON "StaffordosBlueprintPaymentEvent"("stripeEventId");
CREATE UNIQUE INDEX "StaffordosBlueprintPaymentEvent_stripeSessionId_key" ON "StaffordosBlueprintPaymentEvent"("stripeSessionId");
CREATE UNIQUE INDEX "StaffordosBlueprintPaymentEvent_engagementId_key" ON "StaffordosBlueprintPaymentEvent"("engagementId");

ALTER TABLE "StaffordosBlueprintPaymentEvent"
ADD CONSTRAINT "StaffordosBlueprintPaymentEvent_engagementId_fkey"
FOREIGN KEY ("engagementId") REFERENCES "StaffordosBlueprintEngagement"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
