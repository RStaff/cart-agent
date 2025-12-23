#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

echo "== Verify: crypto.createHash should be GONE =="
if rg -n "crypto\.createHash|crypto\.createHmac|crypto\.timingSafeEqual" "$FILE"; then
  echo "❌ Still found crypto.* calls in $FILE. Patch didn't fully apply." >&2
  exit 2
else
  echo "✅ No crypto.* calls found (good)."
fi
echo

echo "== Verify: correct import exists =="
if rg -n 'import\s+\{\s*createHash,\s*createHmac,\s*timingSafeEqual\s*\}\s+from\s+"node:crypto"' "$FILE" >/dev/null; then
  echo "✅ Found named import from node:crypto (good)."
else
  echo "⚠️ Did not find the exact named import line. Showing crypto-related imports:" >&2
  rg -n 'node:crypto|createHash|createHmac|timingSafeEqual|import\s+crypto' "$FILE" || true
  exit 3
fi
echo

echo "== Trigger nodemon restart (server crashed, needs a file change) =="
touch "$FILE"
echo "✅ Touched $FILE"
echo

echo "== Wait for server to come back via /__abando/debug-env =="
# Parse latest tunnel from log
LOG=".shopify_dev.log"
test -f "$LOG" || { echo "❌ Missing $LOG (run shopify app dev first)"; exit 4; }
TUNNEL="$(perl -ne 'if(/Using URL:\s*(https:\/\/\S+)/){ $u=$1 } END{ print $u||"" }' "$LOG")"
if [[ -z "$TUNNEL" ]]; then
  echo "❌ Could not parse TUNNEL from $LOG" >&2
  exit 5
fi
echo "TUNNEL=$TUNNEL"

for i in {1..30}; do
  code="$(curl -sS -o /dev/null -w '%{http_code}' "$TUNNEL/__abando/debug-env" || true)"
  if [[ "$code" == "200" ]]; then
    echo "✅ Server is back (HTTP 200)."
    curl -sS "$TUNNEL/__abando/debug-env"
    echo
    exit 0
  fi
  sleep 1
done

echo "❌ Server did not come back within ~30s. Check Terminal A for errors." >&2
exit 6
