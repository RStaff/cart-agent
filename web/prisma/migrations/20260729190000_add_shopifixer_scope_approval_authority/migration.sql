-- CreateTable
CREATE TABLE "public"."ShopifixerRepairScope" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "scopeVersion" INTEGER NOT NULL DEFAULT 1,
    "scopeFingerprint" TEXT NOT NULL,
    "sourceEvidenceVersion" TEXT,
    "sourceRepairPlanVersion" TEXT,
    "status" TEXT NOT NULL DEFAULT 'stored',
    "includedRepairs" JSONB NOT NULL,
    "excludedRepairs" JSONB NOT NULL,
    "deferredRepairs" JSONB NOT NULL,
    "assumptions" JSONB,
    "dependencies" JSONB,
    "notInScope" JSONB,
    "implementationSize" TEXT,
    "verificationCriteria" JSONB,
    "rollbackExpectations" JSONB,
    "normalizedSnapshot" JSONB NOT NULL,
    "createdByActorType" TEXT NOT NULL,
    "createdByActorId" TEXT,
    "supersededAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopifixerRepairScope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShopifixerRepairApproval" (
    "id" TEXT NOT NULL,
    "approvalId" TEXT NOT NULL,
    "repairScopeId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "approvalIdempotencyKey" TEXT NOT NULL,
    "approvalFingerprint" TEXT NOT NULL,
    "activeKey" TEXT,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorDisplayLabel" TEXT,
    "approvalSource" TEXT NOT NULL,
    "operatorMediated" BOOLEAN NOT NULL DEFAULT false,
    "merchantAuthenticated" BOOLEAN NOT NULL DEFAULT false,
    "approvalEvidence" JSONB NOT NULL,
    "approvedTermsBoundary" JSONB NOT NULL,
    "approvedIncludedRepairIds" JSONB NOT NULL,
    "approvedScopeFingerprint" TEXT NOT NULL,
    "approvedScopeVersion" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedByActorType" TEXT,
    "revokedByActorId" TEXT,
    "revocationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopifixerRepairApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopifixerRepairScope_scopeId_key" ON "public"."ShopifixerRepairScope"("scopeId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifixerRepairScope_auditId_scopeVersion_key" ON "public"."ShopifixerRepairScope"("auditId", "scopeVersion");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifixerRepairScope_auditId_scopeFingerprint_key" ON "public"."ShopifixerRepairScope"("auditId", "scopeFingerprint");

-- CreateIndex
CREATE INDEX "ShopifixerRepairScope_merchantId_createdAt_idx" ON "public"."ShopifixerRepairScope"("merchantId", "createdAt");

-- CreateIndex
CREATE INDEX "ShopifixerRepairScope_auditId_createdAt_idx" ON "public"."ShopifixerRepairScope"("auditId", "createdAt");

-- CreateIndex
CREATE INDEX "ShopifixerRepairScope_scopeFingerprint_idx" ON "public"."ShopifixerRepairScope"("scopeFingerprint");

-- CreateIndex
CREATE INDEX "ShopifixerRepairScope_status_createdAt_idx" ON "public"."ShopifixerRepairScope"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifixerRepairApproval_approvalId_key" ON "public"."ShopifixerRepairApproval"("approvalId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifixerRepairApproval_approvalIdempotencyKey_key" ON "public"."ShopifixerRepairApproval"("approvalIdempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifixerRepairApproval_activeKey_key" ON "public"."ShopifixerRepairApproval"("activeKey");

-- CreateIndex
CREATE INDEX "ShopifixerRepairApproval_repairScopeId_createdAt_idx" ON "public"."ShopifixerRepairApproval"("repairScopeId", "createdAt");

-- CreateIndex
CREATE INDEX "ShopifixerRepairApproval_merchantId_createdAt_idx" ON "public"."ShopifixerRepairApproval"("merchantId", "createdAt");

-- CreateIndex
CREATE INDEX "ShopifixerRepairApproval_auditId_createdAt_idx" ON "public"."ShopifixerRepairApproval"("auditId", "createdAt");

-- CreateIndex
CREATE INDEX "ShopifixerRepairApproval_approvalFingerprint_idx" ON "public"."ShopifixerRepairApproval"("approvalFingerprint");

-- CreateIndex
CREATE INDEX "ShopifixerRepairApproval_status_updatedAt_idx" ON "public"."ShopifixerRepairApproval"("status", "updatedAt");

-- AddForeignKey
ALTER TABLE "public"."ShopifixerRepairScope" ADD CONSTRAINT "ShopifixerRepairScope_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "public"."ShopifixerMerchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShopifixerRepairScope" ADD CONSTRAINT "ShopifixerRepairScope_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "public"."ShopifixerAudit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShopifixerRepairApproval" ADD CONSTRAINT "ShopifixerRepairApproval_repairScopeId_fkey" FOREIGN KEY ("repairScopeId") REFERENCES "public"."ShopifixerRepairScope"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShopifixerRepairApproval" ADD CONSTRAINT "ShopifixerRepairApproval_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "public"."ShopifixerMerchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShopifixerRepairApproval" ADD CONSTRAINT "ShopifixerRepairApproval_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "public"."ShopifixerAudit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
