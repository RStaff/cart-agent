ALTER TABLE "public"."EmailQueue"
  ADD COLUMN IF NOT EXISTS "attachments" JSONB;
