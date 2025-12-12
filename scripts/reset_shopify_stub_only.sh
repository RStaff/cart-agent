#!/usr/bin/env bash
set -euo pipefail

echo "📦 Resetting web/shopify.js to minimal stub (no Shopify SDK, no SQLite)..."

cat > web/shopify.js << 'FILEEOF'
// Minimal Shopify stub so imports don't crash in dev.
// We'll wire real Shopify helpers later when billing is ready.

const APP_URL = process.env.SHOPIFY_APP_URL ?? "https://abando.dev";

const shopify = {
  config: {
    appUrl: APP_URL,
  },
};

export default shopify;
FILEEOF

echo "✅ web/shopify.js reset to minimal stub."
