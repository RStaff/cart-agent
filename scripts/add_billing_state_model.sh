#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

SCHEMA="$(find . -maxdepth 6 -type f -name schema.prisma \
  -not -path '*/node_modules/*' -not -path '*/.next/*' -not -path '*/dist/*' \
  | head -n 1)"

if [ -z "${SCHEMA:-}" ]; then
  echo "❌ Could not find schema.prisma"
  exit 1
fi

echo "✅ Using schema: $SCHEMA"
cp "$SCHEMA" "$SCHEMA.bak_$(date +%s)"

if grep -qE 'model\s+BillingState\s*{' "$SCHEMA"; then
  echo "✅ BillingState model already exists. No changes."
  exit 0
fi

cat >> "$SCHEMA" <<'PRISMA'

model BillingState {
  id        String   @id @default(cuid())
  shopDomain String  @unique
  planKey   String   @default("free") // free|starter|growth|pro
  active    Boolean  @default(false)
  source    String   @default("stub") // stub|shopify
  updatedAt DateTime @updatedAt
  createdAt DateTime @default(now())

  @@index([shopDomain])
}
PRISMA

echo "✅ Appended BillingState model"

echo ""
echo "NEXT:"
echo "  cd web"
echo "  npx prisma migrate dev --name billing_state_v1"
