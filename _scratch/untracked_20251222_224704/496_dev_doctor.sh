#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

echo "🩺 Abando Dev Doctor"

echo
echo "=== LISTENERS (relevant) ==="
# Only show what Shopify dev actually uses; exclude macOS rapportd noise
lsof -nP -iTCP -sTCP:LISTEN \
  | egrep ":(3000|3001|3457|5[2-9][0-9]{3})\b" \
  | egrep -v "^rapportd" \
  || echo "✅ none"

echo
echo "=== DEV PROCESSES (shopify/nodemon/start/cloudflared) ==="
ps aux | egrep "shopify app dev|cloudflared.*trycloudflare|nodemon start\.mjs|node start\.mjs" | egrep -v egrep || echo "✅ none"

echo
echo "=== PORT 3000 OWNER ==="
p3000="$(lsof -nP -tiTCP:3000 -sTCP:LISTEN 2>/dev/null || true)"
if [ -z "$p3000" ]; then
  echo "⚠️ Nothing is listening on :3000"
else
  ps -fp "$p3000" || true
fi

echo
echo "=== DUPLICATE SHOPIFY DEV SESSIONS CHECK ==="
# Count distinct "shopify app dev" process groups by start time + tty.
# It's normal to see 2 node lines for one session; we treat duplicates as >2.
shopify_lines="$(ps aux | egrep "shopify app dev --reset|shopify app dev$|shopify app dev " | egrep -v egrep || true)"
shopify_count="$(echo "$shopify_lines" | sed '/^\s*$/d' | wc -l | tr -d ' ')"

if [ "$shopify_count" -le 2 ]; then
  echo "✅ Looks like a single Shopify dev session (wrapper + worker)."
  exit 0
fi

echo "⚠️ Detected more than one dev session worth of Shopify processes ($shopify_count lines)."
echo "🧨 Safely stopping ALL shopify dev + cloudflared, then freeing :3000."
echo
pkill -f "shopify app dev" 2>/dev/null || true
pkill -f "cloudflared.*trycloudflare" 2>/dev/null || true

# Give processes a moment to exit
sleep 1

p3000="$(lsof -nP -tiTCP:3000 -sTCP:LISTEN 2>/dev/null || true)"
if [ -n "$p3000" ]; then
  echo "⚠️ :3000 still held by PID(s): $p3000"
  for pid in $p3000; do
    ps -fp "$pid" || true
    kill -9 "$pid" 2>/dev/null || true
  done
else
  echo "✅ :3000 is free"
fi

echo
echo "✅ Now start fresh in ONE terminal:"
echo "   shopify app dev --reset"
