#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

NEXT_LOG="/tmp/abando_next.log"
SHOPIFY_LOG="/tmp/abando_shopify_dev.log"
NEXT_PID="/tmp/abando_next.pid"
SHOPIFY_PID="/tmp/abando_shopify.pid"

NEXT_PORT="${NEXT_PORT:-3000}"
WEB_PORT="${WEB_PORT:-8081}"   # FIXED web-backend port
GRAPHIQL_PORT="${GRAPHIQL_PORT:-3457}"

kill_port () {
  local p="$1"
  local pids
  pids="$(lsof -tiTCP:"$p" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "${pids:-}" ]; then
    echo "Killing listeners on :$p -> $pids"
    kill $pids 2>/dev/null || true
    sleep 0.5
    kill -9 $pids 2>/dev/null || true
  fi
}

echo "== Abando Dev Up (v2 fixed ports) =="
echo "Repo: $ROOT"
echo

echo ">> Clean up old processes"
pkill -f cloudflared 2>/dev/null || true
rm -f "$NEXT_PID" "$SHOPIFY_PID" "$NEXT_LOG" "$SHOPIFY_LOG" || true

kill_port "$NEXT_PORT"
kill_port "$WEB_PORT"
kill_port "$GRAPHIQL_PORT"

echo ">> Start Next.js (abando-frontend) on :$NEXT_PORT"
(
  cd "$ROOT/abando-frontend"
  PORT="$NEXT_PORT" npm run dev
) >"$NEXT_LOG" 2>&1 &
echo $! >"$NEXT_PID"
echo "Next PID: $(cat "$NEXT_PID")"

echo "Waiting for http://localhost:$NEXT_PORT/embedded to return 200..."
for i in {1..60}; do
  code="$(curl -sS -o /dev/null -w '%{http_code}' "http://localhost:$NEXT_PORT/embedded" || true)"
  if [ "$code" = "200" ]; then
    echo "✅ Next is ready."
    break
  fi
  sleep 0.5
done

echo
echo ">> Start Shopify dev (ABANDO_DEV_PROXY=1) with FIXED WEB port :$WEB_PORT"
# IMPORTANT: we set PORT=$WEB_PORT and also tell CLI to tunnel that port.
(
  export ABANDO_DEV_PROXY=1
  export PORT="$WEB_PORT"
  shopify app dev --reset --localhost-port "$WEB_PORT"
) >"$SHOPIFY_LOG" 2>&1 &
echo $! >"$SHOPIFY_PID"
echo "Shopify PID: $(cat "$SHOPIFY_PID")"

echo
echo "Waiting for Shopify to print a trycloudflare URL..."
for i in {1..120}; do
  url="$(grep -Eo 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$SHOPIFY_LOG" | tail -n 1 || true)"
  if [ -n "${url:-}" ]; then
    echo "✅ Tunnel URL: $url"
    echo
    echo "Smoke tests:"
    echo "  curl -sS -D- \"http://localhost:$WEB_PORT/embedded?embedded=1\" -o /dev/null | sed -n '1,12p'"
    echo "  curl -sS -D- \"$url/embedded?embedded=1\" -o /dev/null | sed -n '1,12p'"
    echo
    echo "Logs:"
    echo "  tail -f $NEXT_LOG"
    echo "  tail -f $SHOPIFY_LOG"
    exit 0
  fi
  sleep 0.5
done

echo "❌ Timed out waiting for trycloudflare URL. Check: tail -n 120 $SHOPIFY_LOG"
exit 1
