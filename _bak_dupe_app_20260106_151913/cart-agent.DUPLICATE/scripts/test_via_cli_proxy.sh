#!/usr/bin/env bash
set -e

echo "==> Looking for Shopify CLI proxy port in dev.log…"
if [[ -f dev.log ]]; then
  PROXY_PORT=$(grep -Eo 'Proxy server started on port [0-9]+' dev.log | awk '{print $NF}' | tail -n1 || true)
fi

# Fallback: let user supply it if not found
if [[ -z "${PROXY_PORT:-}" ]]; then
  read -rp "Couldn't auto-detect. Enter proxy port (from 'Proxy server started on port NNNNN'): " PROXY_PORT
fi

if ! [[ "$PROXY_PORT" =~ ^[0-9]+$ ]]; then
  echo "❌ Invalid port: $PROXY_PORT"
  exit 1
fi

echo "==> Using proxy port: $PROXY_PORT"
PAYLOAD='{"checkoutId":"SMOKE-'"$RANDOM"'","email":"smoke@example.com","lineItems":[{"id":1,"title":"Test Item","quantity":1}],"totalPrice":9.99}'

echo
echo "==> POST http://localhost:${PROXY_PORT}/api/abandoned-cart"
RESP=$(curl -sS -i -X POST "http://localhost:${PROXY_PORT}/api/abandoned-cart" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

# Show headers quickly
echo "---- response (head) ----"
echo "$RESP" | sed -n '1,20p'
STATUS=$(printf "%s" "$RESP" | awk 'NR==1{print $2}')

if [[ "$STATUS" = "201" ]]; then
  echo "==> ✅ 201 Created via CLI proxy."
else
  echo "==> ⚠️ Non-201 ($STATUS). Check the Shopify CLI terminal for backend errors."
fi

echo
echo "==> Tip:"
echo "   • Keep 'shopify app dev' running in another terminal (ideally: 'shopify app dev | tee dev.log')"
echo "   • Your local backend log will still show the handler output (saved row, AI copy, email preview)."
