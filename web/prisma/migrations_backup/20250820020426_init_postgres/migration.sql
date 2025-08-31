-- CreateTable
CREATE TABLE "public"."AbandonedCart" (
    "id" SERIAL NOT NULL,
    "checkoutId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "lineItems" JSONB NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbandonedCart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AbandonedCart_checkoutId_key" ON "public"."AbandonedCart"("checkoutId");
