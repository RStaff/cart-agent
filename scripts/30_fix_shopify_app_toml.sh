#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FILE="$ROOT/shopify.app.toml"

if [ ! -f "$FILE" ]; then
  echo "❌ shopify.app.toml not found at $FILE"
  exit 1
fi

TS="$(date +%Y%m%d_%H%M%S)"
cp "$FILE" "$FILE.bak_$TS"
echo "🧷 Backup created: $FILE.bak_$TS"

cat << 'TOML' > "$FILE"
# Learn more about configuring your app at https://shopify.dev/docs/apps/tools/cli/configuration

client_id = "83114672506075ba4866194fe0160cde"
name = "cart-agent"
handle = "cart-agent-1"

# Production embedded entrypoint
application_url = "https://www.abando.ai/embedded"
embedded = true

[build]
automatically_update_urls_on_dev = true

# EXPLICIT frontend entrypoint — THIS FIXES THE 500
[web]
frontend = "embedded"

[webhooks]
api_version = "2025-07"

  [[webhooks.subscriptions]]
  uri = "https://auburn-nat-usb-technician.trycloudflare.com/api/webhooks/gdpr"
  compliance_topics = [
    "customers/data_request",
    "customers/redact",
    "shop/redact"
  ]

[access_scopes]
scopes = "write_products"
optional_scopes = []
use_legacy_install_flow = false

[auth]
redirect_urls = [
  "https://www.abando.ai/shopify/callback",
  "https://www.abando.ai/api/auth/callback"
]

[pos]
embedded = false
TOML

echo "✅ shopify.app.toml rewritten cleanly"
