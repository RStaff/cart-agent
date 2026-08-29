-- CreateTable
CREATE TABLE "public"."StaffordosOperator" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "externalSubject" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "normalizedEmail" TEXT NOT NULL,
    "displayName" TEXT,
    "identityProvider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "disabledAt" TIMESTAMP(3),
    "disabledReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffordosOperator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StaffordosOperatorRole" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'shopifixer',
    "activeKey" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedByOperatorId" TEXT,
    "grantSource" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedByOperatorId" TEXT,
    "revocationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffordosOperatorRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StaffordosOperatorSession" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sessionFingerprint" TEXT NOT NULL,
    "identityProvider" TEXT NOT NULL,
    "externalSubject" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "authenticatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokedByOperatorId" TEXT,
    "revocationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffordosOperatorSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StaffordosOperatorEvent" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT,
    "actorOperatorId" TEXT,
    "eventType" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'internal',
    "source" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "permission" TEXT,
    "reasonCode" TEXT,
    "sessionFingerprint" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffordosOperatorEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffordosOperator_operatorId_key" ON "public"."StaffordosOperator"("operatorId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffordosOperator_identityProvider_externalSubject_key" ON "public"."StaffordosOperator"("identityProvider", "externalSubject");

-- CreateIndex
CREATE UNIQUE INDEX "StaffordosOperator_identityProvider_normalizedEmail_key" ON "public"."StaffordosOperator"("identityProvider", "normalizedEmail");

-- CreateIndex
CREATE INDEX "StaffordosOperator_normalizedEmail_idx" ON "public"."StaffordosOperator"("normalizedEmail");

-- CreateIndex
CREATE INDEX "StaffordosOperator_status_updatedAt_idx" ON "public"."StaffordosOperator"("status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StaffordosOperatorRole_activeKey_key" ON "public"."StaffordosOperatorRole"("activeKey");

-- CreateIndex
CREATE INDEX "StaffordosOperatorRole_operatorId_grantedAt_idx" ON "public"."StaffordosOperatorRole"("operatorId", "grantedAt");

-- CreateIndex
CREATE INDEX "StaffordosOperatorRole_role_scope_idx" ON "public"."StaffordosOperatorRole"("role", "scope");

-- CreateIndex
CREATE INDEX "StaffordosOperatorRole_activeKey_idx" ON "public"."StaffordosOperatorRole"("activeKey");

-- CreateIndex
CREATE INDEX "StaffordosOperatorRole_revokedAt_idx" ON "public"."StaffordosOperatorRole"("revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StaffordosOperatorSession_sessionId_key" ON "public"."StaffordosOperatorSession"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffordosOperatorSession_sessionFingerprint_key" ON "public"."StaffordosOperatorSession"("sessionFingerprint");

-- CreateIndex
CREATE INDEX "StaffordosOperatorSession_operatorId_authenticatedAt_idx" ON "public"."StaffordosOperatorSession"("operatorId", "authenticatedAt");

-- CreateIndex
CREATE INDEX "StaffordosOperatorSession_expiresAt_idx" ON "public"."StaffordosOperatorSession"("expiresAt");

-- CreateIndex
CREATE INDEX "StaffordosOperatorSession_revokedAt_idx" ON "public"."StaffordosOperatorSession"("revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StaffordosOperatorEvent_idempotencyKey_key" ON "public"."StaffordosOperatorEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "StaffordosOperatorEvent_operatorId_createdAt_idx" ON "public"."StaffordosOperatorEvent"("operatorId", "createdAt");

-- CreateIndex
CREATE INDEX "StaffordosOperatorEvent_actorOperatorId_createdAt_idx" ON "public"."StaffordosOperatorEvent"("actorOperatorId", "createdAt");

-- CreateIndex
CREATE INDEX "StaffordosOperatorEvent_eventType_createdAt_idx" ON "public"."StaffordosOperatorEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "StaffordosOperatorEvent_permission_createdAt_idx" ON "public"."StaffordosOperatorEvent"("permission", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."StaffordosOperatorRole" ADD CONSTRAINT "StaffordosOperatorRole_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "public"."StaffordosOperator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StaffordosOperatorSession" ADD CONSTRAINT "StaffordosOperatorSession_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "public"."StaffordosOperator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StaffordosOperatorEvent" ADD CONSTRAINT "StaffordosOperatorEvent_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "public"."StaffordosOperator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StaffordosOperatorEvent" ADD CONSTRAINT "StaffordosOperatorEvent_actorOperatorId_fkey" FOREIGN KEY ("actorOperatorId") REFERENCES "public"."StaffordosOperator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
