#!/usr/bin/env bash
set -euo pipefail

NEXT_PID="/tmp/abando_next.pid"
SHOPIFY_PID="/tmp/abando_shopify.pid"

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

echo "== Abando Dev Down =="
kill_pidfile "$SHOPIFY_PID"
kill_pidfile "$NEXT_PID"
pkill -f cloudflared 2>/dev/null || true

for p in 3000 3457; do
  pids="$(lsof -tiTCP:"$p" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    echo "Killing listeners on :$p -> $pids"
    kill $pids 2>/dev/null || true
    sleep 0.5
    kill -9 $pids 2>/dev/null || true
  fi
done

echo "✅ Stopped."
