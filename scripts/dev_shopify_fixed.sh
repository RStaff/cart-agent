#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-64987}"

echo "== cart-agent: pinned dev port = $PORT =="
echo

# Ensure we don't have a stray manual tunnel
pkill -f "cloudflared tunnel --url http://localhost:" >/dev/null 2>&1 || true

echo "== Node/Shopify CLI info =="
command -v node >/dev/null && node -v || true
command -v shopify >/dev/null && shopify version || { echo "❌ shopify CLI not found in PATH"; exit 1; }
echo

echo "== Starting Shopify dev (CLI-managed Cloudflare tunnel) =="
echo "Tip: if it ever gets weird, run: shopify app dev --reset --localhost-port $PORT"
echo

exec shopify app dev --localhost-port "$PORT"
