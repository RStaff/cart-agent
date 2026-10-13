CREATE TABLE "StaffordosBlueprintDeliverable" (
    "id" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "recordVersion" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'recorded',
    "owner" TEXT NOT NULL,
    "prerequisiteRefs" JSONB NOT NULL DEFAULT '[]',
    "contents" JSONB NOT NULL,
    "evidenceRefs" JSONB NOT NULL DEFAULT '[]',
    "claimClassifications" JSONB NOT NULL DEFAULT '[]',
    "limitations" JSONB NOT NULL DEFAULT '[]',
    "qualityReviewEvidenceRef" TEXT,
    "supersedesId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StaffordosBlueprintDeliverable_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StaffordosBlueprintDeliverableAuditEvent" (
    "id" TEXT NOT NULL,
    "deliverableId" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "previousStatus" TEXT NOT NULL,
    "nextStatus" TEXT NOT NULL,
    "actorSubject" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidenceRef" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffordosBlueprintDeliverableAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffordosBlueprintDeliverable_engagementId_identifier_version_key"
  ON "StaffordosBlueprintDeliverable"("engagementId", "identifier", "version");
CREATE INDEX "StaffordosBlueprintDeliverable_engagementId_identifier_status_idx"
  ON "StaffordosBlueprintDeliverable"("engagementId", "identifier", "status");
CREATE UNIQUE INDEX "StaffordosBlueprintDeliverableAuditEvent_deliverableId_sequence_key"
  ON "StaffordosBlueprintDeliverableAuditEvent"("deliverableId", "sequence");
CREATE INDEX "StaffordosBlueprintDeliverableAuditEvent_engagementId_createdAt_idx"
  ON "StaffordosBlueprintDeliverableAuditEvent"("engagementId", "createdAt");

ALTER TABLE "StaffordosBlueprintDeliverable"
  ADD CONSTRAINT "StaffordosBlueprintDeliverable_engagementId_fkey"
  FOREIGN KEY ("engagementId") REFERENCES "StaffordosBlueprintEngagement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StaffordosBlueprintDeliverableAuditEvent"
  ADD CONSTRAINT "StaffordosBlueprintDeliverableAuditEvent_deliverableId_fkey"
  FOREIGN KEY ("deliverableId") REFERENCES "StaffordosBlueprintDeliverable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StaffordosBlueprintDeliverableAuditEvent"
  ADD CONSTRAINT "StaffordosBlueprintDeliverableAuditEvent_engagementId_fkey"
  FOREIGN KEY ("engagementId") REFERENCES "StaffordosBlueprintEngagement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
