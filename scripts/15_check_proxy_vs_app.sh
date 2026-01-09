#!/usr/bin/env bash
set -euo pipefail

LOG="/tmp/abando_shopify_dev.log"
test -f "$LOG" || { echo "❌ Missing $LOG (run scripts/12_dev_up_next_then_shopify.sh first)"; exit 1; }

# Parse ports from the Shopify dev log
PROXY_PORT="$(grep -Eo 'Proxy server started on port [0-9]+' "$LOG" | tail -n 1 | awk '{print $NF}' || true)"
APP_PORT="$(grep -Eo '\[server\] listening on :[0-9]+' "$LOG" | tail -n 1 | sed 's/.*://g' || true)"
TUNNEL_URL="$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG" | tail -n 1 || true)"
TUNNEL_HOST="${TUNNEL_URL#https://}"

if [[ -z "${PROXY_PORT:-}" || -z "${APP_PORT:-}" ]]; then
  echo "❌ Could not parse ports from $LOG"
  echo "   PROXY_PORT='${PROXY_PORT:-}'"
  echo "   APP_PORT='${APP_PORT:-}'"
  echo
  echo "Last 120 log lines:"
  tail -n 120 "$LOG"
  exit 1
fi

echo "== Parsed from log =="
echo "PROXY_PORT=$PROXY_PORT"
echo "APP_PORT=$APP_PORT"
echo "TUNNEL_URL=${TUNNEL_URL:-<none found>}"
echo

echo "== Who is listening? =="
echo "-- PROXY --"
lsof -nP -iTCP:${PROXY_PORT} -sTCP:LISTEN || true
echo
echo "-- APP --"
lsof -nP -iTCP:${APP_PORT} -sTCP:LISTEN || true
echo

echo "== HTTP checks (headers only) =="
echo "-- App backend / (expected 302 -> /embedded) --"
curl -sS -D- "http://localhost:${APP_PORT}/" -o /dev/null | sed -n '1,25p' || true
echo
echo "-- App backend /embedded?embedded=1 (expected 200) --"
curl -sS -D- "http://localhost:${APP_PORT}/embedded?embedded=1" -o /dev/null | sed -n '1,25p' || true
echo
echo "-- Shopify proxy / (often fails if proxy is rejecting) --"
curl -sS -D- "http://localhost:${PROXY_PORT}/" -o /dev/null | sed -n '1,25p' || true
echo
echo "-- Shopify proxy /embedded?embedded=1 (this is your failing path) --"
curl -sS -D- "http://localhost:${PROXY_PORT}/embedded?embedded=1" -o /dev/null | sed -n '1,25p' || true
echo

if [[ -n "${TUNNEL_HOST:-}" ]]; then
  echo "== Proxy with Host header (matches tunnel host) =="
  curl -sS -D- -H "Host: ${TUNNEL_HOST}" "http://localhost:${PROXY_PORT}/embedded?embedded=1" -o /dev/null | sed -n '1,25p' || true
  echo
fi

echo "== Done =="
