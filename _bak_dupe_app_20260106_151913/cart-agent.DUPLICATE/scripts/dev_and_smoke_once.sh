#!/usr/bin/env bash
set -euo pipefail

# Kill any running dev and start fresh
pkill -f "shopify app dev" >/dev/null 2>&1 || true
rm -f dev.log
( shopify app dev | tee dev.log ) &

# Wait for lines to appear
wait_for_line() {
  local pattern="$1"; local seconds="${2:-120}"
  while [ "$seconds" -gt 0 ]; do
    if line=$(grep -E "$pattern" dev.log | tail -n1) && [ -n "$line" ]; then
      echo "$line"; return 0
    fi
    sleep 1; seconds=$((seconds-1))
  done
  return 1
}

PLINE=$(wait_for_line "Proxy server started on port [0-9]+" 120) || { echo "❌ Could not find proxy port"; tail -n 80 dev.log; exit 1; }
LLINE=$(wait_for_line "\[local\] webhook receiver listening at http://localhost:[0-9]+" 120) || { echo "❌ Could not find local port"; tail -n 80 dev.log; exit 1; }

PROXY_PORT=$(printf "%s\n" "$PLINE" | sed -n 's/.*Proxy server started on port \([0-9][0-9]*\).*/\1/p')
LOCAL_PORT=$(printf "%s\n" "$LLINE" | sed -n 's/.*localhost:\([0-9][0-9]*\).*/\1/p')

echo "→ Proxy: $PROXY_PORT   Local: $LOCAL_PORT"

echo "==> POST via proxy…"
curl -i -X POST "http://localhost:${PROXY_PORT}/api/abandoned-cart" \
  -H "Content-Type: application/json" \
  -d "{\"checkoutId\":\"SMOKE-$RANDOM\",\"email\":\"smoke@example.com\",\"lineItems\":[{\"id\":1,\"title\":\"Test Item\",\"quantity\":1}],\"totalPrice\":9.99}" \
  || true

echo
PREVIEW=$(grep -o 'https://ethereal\.email/message[^ ]*' dev.log | tail -n1 || true)
if [ -n "${PREVIEW:-}" ]; then
  echo "📬 Latest Ethereal preview: $PREVIEW"
else
  echo "ℹ️ No Ethereal preview found yet (provider may be Resend/SendGrid or compose failed)."
fi
