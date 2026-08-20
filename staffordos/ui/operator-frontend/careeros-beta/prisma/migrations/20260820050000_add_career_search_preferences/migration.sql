CREATE TABLE IF NOT EXISTS "CareerSearchPreference" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "keywords" TEXT NOT NULL DEFAULT '',
  "location" TEXT NOT NULL DEFAULT '',
  "remotePreference" TEXT NOT NULL DEFAULT 'any',
  "postedWithinDays" INTEGER,
  "salaryMin" INTEGER,
  "resultLimit" INTEGER NOT NULL DEFAULT 10,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CareerSearchPreference_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CareerSearchPreference_tenantId_userId_key" ON "CareerSearchPreference"("tenantId", "userId");
CREATE INDEX IF NOT EXISTS "CareerSearchPreference_tenantId_userId_active_idx" ON "CareerSearchPreference"("tenantId", "userId", "active");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CareerSearchPreference_tenantId_fkey') THEN
    ALTER TABLE "CareerSearchPreference" ADD CONSTRAINT "CareerSearchPreference_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CareerTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CareerSearchPreference_userId_fkey') THEN
    ALTER TABLE "CareerSearchPreference" ADD CONSTRAINT "CareerSearchPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CareerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
