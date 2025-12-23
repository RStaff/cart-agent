-- CreateTable
CREATE TABLE "public"."AbandoWebhookEvent" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "apiVersion" TEXT,
    "bytes" INTEGER NOT NULL DEFAULT 0,
    "hmacOk" BOOLEAN NOT NULL DEFAULT false,
    "headers" JSONB NOT NULL,
    "query" JSONB,
    "bodyJson" JSONB,
    "bodyText" TEXT,
    "rawBody" BYTEA,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbandoWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AbandoWebhookEvent_shop_receivedAt_idx" ON "public"."AbandoWebhookEvent"("shop", "receivedAt");

-- CreateIndex
CREATE INDEX "AbandoWebhookEvent_topic_receivedAt_idx" ON "public"."AbandoWebhookEvent"("topic", "receivedAt");
