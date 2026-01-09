#!/usr/bin/env bash
set -euo pipefail

LOG="/tmp/abando_shopify_dev.log"
test -f "$LOG" || { echo "❌ Missing $LOG (run shopify app dev first)"; exit 1; }

BACKEND_PORT="$(grep -Eo '\[server\] listening on :[0-9]+' "$LOG" | tail -n 1 | grep -Eo '[0-9]+')"
PROXY_PORT="$(grep -Eo 'Proxy server started on port [0-9]+' "$LOG" | tail -n 1 | grep -Eo '[0-9]+')"
TUNNEL_URL="$(grep -Eo 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com|https://[a-zA-Z0-9.-]+\.ngrok(-free)?\.app|https://[a-zA-Z0-9.-]+\.loca\.lt|https://[a-zA-Z0-9.-]+\.tunnelmole\.com' "$LOG" | tail -n 1 || true)"

echo "BACKEND_PORT=$BACKEND_PORT"
echo "PROXY_PORT=$PROXY_PORT"
echo "TUNNEL_URL=${TUNNEL_URL:-<not found>}"
echo

hit () {
  local base="$1"
  local path="$2"
  echo "== $base$path =="
  curl -sS -i "$base$path" | sed -n '1,18p'
  echo
}

echo "================== BACKEND (truth) =================="
hit "http://127.0.0.1:${BACKEND_PORT}" "/"
hit "http://127.0.0.1:${BACKEND_PORT}" "/embedded?embedded=1"
hit "http://127.0.0.1:${BACKEND_PORT}" "/api/webhooks/gdpr" || true

echo "================== PROXY (shopify cli local proxy) =================="
hit "http://127.0.0.1:${PROXY_PORT}" "/"
hit "http://127.0.0.1:${PROXY_PORT}" "/embedded?embedded=1"
hit "http://127.0.0.1:${PROXY_PORT}" "/api/webhooks/gdpr" || true

if [[ -n "${TUNNEL_URL:-}" ]]; then
  echo "================== TUNNEL (public) =================="
  hit "${TUNNEL_URL}" "/"
  hit "${TUNNEL_URL}" "/embedded?embedded=1"
  hit "${TUNNEL_URL}" "/api/webhooks/gdpr" || true
else
  echo "⚠️ No tunnel URL detected in $LOG"
fi

echo "================== GREP sanity =================="
grep -Rni -- "Invalid path" web/src/index.js || echo "OK: no 'Invalid path' in web/src/index.js"
