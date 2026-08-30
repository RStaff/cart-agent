ALTER TABLE "CareerSearchPreference"
  ADD COLUMN IF NOT EXISTS "requestedTitle" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "normalizedTitle" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "roleFamily" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "specialization" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "seniority" TEXT NOT NULL DEFAULT 'UNSPECIFIED',
  ADD COLUMN IF NOT EXISTS "excludedTitles" JSONB NOT NULL DEFAULT '[]';

CREATE TABLE IF NOT EXISTS "CareerRelevanceFeedback" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "targetRoleNormalized" TEXT NOT NULL,
  "requestedTitle" TEXT NOT NULL,
  "observedTitle" TEXT NOT NULL,
  "observedTitleNormalized" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "provider" TEXT,
  "externalOpportunityId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CareerRelevanceFeedback_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CareerRelevanceFeedback_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CareerTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CareerRelevanceFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CareerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "CareerRelevanceFeedback_tenantId_userId_targetRoleNormalized_idx" ON "CareerRelevanceFeedback"("tenantId", "userId", "targetRoleNormalized");
CREATE INDEX IF NOT EXISTS "CareerRelevanceFeedback_tenantId_userId_observedTitleNormalized_idx" ON "CareerRelevanceFeedback"("tenantId", "userId", "observedTitleNormalized");
