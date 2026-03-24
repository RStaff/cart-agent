-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('queued', 'running', 'succeeded', 'failed', 'dead');

-- CreateEnum
CREATE TYPE "public"."EventVisibility" AS ENUM ('system', 'merchant');

-- CreateTable
CREATE TABLE "public"."Job" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "public"."JobStatus" NOT NULL DEFAULT 'queued',
    "payload" JSONB NOT NULL,
    "result" JSONB,
    "errorKind" TEXT,
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SystemEvent" (
    "id" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "visibility" "public"."EventVisibility" NOT NULL DEFAULT 'system',
    "relatedJobId" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Job_idempotencyKey_key" ON "public"."Job"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Job_status_runAt_idx" ON "public"."Job"("status", "runAt");

-- CreateIndex
CREATE INDEX "Job_type_status_runAt_idx" ON "public"."Job"("type", "status", "runAt");

-- CreateIndex
CREATE INDEX "Job_shopDomain_createdAt_idx" ON "public"."Job"("shopDomain", "createdAt");

-- CreateIndex
CREATE INDEX "SystemEvent_shopDomain_createdAt_idx" ON "public"."SystemEvent"("shopDomain", "createdAt");

-- CreateIndex
CREATE INDEX "SystemEvent_eventType_createdAt_idx" ON "public"."SystemEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "SystemEvent_relatedJobId_createdAt_idx" ON "public"."SystemEvent"("relatedJobId", "createdAt");

