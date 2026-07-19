CREATE TABLE IF NOT EXISTS "public"."DecisionLog" (
    "id" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "packetId" TEXT,
    "cartToken" TEXT,
    "trigger" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "decisionReason" TEXT NOT NULL,
    "interventionType" TEXT NOT NULL,
    "outcome" TEXT NOT NULL DEFAULT 'unknown',
    "decisionTimestamp" TIMESTAMP(3) NOT NULL,
    "outcomeTimestamp" TIMESTAMP(3),
    "cartValueCents" INTEGER,
    "sessionMarker" TEXT,
    "validationMode" BOOLEAN NOT NULL DEFAULT false,
    "relatedEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DecisionLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DecisionLog_shopDomain_decisionTimestamp_idx"
ON "public"."DecisionLog"("shopDomain", "decisionTimestamp");

CREATE INDEX IF NOT EXISTS "DecisionLog_packetId_decisionTimestamp_idx"
ON "public"."DecisionLog"("packetId", "decisionTimestamp");

CREATE INDEX IF NOT EXISTS "DecisionLog_cartToken_decisionTimestamp_idx"
ON "public"."DecisionLog"("cartToken", "decisionTimestamp");

CREATE INDEX IF NOT EXISTS "DecisionLog_relatedEventId_idx"
ON "public"."DecisionLog"("relatedEventId");
