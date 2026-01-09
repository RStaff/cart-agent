-- DropForeignKey
ALTER TABLE "public"."CartItem" DROP CONSTRAINT "CartItem_cartId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GeneratedCopy" DROP CONSTRAINT "GeneratedCopy_cartId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MessageLog" DROP CONSTRAINT "MessageLog_cartId_fkey";

-- DropTable
DROP TABLE "public"."AbandonedCart";

-- DropTable
DROP TABLE "public"."CartItem";

-- DropTable
DROP TABLE "public"."GeneratedCopy";

-- DropTable
DROP TABLE "public"."MerchantConfig";

-- DropTable
DROP TABLE "public"."MessageLog";

-- CreateTable
CREATE TABLE "public"."Cart" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'abandoned',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cart_cartId_key" ON "public"."Cart"("cartId");

