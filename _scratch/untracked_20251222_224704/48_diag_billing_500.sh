#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

SHOP="${1:-cart-agent-dev.myshopify.com}"

echo "🧪 Diagnose billing/status 500"
echo "Shop: $SHOP"
echo

URL_3000="http://localhost:3000/api/billing/status?shop=$SHOP"
URL_3001="http://localhost:3001/api/billing/status?shop=$SHOP"

echo "== Curl via Express (:3000) =="
curl -sS -i "$URL_3000" | sed -n '1,120p' || true
echo

echo "== Curl via UI origin (:3001) =="
curl -sS -i "$URL_3001" | sed -n '1,120p' || true
echo

echo "== Last 120 lines: .dev_express.log =="
test -f .dev_express.log && tail -n 120 .dev_express.log || echo "(missing .dev_express.log)"
echo

echo "== Last 160 lines: .dev_next.log =="
test -f .dev_next.log && tail -n 160 .dev_next.log || echo "(missing .dev_next.log)"
echo

echo "== Grep ERROR/stack in logs =="
( test -f .dev_express.log && grep -nE "Error|ERROR|stack|ReferenceError|TypeError|SHOPIFY|API_KEY|SECRET|missing" .dev_express.log | tail -n 60 ) || true
( test -f .dev_next.log && grep -nE "Error|ERROR|stack|500|proxy|rewrite" .dev_next.log | tail -n 60 ) || true

echo
echo "Done."
