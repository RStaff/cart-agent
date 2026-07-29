-- CreateTable
CREATE TABLE "public"."ShopifixerMerchant" (
    "id" TEXT NOT NULL,
    "normalizedShopifyDomain" TEXT NOT NULL,
    "displayName" TEXT,
    "classification" TEXT NOT NULL DEFAULT 'merchant',
    "status" TEXT NOT NULL DEFAULT 'identified',
    "source" TEXT NOT NULL DEFAULT 'staffordmedia_shopifixer',
    "controlledTest" BOOLEAN NOT NULL DEFAULT false,
    "sourceMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopifixerMerchant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShopifixerLead" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "legacyLeadAlias" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "productSurface" TEXT NOT NULL DEFAULT 'staffordmedia_shopifixer',
    "source" TEXT NOT NULL DEFAULT 'staffordmedia',
    "status" TEXT NOT NULL DEFAULT 'lead_created',
    "currentStage" TEXT NOT NULL DEFAULT 'lead_created',
    "submittedEmail" TEXT,
    "contactConfidence" TEXT,
    "nextAction" TEXT,
    "sourceMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopifixerLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShopifixerAudit" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "normalizedShopifyDomain" TEXT NOT NULL,
    "auditSequence" INTEGER NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "requestFingerprint" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "source" TEXT NOT NULL DEFAULT 'staffordmedia_shopifixer',
    "inputSnapshot" JSONB NOT NULL,
    "analysisSnapshot" JSONB,
    "findingsSnapshot" JSONB,
    "findingSummary" JSONB,
    "topIssue" TEXT,
    "recommendedAction" TEXT,
    "auditScore" INTEGER,
    "estimatedRevenueLoss" TEXT,
    "analyzerVersion" TEXT,
    "sourceCommit" TEXT,
    "sourceBuildId" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "supersededByAuditId" TEXT,
    "failureKind" TEXT,
    "failureMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopifixerAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShopifixerLeadEvent" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "leadId" TEXT,
    "auditId" TEXT,
    "packetId" TEXT,
    "proofReferenceId" TEXT,
    "eventType" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'system',
    "source" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopifixerLeadEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShopifixerPacketLink" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "packetId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'execution',
    "status" TEXT NOT NULL DEFAULT 'active',
    "activeKey" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "authorizedBy" TEXT,
    "authorizationSource" TEXT,
    "sourceMetadata" JSONB,
    "canceledAt" TIMESTAMP(3),
    "supersededAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopifixerPacketLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShopifixerProofReference" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "packetId" TEXT NOT NULL,
    "packetLinkId" TEXT,
    "proofVersion" INTEGER NOT NULL DEFAULT 1,
    "proofType" TEXT NOT NULL DEFAULT 'before_after',
    "status" TEXT NOT NULL DEFAULT 'recorded',
    "idempotencyKey" TEXT NOT NULL,
    "artifactUri" TEXT,
    "artifactHash" TEXT,
    "beforeEvidence" JSONB,
    "afterEvidence" JSONB,
    "rollbackEvidence" JSONB,
    "verificationSummary" JSONB,
    "immutableMetadata" JSONB,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "verifier" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopifixerProofReference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopifixerMerchant_normalizedShopifyDomain_key" ON "public"."ShopifixerMerchant"("normalizedShopifyDomain");

-- CreateIndex
CREATE INDEX "ShopifixerMerchant_status_updatedAt_idx" ON "public"."ShopifixerMerchant"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "ShopifixerMerchant_source_createdAt_idx" ON "public"."ShopifixerMerchant"("source", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifixerLead_legacyLeadAlias_key" ON "public"."ShopifixerLead"("legacyLeadAlias");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifixerLead_idempotencyKey_key" ON "public"."ShopifixerLead"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ShopifixerLead_merchantId_updatedAt_idx" ON "public"."ShopifixerLead"("merchantId", "updatedAt");

-- CreateIndex
CREATE INDEX "ShopifixerLead_status_updatedAt_idx" ON "public"."ShopifixerLead"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "ShopifixerLead_currentStage_updatedAt_idx" ON "public"."ShopifixerLead"("currentStage", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifixerAudit_idempotencyKey_key" ON "public"."ShopifixerAudit"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ShopifixerAudit_merchantId_createdAt_idx" ON "public"."ShopifixerAudit"("merchantId", "createdAt");

-- CreateIndex
CREATE INDEX "ShopifixerAudit_leadId_createdAt_idx" ON "public"."ShopifixerAudit"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "ShopifixerAudit_normalizedShopifyDomain_createdAt_idx" ON "public"."ShopifixerAudit"("normalizedShopifyDomain", "createdAt");

-- CreateIndex
CREATE INDEX "ShopifixerAudit_status_updatedAt_idx" ON "public"."ShopifixerAudit"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "ShopifixerAudit_supersededByAuditId_idx" ON "public"."ShopifixerAudit"("supersededByAuditId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifixerAudit_merchantId_auditSequence_key" ON "public"."ShopifixerAudit"("merchantId", "auditSequence");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifixerLeadEvent_idempotencyKey_key" ON "public"."ShopifixerLeadEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ShopifixerLeadEvent_merchantId_createdAt_idx" ON "public"."ShopifixerLeadEvent"("merchantId", "createdAt");

-- CreateIndex
CREATE INDEX "ShopifixerLeadEvent_leadId_createdAt_idx" ON "public"."ShopifixerLeadEvent"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "ShopifixerLeadEvent_auditId_createdAt_idx" ON "public"."ShopifixerLeadEvent"("auditId", "createdAt");

-- CreateIndex
CREATE INDEX "ShopifixerLeadEvent_packetId_createdAt_idx" ON "public"."ShopifixerLeadEvent"("packetId", "createdAt");

-- CreateIndex
CREATE INDEX "ShopifixerLeadEvent_eventType_createdAt_idx" ON "public"."ShopifixerLeadEvent"("eventType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifixerPacketLink_activeKey_key" ON "public"."ShopifixerPacketLink"("activeKey");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifixerPacketLink_idempotencyKey_key" ON "public"."ShopifixerPacketLink"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ShopifixerPacketLink_merchantId_createdAt_idx" ON "public"."ShopifixerPacketLink"("merchantId", "createdAt");

-- CreateIndex
CREATE INDEX "ShopifixerPacketLink_auditId_createdAt_idx" ON "public"."ShopifixerPacketLink"("auditId", "createdAt");

-- CreateIndex
CREATE INDEX "ShopifixerPacketLink_packetId_idx" ON "public"."ShopifixerPacketLink"("packetId");

-- CreateIndex
CREATE INDEX "ShopifixerPacketLink_status_updatedAt_idx" ON "public"."ShopifixerPacketLink"("status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifixerPacketLink_auditId_packetId_purpose_key" ON "public"."ShopifixerPacketLink"("auditId", "packetId", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifixerProofReference_idempotencyKey_key" ON "public"."ShopifixerProofReference"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ShopifixerProofReference_merchantId_createdAt_idx" ON "public"."ShopifixerProofReference"("merchantId", "createdAt");

-- CreateIndex
CREATE INDEX "ShopifixerProofReference_auditId_createdAt_idx" ON "public"."ShopifixerProofReference"("auditId", "createdAt");

-- CreateIndex
CREATE INDEX "ShopifixerProofReference_packetId_createdAt_idx" ON "public"."ShopifixerProofReference"("packetId", "createdAt");

-- CreateIndex
CREATE INDEX "ShopifixerProofReference_status_updatedAt_idx" ON "public"."ShopifixerProofReference"("status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifixerProofReference_auditId_packetId_proofVersion_key" ON "public"."ShopifixerProofReference"("auditId", "packetId", "proofVersion");

-- AddForeignKey
ALTER TABLE "public"."ShopifixerLead" ADD CONSTRAINT "ShopifixerLead_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "public"."ShopifixerMerchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShopifixerAudit" ADD CONSTRAINT "ShopifixerAudit_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "public"."ShopifixerMerchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShopifixerAudit" ADD CONSTRAINT "ShopifixerAudit_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."ShopifixerLead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShopifixerLeadEvent" ADD CONSTRAINT "ShopifixerLeadEvent_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "public"."ShopifixerMerchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShopifixerLeadEvent" ADD CONSTRAINT "ShopifixerLeadEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."ShopifixerLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShopifixerLeadEvent" ADD CONSTRAINT "ShopifixerLeadEvent_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "public"."ShopifixerAudit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShopifixerLeadEvent" ADD CONSTRAINT "ShopifixerLeadEvent_packetId_fkey" FOREIGN KEY ("packetId") REFERENCES "public"."packets"("packet_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShopifixerLeadEvent" ADD CONSTRAINT "ShopifixerLeadEvent_proofReferenceId_fkey" FOREIGN KEY ("proofReferenceId") REFERENCES "public"."ShopifixerProofReference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShopifixerPacketLink" ADD CONSTRAINT "ShopifixerPacketLink_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "public"."ShopifixerMerchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShopifixerPacketLink" ADD CONSTRAINT "ShopifixerPacketLink_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "public"."ShopifixerAudit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShopifixerPacketLink" ADD CONSTRAINT "ShopifixerPacketLink_packetId_fkey" FOREIGN KEY ("packetId") REFERENCES "public"."packets"("packet_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShopifixerProofReference" ADD CONSTRAINT "ShopifixerProofReference_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "public"."ShopifixerMerchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShopifixerProofReference" ADD CONSTRAINT "ShopifixerProofReference_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "public"."ShopifixerAudit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShopifixerProofReference" ADD CONSTRAINT "ShopifixerProofReference_packetId_fkey" FOREIGN KEY ("packetId") REFERENCES "public"."packets"("packet_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShopifixerProofReference" ADD CONSTRAINT "ShopifixerProofReference_packetLinkId_fkey" FOREIGN KEY ("packetLinkId") REFERENCES "public"."ShopifixerPacketLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;
