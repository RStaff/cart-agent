CREATE TABLE "CareerUser" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "passwordSalt" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CareerUser_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CareerUser_email_key" ON "CareerUser"("email");

CREATE TABLE "CareerTenant" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CareerTenant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CareerTenantMembership" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'OWNER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CareerTenantMembership_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CareerTenantMembership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CareerTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CareerTenantMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CareerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CareerTenantMembership_tenantId_userId_key" ON "CareerTenantMembership"("tenantId", "userId");
CREATE INDEX "CareerTenantMembership_userId_role_idx" ON "CareerTenantMembership"("userId", "role");

CREATE TABLE "CareerProfile" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "headline" TEXT,
  "location" TEXT,
  "careerStage" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CareerProfile_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CareerProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CareerTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CareerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CareerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CareerProfile_tenantId_userId_key" ON "CareerProfile"("tenantId", "userId");
CREATE INDEX "CareerProfile_userId_updatedAt_idx" ON "CareerProfile"("userId", "updatedAt");

CREATE TABLE "CareerSource" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceStatus" TEXT NOT NULL,
  "originalFilename" TEXT,
  "contentReference" TEXT,
  "sourceDigest" TEXT,
  "extractorVersion" TEXT,
  "textContent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CareerSource_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CareerSource_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CareerTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CareerSource_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CareerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CareerSource_tenantId_userId_updatedAt_idx" ON "CareerSource"("tenantId", "userId", "updatedAt");
CREATE INDEX "CareerSource_profileId_createdAt_idx" ON "CareerSource"("profileId", "createdAt");
CREATE INDEX "CareerSource_tenantId_sourceDigest_extractorVersion_idx" ON "CareerSource"("tenantId", "sourceDigest", "extractorVersion");

CREATE TABLE "CareerFactCandidate" (
  "id" TEXT NOT NULL,
  "candidateFactId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "factType" TEXT NOT NULL,
  "statement" TEXT NOT NULL,
  "sourceExcerpt" TEXT NOT NULL,
  "sourceOrder" INTEGER NOT NULL,
  "scopeStatement" TEXT,
  "extractionMethod" TEXT NOT NULL,
  "extractionVersion" TEXT NOT NULL,
  "confidence" TEXT NOT NULL,
  "ambiguity" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PROPOSED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CareerFactCandidate_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CareerFactCandidate_candidateFactId_key" UNIQUE ("candidateFactId"),
  CONSTRAINT "CareerFactCandidate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CareerTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CareerFactCandidate_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CareerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CareerFactCandidate_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "CareerSource"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CareerFactCandidate_sourceId_extractionVersion_sourceOrder_key" UNIQUE ("sourceId", "extractionVersion", "sourceOrder")
);
CREATE INDEX "CareerFactCandidate_tenantId_userId_status_idx" ON "CareerFactCandidate"("tenantId", "userId", "status");

CREATE TABLE "CareerFactReviewDecision" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "candidateFactId" TEXT NOT NULL,
  "decision" TEXT NOT NULL,
  "previousStatement" TEXT,
  "activeStatement" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CareerFactReviewDecision_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CareerFactReviewDecision_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CareerTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CareerFactReviewDecision_candidateFactId_fkey" FOREIGN KEY ("candidateFactId") REFERENCES "CareerFactCandidate"("candidateFactId") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CareerFactReviewDecision_tenantId_candidateFactId_createdAt_idx" ON "CareerFactReviewDecision"("tenantId", "candidateFactId", "createdAt");

CREATE TABLE "CareerFact" (
  "id" TEXT NOT NULL,
  "candidateFactId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "factType" TEXT NOT NULL,
  "statement" TEXT NOT NULL,
  "sourceExcerpt" TEXT NOT NULL,
  "sourceOrder" INTEGER NOT NULL,
  "scopeStatement" TEXT,
  "authorityState" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'CUSTOMER_CONFIRMED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CareerFact_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CareerFact_candidateFactId_key" UNIQUE ("candidateFactId"),
  CONSTRAINT "CareerFact_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CareerTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CareerFact_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CareerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CareerFact_candidateFactId_fkey" FOREIGN KEY ("candidateFactId") REFERENCES "CareerFactCandidate"("candidateFactId") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CareerFact_tenantId_userId_updatedAt_idx" ON "CareerFact"("tenantId", "userId", "updatedAt");
CREATE INDEX "CareerFact_profileId_createdAt_idx" ON "CareerFact"("profileId", "createdAt");

CREATE TABLE "CareerSession" (
  "id" TEXT NOT NULL,
  "tokenDigest" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "CareerSession_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CareerSession_tokenDigest_key" UNIQUE ("tokenDigest"),
  CONSTRAINT "CareerSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CareerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CareerSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CareerTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CareerSession_userId_expiresAt_idx" ON "CareerSession"("userId", "expiresAt");
CREATE INDEX "CareerSession_tenantId_revokedAt_idx" ON "CareerSession"("tenantId", "revokedAt");

CREATE TABLE "CareerOnboardingState" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "stage" TEXT NOT NULL DEFAULT 'PROFILE',
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CareerOnboardingState_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CareerOnboardingState_profileId_key" UNIQUE ("profileId"),
  CONSTRAINT "CareerOnboardingState_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CareerTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CareerOnboardingState_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CareerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CareerOnboardingState_tenantId_stage_idx" ON "CareerOnboardingState"("tenantId", "stage");

CREATE TABLE "CareerAuditEvent" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "requestId" TEXT,
  "entityType" TEXT,
  "entityId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CareerAuditEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CareerAuditEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CareerTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CareerAuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CareerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CareerAuditEvent_tenantId_createdAt_idx" ON "CareerAuditEvent"("tenantId", "createdAt");
CREATE INDEX "CareerAuditEvent_tenantId_eventType_createdAt_idx" ON "CareerAuditEvent"("tenantId", "eventType", "createdAt");

CREATE TABLE "CareerInvite" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "tokenDigest" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CareerInvite_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CareerInvite_tokenDigest_key" UNIQUE ("tokenDigest")
);
CREATE INDEX "CareerInvite_email_expiresAt_idx" ON "CareerInvite"("email", "expiresAt");

CREATE TABLE "CareerRateLimitBucket" (
  "key" TEXT NOT NULL,
  "windowStartedAt" TIMESTAMP(3) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CareerRateLimitBucket_pkey" PRIMARY KEY ("key")
);
CREATE INDEX "CareerRateLimitBucket_updatedAt_idx" ON "CareerRateLimitBucket"("updatedAt");
