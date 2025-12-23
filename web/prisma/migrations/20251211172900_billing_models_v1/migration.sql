-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubStatus" TEXT,
    "freeCredits" INTEGER NOT NULL DEFAULT 20,
    "creditsResetAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailyAggregate" (
    "id" SERIAL NOT NULL,
    "storeId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "cartsCreated" INTEGER NOT NULL DEFAULT 0,
    "cartsAbandoned" INTEGER NOT NULL DEFAULT 0,
    "cartsRecovered" INTEGER NOT NULL DEFAULT 0,
    "recoveryAttemptsSent" INTEGER NOT NULL DEFAULT 0,
    "recoveryClicks" INTEGER NOT NULL DEFAULT 0,
    "recoveriesCount" INTEGER NOT NULL DEFAULT 0,
    "potentialRevenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "revenueRecovered" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "abandonmentRate" DECIMAL(65,30),
    "recoveryRate" DECIMAL(65,30),
    "clickThroughRate" DECIMAL(65,30),
    "conversionRate" DECIMAL(65,30),
    "avgCartValue" DECIMAL(65,30),
    "avgTimeToRecoveryHours" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyAggregate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShopifyPlan" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "interval" TEXT NOT NULL DEFAULT 'EVERY_30_DAYS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopifyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShopifySubscription" (
    "id" SERIAL NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "shopifyChargeId" TEXT NOT NULL,
    "planId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "trialEndsAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopifySubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "public"."User"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "DailyAggregate_storeId_date_idx" ON "public"."DailyAggregate"("storeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyAggregate_storeId_date_key" ON "public"."DailyAggregate"("storeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyPlan_key_key" ON "public"."ShopifyPlan"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifySubscription_shopifyChargeId_key" ON "public"."ShopifySubscription"("shopifyChargeId");

-- AddForeignKey
ALTER TABLE "public"."Usage" ADD CONSTRAINT "Usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShopifySubscription" ADD CONSTRAINT "ShopifySubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."ShopifyPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
