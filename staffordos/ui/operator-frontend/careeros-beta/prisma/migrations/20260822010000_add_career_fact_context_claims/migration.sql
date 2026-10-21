CREATE TABLE IF NOT EXISTS "CareerFactContextClaim" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "careerFactId" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "dimension" TEXT NOT NULL,
  "displayValue" TEXT NOT NULL,
  "normalizedValue" TEXT NOT NULL,
  "authorityState" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "extractionVersion" TEXT NOT NULL,
  "sourceAnchor" JSONB NOT NULL,
  "supersedesClaimId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CareerFactContextClaim_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CareerFactContextClaim_fact_dimension_value_version_key"
  ON "CareerFactContextClaim"("careerFactId", "dimension", "normalizedValue", "extractionVersion");
CREATE INDEX IF NOT EXISTS "CareerFactContextClaim_tenant_user_profile_status_idx"
  ON "CareerFactContextClaim"("tenantId", "userId", "profileId", "status");
CREATE INDEX IF NOT EXISTS "CareerFactContextClaim_fact_status_idx"
  ON "CareerFactContextClaim"("careerFactId", "status");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CareerFactContextClaim_tenantId_fkey') THEN
    ALTER TABLE "CareerFactContextClaim" ADD CONSTRAINT "CareerFactContextClaim_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CareerTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CareerFactContextClaim_userId_fkey') THEN
    ALTER TABLE "CareerFactContextClaim" ADD CONSTRAINT "CareerFactContextClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CareerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CareerFactContextClaim_profileId_fkey') THEN
    ALTER TABLE "CareerFactContextClaim" ADD CONSTRAINT "CareerFactContextClaim_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CareerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CareerFactContextClaim_careerFactId_fkey') THEN
    ALTER TABLE "CareerFactContextClaim" ADD CONSTRAINT "CareerFactContextClaim_careerFactId_fkey" FOREIGN KEY ("careerFactId") REFERENCES "CareerFact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
