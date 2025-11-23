#!/usr/bin/env bash
set -euo pipefail

echo "=== Abando Phase 3 – Backend Env Template ==="

WEB="$(cd "$(dirname "$0")/.." && pwd)/web"

mkdir -p "$WEB"

cat << 'ENV' > "$WEB/.env"
# === Backend Env for Abando Dev ===

PORT=3000
NODE_ENV=development

# Prisma Local DB (SQLite file in prisma/)
DATABASE_URL="file:./dev.db"

# --- Shopify placeholders (to be replaced before real install) ---
SHOPIFY_API_KEY="dev_key_here"
SHOPIFY_API_SECRET="dev_secret_here"
SCOPES="read_products,write_products"

# Webhook URL placeholders (we'll wire correctly before live)
HOST="http://localhost:3000"
APP_URL="http://localhost:3000"

# Stripe placeholder
STRIPE_WEBHOOK_SECRET="replace_later"
ENV

echo "✅ Created backend env at web/.env"
