#!/usr/bin/env bash
set -euo pipefail

LOG="${1:-.shopify_dev.log}"

eval "$(./scripts/340_wait_parse_shopify_dev_env.sh "$LOG" 120)" || true
if [[ -z "${TUNNEL:-}" ]]; then
  echo "ERR: could not parse TUNNEL from $LOG" >&2
  exit 2
fi

TOKEN="$(
  perl -ne 'if(/^ABANDO_DEV_SIGN_TOKEN=(.*)\s*$/){ print $1; exit 0 }' web/.env 2>/dev/null || true
)"
if [[ -z "$TOKEN" ]]; then
  echo "ERR: ABANDO_DEV_SIGN_TOKEN missing in web/.env" >&2
  exit 3
fi

echo "TUNNEL=$TUNNEL"
echo

echo "== GET /__abando/debug-env (should be JSON 200) =="
curl -sS -i "$TUNNEL/__abando/debug-env" | sed -n '1,80p'
echo

echo "== POST /__abando/sign (raw) =="
curl -sS -i "$TUNNEL/__abando/sign" \
  -H "Content-Type: application/json" \
  -H "X-Abando-Dev-Token: $TOKEN" \
  -d '{"payload":"{}"}' | sed -n '1,120p'
