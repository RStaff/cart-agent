#!/usr/bin/env bash
set -euo pipefail

LOG="/tmp/abando_shopify_dev.log"

test -f "$LOG" || { echo "❌ Missing $LOG. Start 'shopify app dev' first."; exit 1; }

APP_PORT="$(grep -Eo '\[server\] listening on :[0-9]+' "$LOG" | tail -n 1 | grep -Eo '[0-9]+' || true)"
test -n "${APP_PORT:-}" || { echo "❌ Could not parse APP_PORT from $LOG"; exit 1; }

echo "== Starting direct cloudflared tunnel to APP_PORT=$APP_PORT =="
pkill -f "cloudflared tunnel --url http://localhost:" || true

: > /tmp/abando_cloudflared.log

# Start in background
( cloudflared tunnel --url "http://localhost:${APP_PORT}" 2>&1 | tee /tmp/abando_cloudflared.log ) &
echo $! > /tmp/abando_cloudflared.pid

echo "✅ cloudflared PID: $(cat /tmp/abando_cloudflared.pid)"
echo "   Log: /tmp/abando_cloudflared.log"

echo
echo "== Waiting for trycloudflare URL =="
for i in {1..60}; do
  URL="$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/abando_cloudflared.log | tail -n 1 || true)"
  if [[ -n "${URL:-}" ]]; then
    echo "✅ TUNNEL_URL=$URL"
    echo "$URL" > /tmp/abando_direct_tunnel_url.txt
    exit 0
  fi
  sleep 1
done

echo "❌ Timed out waiting for tunnel URL. Check:"
echo "tail -n 120 /tmp/abando_cloudflared.log"
exit 1
