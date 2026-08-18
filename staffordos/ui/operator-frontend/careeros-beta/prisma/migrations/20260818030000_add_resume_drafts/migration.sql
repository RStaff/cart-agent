CREATE TABLE "CareerResumeDraft" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "evaluationVersion" TEXT NOT NULL,
  "authorityVersion" INTEGER NOT NULL DEFAULT 1,
  "draftVersion" INTEGER NOT NULL DEFAULT 1,
  "content" JSONB NOT NULL,
  "stale" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CareerResumeDraft_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CareerResumeDraft_tenantId_userId_opportunityId_createdAt_idx" ON "CareerResumeDraft"("tenantId", "userId", "opportunityId", "createdAt");
ALTER TABLE "CareerResumeDraft" ADD CONSTRAINT "CareerResumeDraft_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CareerTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CareerResumeDraft" ADD CONSTRAINT "CareerResumeDraft_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CareerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CareerResumeDraft" ADD CONSTRAINT "CareerResumeDraft_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "CareerOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
