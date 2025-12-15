#!/usr/bin/env bash
set -euo pipefail

if [ -f .env.local ]; then
  echo "✅ .env.local already exists (not overwriting)"
  exit 0
fi

cat << 'EOR' > .env.local
# Abando Frontend - Local Defaults
# Adjust later if needed, but this seeds a usable baseline.

# Billing mode: stub | shopify
NEXT_PUBLIC_BILLING_MODE=stub

# Backend base (set when cart-agent API is live)
NEXT_PUBLIC_CART_AGENT_API_BASE=http://localhost:3001

# Demo placeholders so /status looks “real” immediately
NEXT_PUBLIC_DEMO_RECOVERED_REVENUE=$0
NEXT_PUBLIC_DEMO_ABANDONED_CARTS=0
EOR

echo "✅ Created .env.local (safe defaults)"
