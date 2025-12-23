#!/usr/bin/env bash
set -euo pipefail

LOG=".shopify_dev.log"
test -f "$LOG" || { echo "❌ $LOG not found. Run: shopify app dev --reset  (without tee)"; exit 1; }

TUNNEL="$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG" | tail -n 1 || true)"
BACKEND_PORT="$(grep -Eo 'listening on http://0\.0\.0\.0:[0-9]+' "$LOG" | tail -n 1 | grep -Eo '[0-9]+$' || true)"

echo "✅ TUNNEL=$TUNNEL"
echo "✅ BACKEND_PORT=$BACKEND_PORT"
echo

test -n "$TUNNEL" || { echo "❌ No tunnel found in $LOG"; exit 1; }
test -n "$BACKEND_PORT" || { echo "❌ No backend port found in $LOG"; exit 1; }

echo "=== Backend direct (expect 401 missing hmac) ==="
curl -sS -i "http://127.0.0.1:${BACKEND_PORT}/api/webhooks" -X POST -H "Content-Type: application/json" -d '{}' | sed -n '1,20p'
echo

echo "=== Tunnel (MUST match backend; should be 401, NOT 'Invalid path') ==="
curl -sS -i "${TUNNEL}/api/webhooks" -X POST -H "Content-Type: application/json" -d '{}' | sed -n '1,20p'
echo

echo "✅ Done."
