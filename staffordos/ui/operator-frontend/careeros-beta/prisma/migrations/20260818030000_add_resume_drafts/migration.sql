CREATE TABLE IF NOT EXISTS "CareerResumeDraft" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "materialType" TEXT NOT NULL DEFAULT 'RESUME',
  "evaluationVersion" TEXT NOT NULL,
  "authorityVersion" INTEGER NOT NULL DEFAULT 1,
  "draftVersion" INTEGER NOT NULL DEFAULT 1,
  "content" JSONB NOT NULL,
  "stale" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CareerResumeDraft_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CareerResumeDraft_tenantId_userId_opportunityId_createdAt_idx" ON "CareerResumeDraft"("tenantId", "userId", "opportunityId", "createdAt");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CareerResumeDraft_tenantId_fkey') THEN
    ALTER TABLE "CareerResumeDraft" ADD CONSTRAINT "CareerResumeDraft_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CareerTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CareerResumeDraft_profileId_fkey') THEN
    ALTER TABLE "CareerResumeDraft" ADD CONSTRAINT "CareerResumeDraft_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CareerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CareerResumeDraft_opportunityId_fkey') THEN
    ALTER TABLE "CareerResumeDraft" ADD CONSTRAINT "CareerResumeDraft_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "CareerOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "CareerOpportunity" ADD COLUMN IF NOT EXISTS "lifecycleState" TEXT NOT NULL DEFAULT 'NEW';

CREATE TABLE IF NOT EXISTS "CareerOpportunityEvent" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CareerOpportunityEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CareerOpportunityEvent_tenantId_opportunityId_createdAt_idx" ON "CareerOpportunityEvent"("tenantId","opportunityId","createdAt");
CREATE INDEX IF NOT EXISTS "CareerOpportunityEvent_tenantId_userId_createdAt_idx" ON "CareerOpportunityEvent"("tenantId","userId","createdAt");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CareerOpportunityEvent_tenantId_fkey') THEN
    ALTER TABLE "CareerOpportunityEvent" ADD CONSTRAINT "CareerOpportunityEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CareerTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CareerOpportunityEvent_userId_fkey') THEN
    ALTER TABLE "CareerOpportunityEvent" ADD CONSTRAINT "CareerOpportunityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CareerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CareerOpportunityEvent_opportunityId_fkey') THEN
    ALTER TABLE "CareerOpportunityEvent" ADD CONSTRAINT "CareerOpportunityEvent_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "CareerOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "CareerOpportunityNote" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CareerOpportunityNote_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CareerOpportunityNote_tenantId_opportunityId_createdAt_idx" ON "CareerOpportunityNote"("tenantId","opportunityId","createdAt");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CareerOpportunityNote_tenantId_fkey') THEN
    ALTER TABLE "CareerOpportunityNote" ADD CONSTRAINT "CareerOpportunityNote_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CareerTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CareerOpportunityNote_userId_fkey') THEN
    ALTER TABLE "CareerOpportunityNote" ADD CONSTRAINT "CareerOpportunityNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CareerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CareerOpportunityNote_opportunityId_fkey') THEN
    ALTER TABLE "CareerOpportunityNote" ADD CONSTRAINT "CareerOpportunityNote_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "CareerOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
ALTER TABLE "CareerResumeDraft" ADD COLUMN IF NOT EXISTS "materialType" TEXT NOT NULL DEFAULT 'RESUME';
ALTER TABLE "CareerResumeDraft" ADD COLUMN IF NOT EXISTS "generationMethod" TEXT NOT NULL DEFAULT 'DETERMINISTIC';
ALTER TABLE "CareerResumeDraft" ADD COLUMN IF NOT EXISTS "provider" TEXT;
ALTER TABLE "CareerResumeDraft" ADD COLUMN IF NOT EXISTS "model" TEXT;

CREATE TABLE IF NOT EXISTS "CareerOpportunityInboxItem" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceName" TEXT,
  "sourceUrl" TEXT,
  "externalOpportunityId" TEXT,
  "discoveredAt" TIMESTAMP(3),
  "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "title" TEXT NOT NULL,
  "company" TEXT,
  "location" TEXT,
  "description" TEXT,
  "provenance" JSONB,
  "normalizedDigest" TEXT,
  "normalizedUrl" TEXT,
  "normalizationStatus" TEXT NOT NULL DEFAULT 'NORMALIZED',
  "duplicateStatus" TEXT NOT NULL DEFAULT 'NEW',
  "status" TEXT NOT NULL DEFAULT 'READY_TO_ANALYZE',
  "duplicateOfInboxItemId" TEXT,
  "opportunityId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CareerOpportunityInboxItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CareerOpportunityInboxItem_tenantId_userId_status_updatedAt_idx" ON "CareerOpportunityInboxItem"("tenantId","userId","status","updatedAt");
CREATE INDEX IF NOT EXISTS "CareerOpportunityInboxItem_tenantId_normalizedDigest_idx" ON "CareerOpportunityInboxItem"("tenantId","normalizedDigest");
CREATE INDEX IF NOT EXISTS "CareerOpportunityInboxItem_tenantId_normalizedUrl_idx" ON "CareerOpportunityInboxItem"("tenantId","normalizedUrl");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CareerOpportunityInboxItem_tenantId_fkey') THEN
    ALTER TABLE "CareerOpportunityInboxItem" ADD CONSTRAINT "CareerOpportunityInboxItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CareerTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CareerOpportunityInboxItem_profileId_fkey') THEN
    ALTER TABLE "CareerOpportunityInboxItem" ADD CONSTRAINT "CareerOpportunityInboxItem_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CareerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CareerOpportunityInboxItem_opportunityId_fkey') THEN
    ALTER TABLE "CareerOpportunityInboxItem" ADD CONSTRAINT "CareerOpportunityInboxItem_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "CareerOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
