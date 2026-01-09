#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

NEXT_LOG="/tmp/abando_next.log"
SHOPIFY_LOG="/tmp/abando_shopify_dev.log"
NEXT_PID="/tmp/abando_next.pid"
SHOPIFY_PID="/tmp/abando_shopify.pid"

echo "== Abando Dev Up =="
echo "Repo: $ROOT"
echo

# --- helpers ---
kill_pidfile() {
  local f="$1"
  if [ -f "$f" ]; then
    local pid
    pid="$(cat "$f" 2>/dev/null || true)"
    if [ -n "${pid:-}" ] && kill -0 "$pid" 2>/dev/null; then
      echo "Stopping PID $pid from $f"
      kill "$pid" 2>/dev/null || true
      sleep 0.5
      kill -9 "$pid" 2>/dev/null || true
    fi
    rm -f "$f"
  fi
}

kill_listeners() {
  # Kill anything listening on the ports we care about (safe reset)
  for p in 3000 3457; do
    local pids
    pids="$(lsof -tiTCP:"$p" -sTCP:LISTEN 2>/dev/null || true)"
    if [ -n "$pids" ]; then
      echo "Killing listeners on :$p -> $pids"
      kill $pids 2>/dev/null || true
      sleep 0.5
      kill -9 $pids 2>/dev/null || true
    fi
  done
}

wait_http_200() {
  local url="$1"
  local tries="${2:-60}"
  local i=0
  while [ $i -lt $tries ]; do
    if curl -sS -o /dev/null -w "%{http_code}" "$url" 2>/dev/null | grep -q '^200$'; then
      return 0
    fi
    i=$((i+1))
    sleep 1
  done
  return 1
}

# --- clean start ---
echo ">> Clean up old processes"
kill_pidfile "$SHOPIFY_PID"
kill_pidfile "$NEXT_PID"
pkill -f cloudflared 2>/dev/null || true
kill_listeners

: > "$NEXT_LOG"
: > "$SHOPIFY_LOG"

# --- start Next ---
echo ">> Start Next.js (abando-frontend) on :3000"
test -d "abando-frontend" || { echo "❌ Missing abando-frontend/"; exit 1; }
(
  cd abando-frontend
  PORT=3000 nohup npm run dev > "$NEXT_LOG" 2>&1 &
  echo $! > "$NEXT_PID"
)
echo "Next PID: $(cat "$NEXT_PID")"
echo "Waiting for http://localhost:3000/embedded to return 200..."
if ! wait_http_200 "http://localhost:3000/embedded" 90; then
  echo "❌ Next did not become ready. Tail of $NEXT_LOG:"
  tail -n 80 "$NEXT_LOG" || true
  exit 1
fi
echo "✅ Next is ready."
echo

# --- start Shopify dev ---
echo ">> Start Shopify dev (ABANDO_DEV_PROXY=1)"
command -v shopify >/dev/null || { echo "❌ Shopify CLI not found in PATH"; exit 1; }

# NOTE: we do NOT pass --reset here to avoid interactive prompts every run.
# If you need a reset, run it manually once.
(
  ABANDO_DEV_PROXY=1 nohup shopify app dev > "$SHOPIFY_LOG" 2>&1 &
  echo $! > "$SHOPIFY_PID"
)
echo "Shopify PID: $(cat "$SHOPIFY_PID")"
echo

echo "Waiting for Shopify to print a trycloudflare URL..."
for _ in $(seq 1 120); do
  URL_LINE="$(grep -E 'Using URL:\s+https://.*trycloudflare\.com' -m 1 "$SHOPIFY_LOG" 2>/dev/null || true)"
  if [ -n "$URL_LINE" ]; then
    echo "✅ $URL_LINE"
    TUNNEL="$(echo "$URL_LINE" | sed -E 's/.*(https:\/\/[^ ]+).*/\1/')"
    echo
    echo "Try:"
    echo "  curl -sS -D- \"$TUNNEL/embedded?embedded=1\" -o /dev/null | sed -n '1,12p'"
    echo
    echo "Logs:"
    echo "  tail -f $NEXT_LOG"
    echo "  tail -f $SHOPIFY_LOG"
    echo
    exit 0
  fi
  sleep 1
done

echo "❌ Shopify did not print tunnel URL in time. Tail of $SHOPIFY_LOG:"
tail -n 120 "$SHOPIFY_LOG" || true
exit 1
