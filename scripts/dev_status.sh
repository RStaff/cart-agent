#!/usr/bin/env bash
set -euo pipefail

NEXT_LOG="/tmp/abando_next.log"
SHOPIFY_LOG="/tmp/abando_shopify_dev.log"
NEXT_PID="/tmp/abando_next.pid"
SHOPIFY_PID="/tmp/abando_shopify.pid"

echo "== Abando Dev Status =="
echo

echo "-- PIDs --"
[ -f "$NEXT_PID" ] && echo "Next PID:    $(cat "$NEXT_PID")" || echo "Next PID:    (none)"
[ -f "$SHOPIFY_PID" ] && echo "Shopify PID: $(cat "$SHOPIFY_PID")" || echo "Shopify PID: (none)"
echo

echo "-- Listeners (3000/3457 + Shopify dynamic ports) --"
lsof -nP -iTCP -sTCP:LISTEN | egrep ':3000|:3457|trycloudflare|:62[0-9]{3}|:64[0-9]{3}' || true
echo

echo "-- Health checks --"
echo -n "http://localhost:3000/embedded -> "
curl -sS -o /dev/null -w "%{http_code}\n" "http://localhost:3000/embedded" || echo "ERR"
echo

echo "-- Shopify tunnel URL (from log) --"
grep -E 'Using URL:\s+https://.*trycloudflare\.com' -m 1 "$SHOPIFY_LOG" || echo "(not found yet)"
echo

echo "-- Tail Next log --"
tail -n 20 "$NEXT_LOG" 2>/dev/null || echo "(no next log)"
echo

echo "-- Tail Shopify log --"
tail -n 30 "$SHOPIFY_LOG" 2>/dev/null || echo "(no shopify log)"
