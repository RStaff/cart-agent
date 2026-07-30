-- AlterTable
ALTER TABLE "public"."ShopifixerPacketLink" ADD COLUMN "repairScopeId" TEXT;
ALTER TABLE "public"."ShopifixerPacketLink" ADD COLUMN "repairApprovalId" TEXT;
ALTER TABLE "public"."ShopifixerPacketLink" ADD COLUMN "authorityFingerprint" TEXT;
ALTER TABLE "public"."ShopifixerPacketLink" ADD COLUMN "authorityVersion" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ShopifixerPacketLink_authorityFingerprint_key" ON "public"."ShopifixerPacketLink"("authorityFingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifixerPacketLink_repairScopeId_repairApprovalId_purpose_key" ON "public"."ShopifixerPacketLink"("repairScopeId", "repairApprovalId", "purpose");

-- CreateIndex
CREATE INDEX "ShopifixerPacketLink_repairScopeId_createdAt_idx" ON "public"."ShopifixerPacketLink"("repairScopeId", "createdAt");

-- CreateIndex
CREATE INDEX "ShopifixerPacketLink_repairApprovalId_createdAt_idx" ON "public"."ShopifixerPacketLink"("repairApprovalId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."ShopifixerPacketLink" ADD CONSTRAINT "ShopifixerPacketLink_repairScopeId_fkey" FOREIGN KEY ("repairScopeId") REFERENCES "public"."ShopifixerRepairScope"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShopifixerPacketLink" ADD CONSTRAINT "ShopifixerPacketLink_repairApprovalId_fkey" FOREIGN KEY ("repairApprovalId") REFERENCES "public"."ShopifixerRepairApproval"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
