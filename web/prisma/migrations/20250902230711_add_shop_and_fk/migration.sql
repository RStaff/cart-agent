-- AlterTable
ALTER TABLE "public"."Cart" ADD COLUMN     "shopId" TEXT;

-- CreateTable
CREATE TABLE "public"."Shop" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shop_key_key" ON "public"."Shop"("key");

-- CreateIndex
CREATE INDEX "Cart_shopId_idx" ON "public"."Cart"("shopId");

-- AddForeignKey
ALTER TABLE "public"."Cart" ADD CONSTRAINT "Cart_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

