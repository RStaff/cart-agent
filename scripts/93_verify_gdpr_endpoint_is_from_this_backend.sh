#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

LOG="/tmp/abando_shopify_dev.log"
test -f "$LOG" || { echo "❌ Missing $LOG. Start: shopify app dev | tee $LOG"; exit 1; }

BACKEND_PORT="$(rg -o 'listening on :[0-9]+' "$LOG" | tail -n 1 | rg -o '[0-9]+')"
echo "BACKEND_PORT=$BACKEND_PORT"

echo
echo "== PID listening on BACKEND_PORT =="
PID="$(lsof -nP -iTCP:${BACKEND_PORT} -sTCP:LISTEN -t | head -n 1 || true)"
echo "PID=$PID"
test -n "$PID" || { echo "❌ No PID found listening on $BACKEND_PORT"; exit 1; }

echo
echo "== Command line for PID =="
ps -p "$PID" -o pid=,ppid=,command=

echo
echo "== GET (expect 405 + X-Abando-GDPR-Guard: 1) =="
curl -sS -i "http://127.0.0.1:${BACKEND_PORT}/api/webhooks/gdpr" | sed -n '1,40p'

echo
echo "== HEAD (expect 405 + X-Abando-GDPR-Guard: 1) =="
curl -sS -I "http://127.0.0.1:${BACKEND_PORT}/api/webhooks/gdpr" | sed -n '1,40p'

echo
echo "== POST no HMAC (expect 401 + X-Abando-GDPR-Guard: 1) =="
curl -sS -i -X POST "http://127.0.0.1:${BACKEND_PORT}/api/webhooks/gdpr" --data-binary '{}' | sed -n '1,40p'
