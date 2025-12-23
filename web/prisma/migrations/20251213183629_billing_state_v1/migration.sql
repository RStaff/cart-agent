-- CreateTable
CREATE TABLE "public"."BillingState" (
    "id" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "planKey" TEXT NOT NULL DEFAULT 'free',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'stub',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingState_shopDomain_key" ON "public"."BillingState"("shopDomain");

-- CreateIndex
CREATE INDEX "BillingState_shopDomain_idx" ON "public"."BillingState"("shopDomain");
