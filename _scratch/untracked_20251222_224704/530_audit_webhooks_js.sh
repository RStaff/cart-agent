#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

echo "=== HEADERS: router declarations / mounts ==="
grep -nE 'express\.Router\(|router\s*=|export default|module\.exports|router\.(post|get|use)\(' "$FILE" || true

echo
echo "=== FIND 'ok' responses ==="
grep -nE 'send\(["'\'']ok["'\'']\)|\.sendStatus\(\s*200\s*\)' "$FILE" || true

echo
echo "=== FIND ABANDO INBOX / webhook logging usage ==="
grep -nE 'ABANDO|inbox|WEBHOOK|hmac|x-shopify|appendFileSync|createHmac|raw\(|bodyParser\.raw' "$FILE" || true

echo
echo "=== SHOW CONTEXT around router probe marker (if present) ==="
grep -n "ROUTER_USE_PROBE" -n "$FILE" || true
