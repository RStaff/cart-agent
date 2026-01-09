-- dedupe (keep the newest per (cartId,status)) before adding unique
WITH ranked AS (
  SELECT id, "cartId", status, "createdAt",
         ROW_NUMBER() OVER (
           PARTITION BY "cartId", status
           ORDER BY "createdAt" DESC, id DESC
         ) rn
  FROM "public"."EmailQueue"
)
DELETE FROM "public"."EmailQueue" e
USING ranked r
WHERE e.id=r.id AND r.rn>1;

-- add the unique constraint
ALTER TABLE "public"."EmailQueue"
  ADD CONSTRAINT "EmailQueue_cartId_status_key"
  UNIQUE ("cartId","status");
