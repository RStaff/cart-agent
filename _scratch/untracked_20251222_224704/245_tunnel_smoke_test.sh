#!/usr/bin/env bash
set -euo pipefail
LOG="${1:-.shopify_dev.log}"
test -f "$LOG" || { echo "Log not found: $LOG"; exit 1; }

refresh() {
  eval "$(./scripts/240_refresh_env_from_shopify_log.sh "$LOG")"
  echo "TUNNEL=$TUNNEL"
  echo "BACKEND_PORT=$BACKEND_PORT"
}

refresh
echo

echo "Backend direct (expect 401 missing hmac):"
curl -sS -i "http://127.0.0.1:${BACKEND_PORT}/api/webhooks" -X POST -H "Content-Type: application/json" -d '{}' | sed -n '1,12p'
echo

echo "Tunnel (must resolve DNS):"
set +e
OUT="$(curl -sS -i "${TUNNEL}/api/webhooks" -X POST -H "Content-Type: application/json" -d '{}' 2>&1 | sed -n '1,12p')"
RC=$?
set -e

echo "$OUT"

if [[ $RC -ne 0 ]] && echo "$OUT" | grep -qi "Could not resolve host"; then
  echo
  echo "❌ Tunnel hostname is stale/expired. Re-parsing log for newest tunnel..."
  refresh
  echo
  echo "Re-test this:"
  echo "curl -sS -i \"${TUNNEL}/api/webhooks\" -X POST -H \"Content-Type: application/json\" -d '{}' | sed -n '1,12p'"
  exit 2
fi

echo
echo "✅ Tunnel reachable."
