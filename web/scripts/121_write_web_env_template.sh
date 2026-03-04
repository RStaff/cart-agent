#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

TS="$(date +%Y%m%d_%H%M%S)"
if [ -f .env ]; then
  cp -v .env ".env.bak_${TS}"
fi

cat > .env <<'EOF'
# === Shopify OAuth (required) ===
SHOPIFY_API_KEY=__REPLACE_ME__
SHOPIFY_API_SECRET=__REPLACE_ME__

# Comma-separated scopes (optional but recommended)
SHOPIFY_SCOPES=read_checkouts,read_orders,write_checkouts,read_script_tags,write_script_tags

# Public base URL of THIS server in the environment you're running
# For local dev, set to your tunnel URL (https://xxxx.trycloudflare.com) or https://<ngrok>/ etc.
# For prod, set to https://pay.abando.ai
APP_URL=https://pay.abando.ai

# === Prisma / DB (if needed by runtime) ===
# DATABASE_URL=postgresql://user:pass@host:5432/db?schema=public
EOF

echo "✓ wrote web/.env"

echo ""
echo "=== show keys (redacted) ==="
sed -E 's/(=).*/\1…/' .env
