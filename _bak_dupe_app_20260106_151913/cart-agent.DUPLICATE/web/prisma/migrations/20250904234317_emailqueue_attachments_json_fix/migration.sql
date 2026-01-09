ALTER TABLE "public"."EmailQueue"
  ADD COLUMN IF NOT EXISTS "attachments" JSONB;
-- Safety: Cart should not have attachments
ALTER TABLE "public"."Cart"
  DROP COLUMN IF EXISTS "attachments";
