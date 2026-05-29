CREATE TABLE "packets" (
  "packet_id" TEXT NOT NULL,
  "store_domain" TEXT NOT NULL,
  "payment_reference" TEXT,
  "status" TEXT NOT NULL DEFAULT 'prepared',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "execution_status" TEXT NOT NULL DEFAULT 'not_started',
  "proof_status" TEXT NOT NULL DEFAULT 'not_started',
  "completion_status" TEXT NOT NULL DEFAULT 'not_started',
  CONSTRAINT "packets_pkey" PRIMARY KEY ("packet_id")
);

CREATE INDEX "packets_store_domain_created_at_idx" ON "packets"("store_domain", "created_at");
CREATE INDEX "packets_payment_reference_idx" ON "packets"("payment_reference");

ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "packetId" TEXT;
ALTER TABLE "SystemEvent" ADD COLUMN IF NOT EXISTS "packetId" TEXT;
ALTER TABLE "DecisionLog" ADD COLUMN IF NOT EXISTS "packetId" TEXT;

CREATE INDEX IF NOT EXISTS "Job_packetId_createdAt_idx" ON "Job"("packetId", "createdAt");
CREATE INDEX IF NOT EXISTS "SystemEvent_packetId_createdAt_idx" ON "SystemEvent"("packetId", "createdAt");
CREATE INDEX IF NOT EXISTS "DecisionLog_packetId_decisionTimestamp_idx" ON "DecisionLog"("packetId", "decisionTimestamp");
