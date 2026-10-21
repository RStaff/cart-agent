CREATE TABLE "CareerCapabilityAuthority" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "capabilityKey" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "authorityState" TEXT NOT NULL,
  "provenance" JSONB NOT NULL,
  "taxonomyVersion" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CareerCapabilityAuthority_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CareerCapabilityAuthority_tenantId_profileId_capabilityKey_key" ON "CareerCapabilityAuthority"("tenantId", "profileId", "capabilityKey");
CREATE INDEX "CareerCapabilityAuthority_tenantId_userId_authorityState_idx" ON "CareerCapabilityAuthority"("tenantId", "userId", "authorityState");
ALTER TABLE "CareerCapabilityAuthority" ADD CONSTRAINT "CareerCapabilityAuthority_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CareerTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CareerCapabilityAuthority" ADD CONSTRAINT "CareerCapabilityAuthority_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CareerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CareerCapabilityDecision" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "capabilityId" TEXT NOT NULL,
  "questionKey" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "decisionState" TEXT NOT NULL,
  "rationale" TEXT,
  "taxonomyVersion" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "supersededAt" TIMESTAMP(3),
  CONSTRAINT "CareerCapabilityDecision_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CareerCapabilityDecision_tenantId_capabilityId_createdAt_idx" ON "CareerCapabilityDecision"("tenantId", "capabilityId", "createdAt");
CREATE INDEX "CareerCapabilityDecision_tenantId_questionKey_supersededAt_idx" ON "CareerCapabilityDecision"("tenantId", "questionKey", "supersededAt");
ALTER TABLE "CareerCapabilityDecision" ADD CONSTRAINT "CareerCapabilityDecision_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CareerTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CareerCapabilityDecision" ADD CONSTRAINT "CareerCapabilityDecision_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "CareerCapabilityAuthority"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CareerOpportunity" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "company" TEXT,
  "location" TEXT,
  "description" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CareerOpportunity_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CareerOpportunity_tenantId_userId_updatedAt_idx" ON "CareerOpportunity"("tenantId", "userId", "updatedAt");
ALTER TABLE "CareerOpportunity" ADD CONSTRAINT "CareerOpportunity_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CareerTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CareerOpportunity" ADD CONSTRAINT "CareerOpportunity_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CareerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CareerOpportunityRequirement" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "sourceOrder" INTEGER NOT NULL,
  "text" TEXT NOT NULL,
  "conceptKey" TEXT NOT NULL,
  "importance" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "specialist" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CareerOpportunityRequirement_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CareerOpportunityRequirement_opportunityId_sourceOrder_key" ON "CareerOpportunityRequirement"("opportunityId", "sourceOrder");
CREATE INDEX "CareerOpportunityRequirement_tenantId_opportunityId_idx" ON "CareerOpportunityRequirement"("tenantId", "opportunityId");
ALTER TABLE "CareerOpportunityRequirement" ADD CONSTRAINT "CareerOpportunityRequirement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CareerTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CareerOpportunityRequirement" ADD CONSTRAINT "CareerOpportunityRequirement_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "CareerOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CareerMatchEvaluation" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "taxonomyVersion" TEXT NOT NULL,
  "evaluationVersion" TEXT NOT NULL,
  "summary" JSONB NOT NULL,
  "relationships" JSONB NOT NULL,
  "stale" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CareerMatchEvaluation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CareerMatchEvaluation_tenantId_opportunityId_createdAt_idx" ON "CareerMatchEvaluation"("tenantId", "opportunityId", "createdAt");
CREATE INDEX "CareerMatchEvaluation_tenantId_profileId_stale_idx" ON "CareerMatchEvaluation"("tenantId", "profileId", "stale");
ALTER TABLE "CareerMatchEvaluation" ADD CONSTRAINT "CareerMatchEvaluation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CareerTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CareerMatchEvaluation" ADD CONSTRAINT "CareerMatchEvaluation_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CareerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CareerMatchEvaluation" ADD CONSTRAINT "CareerMatchEvaluation_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "CareerOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
