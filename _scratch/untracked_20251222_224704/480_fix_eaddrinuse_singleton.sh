#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

echo "🔎 Finding anything listening on :3000..."
pids="$(lsof -nP -tiTCP:3000 -sTCP:LISTEN 2>/dev/null || true)"

if [ -z "${pids}" ]; then
  echo "✅ Nothing is listening on :3000"
else
  echo "⚠️ :3000 is held by PID(s): ${pids}"
  for pid in ${pids}; do
    echo
    echo "----- PID $pid -----"
    ps -p "$pid" -o pid,ppid,command || true

    # Only kill if it's your node process (safe guard)
    cmd="$(ps -p "$pid" -o command= 2>/dev/null || true)"
    if echo "$cmd" | grep -qiE "node|nodemon|start\.mjs|shopify"; then
      echo "🧨 Killing PID $pid"
      kill -9 "$pid" || true
    else
      echo "🛑 Refusing to kill PID $pid (doesn't look like node/shopify)"
    fi
  done
fi

echo
echo "🧹 Also killing duplicate Shopify CLI dev sessions (if any)..."
# This only targets your user processes, and only ones that look like Shopify dev
pkill -f "shopify app dev" 2>/dev/null || true
pkill -f "cloudflared.*trycloudflare" 2>/dev/null || true

echo
echo "🔁 Nudge nodemon restart..."
mkdir -p web/lib
touch web/index.js web/lib/.nodemon_restart 2>/dev/null || true

echo
echo "✅ Done."
echo "Now run ONE dev session in ONE terminal:"
echo "  shopify app dev --reset"
echo
echo "And keep your watcher in another terminal:"
echo "  ./scripts/470_webhook_watch.sh"
