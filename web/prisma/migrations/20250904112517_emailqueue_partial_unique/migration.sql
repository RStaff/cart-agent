DO $$ BEGIN
  ALTER TABLE "public"."EmailQueue" DROP CONSTRAINT IF EXISTS "EmailQueue_cartId_status_key";
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "EmailQueue_cartId_queued_unique"
ON "public"."EmailQueue"("cartId")
WHERE status = 'queued';
