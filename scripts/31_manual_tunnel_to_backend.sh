#!/usr/bin/env bash
set -euo pipefail

BACKEND_PORT="${1:-64987}"

echo "== Checking backend =="
curl -sS -i "http://localhost:${BACKEND_PORT}/embedded?embedded=1" | sed -n '1,15p'
echo

# Use the cloudflared binary Shopify CLI already has
CLOUDFLARED="$(npm root -g)/@shopify/cli/bin/cloudflared"
test -x "$CLOUDFLARED" || { echo "❌ cloudflared not found at: $CLOUDFLARED"; exit 1; }

echo "== Starting manual tunnel to backend on :${BACKEND_PORT} =="
echo "Press Ctrl+C to stop."
"$CLOUDFLARED" tunnel --url "http://localhost:${BACKEND_PORT}" --no-autoupdate
