-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."AbandonedCart" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "customerEmail" TEXT,
    "total" DECIMAL(10,2),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "channel" TEXT,
    "itemsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbandonedCart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2),
    "subtotal" DECIMAL(10,2),
    "data" JSONB,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MessageLog" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GeneratedCopy" (
    "id" TEXT NOT NULL,
    "cartId" TEXT,
    "variant" TEXT,
    "prompt" JSONB,
    "output" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedCopy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MerchantConfig" (
    "id" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "emailProvider" TEXT,
    "fromEmail" TEXT,
    "smsProvider" TEXT,
    "whatsappProv" TEXT,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AbandonedCart_cartId_key" ON "public"."AbandonedCart"("cartId");

-- CreateIndex
CREATE INDEX "AbandonedCart_shopDomain_idx" ON "public"."AbandonedCart"("shopDomain");

-- CreateIndex
CREATE INDEX "CartItem_cartId_idx" ON "public"."CartItem"("cartId");

-- CreateIndex
CREATE INDEX "MessageLog_cartId_idx" ON "public"."MessageLog"("cartId");

-- CreateIndex
CREATE INDEX "MessageLog_channel_status_idx" ON "public"."MessageLog"("channel", "status");

-- CreateIndex
CREATE INDEX "GeneratedCopy_cartId_idx" ON "public"."GeneratedCopy"("cartId");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantConfig_shopDomain_key" ON "public"."MerchantConfig"("shopDomain");

-- AddForeignKey
ALTER TABLE "public"."CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "public"."AbandonedCart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageLog" ADD CONSTRAINT "MessageLog_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "public"."AbandonedCart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeneratedCopy" ADD CONSTRAINT "GeneratedCopy_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "public"."AbandonedCart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

