CREATE TABLE "StaffordosBlueprintPackage" (
  "id" TEXT NOT NULL,
  "engagementId" TEXT NOT NULL,
  "packageVersion" INTEGER NOT NULL DEFAULT 1,
  "status" TEXT NOT NULL DEFAULT 'preview',
  "sourceVersions" JSONB NOT NULL,
  "rendererVersion" TEXT NOT NULL,
  "templateDigest" TEXT NOT NULL,
  "assetDigest" TEXT NOT NULL,
  "renderedHtml" TEXT NOT NULL,
  "contentDigest" TEXT NOT NULL,
  "recordVersion" INTEGER NOT NULL DEFAULT 1,
  "creationIdempotencyKey" TEXT,
  "releaseIdempotencyKey" TEXT,
  "releasedAt" TIMESTAMP(3),
  "releasedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StaffordosBlueprintPackage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StaffordosBlueprintPackageAuditEvent" (
  "id" TEXT NOT NULL,
  "packageId" TEXT NOT NULL,
  "engagementId" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "action" TEXT NOT NULL,
  "previousStatus" TEXT NOT NULL,
  "nextStatus" TEXT NOT NULL,
  "actorSubject" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "evidenceRef" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StaffordosBlueprintPackageAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StaffordosBlueprintDelivery" (
  "id" TEXT NOT NULL,
  "packageId" TEXT NOT NULL,
  "engagementId" TEXT NOT NULL,
  "recipient" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "handoffAt" TIMESTAMP(3) NOT NULL,
  "evidenceRef" TEXT NOT NULL,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "actorSubject" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StaffordosBlueprintDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffordosBlueprintPackage_creationIdempotencyKey_key" ON "StaffordosBlueprintPackage"("creationIdempotencyKey");
CREATE UNIQUE INDEX "StaffordosBlueprintPackage_releaseIdempotencyKey_key" ON "StaffordosBlueprintPackage"("releaseIdempotencyKey");
CREATE UNIQUE INDEX "StaffordosBlueprintPackage_engagementId_packageVersion_key" ON "StaffordosBlueprintPackage"("engagementId", "packageVersion");
CREATE INDEX "StaffordosBlueprintPackage_engagementId_status_createdAt_idx" ON "StaffordosBlueprintPackage"("engagementId", "status", "createdAt");
CREATE UNIQUE INDEX "StaffordosBlueprintPackageAuditEvent_packageId_sequence_key" ON "StaffordosBlueprintPackageAuditEvent"("packageId", "sequence");
CREATE INDEX "StaffordosBlueprintPackageAuditEvent_engagementId_createdAt_idx" ON "StaffordosBlueprintPackageAuditEvent"("engagementId", "createdAt");
CREATE UNIQUE INDEX "StaffordosBlueprintDelivery_idempotencyKey_key" ON "StaffordosBlueprintDelivery"("idempotencyKey");
CREATE INDEX "StaffordosBlueprintDelivery_engagementId_createdAt_idx" ON "StaffordosBlueprintDelivery"("engagementId", "createdAt");

ALTER TABLE "StaffordosBlueprintPackage" ADD CONSTRAINT "StaffordosBlueprintPackage_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "StaffordosBlueprintEngagement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StaffordosBlueprintPackageAuditEvent" ADD CONSTRAINT "StaffordosBlueprintPackageAuditEvent_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "StaffordosBlueprintPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StaffordosBlueprintPackageAuditEvent" ADD CONSTRAINT "StaffordosBlueprintPackageAuditEvent_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "StaffordosBlueprintEngagement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StaffordosBlueprintDelivery" ADD CONSTRAINT "StaffordosBlueprintDelivery_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "StaffordosBlueprintPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StaffordosBlueprintDelivery" ADD CONSTRAINT "StaffordosBlueprintDelivery_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "StaffordosBlueprintEngagement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
