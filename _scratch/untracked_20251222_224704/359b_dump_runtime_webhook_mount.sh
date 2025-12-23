#!/usr/bin/env bash
set -euo pipefail

FILE="web/index.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

echo "== FILE: $FILE =="
ls -lh "$FILE"
echo

echo "== 0) Head (first 120 lines) =="
nl -ba "$FILE" | sed -n '1,120p' || true
echo

echo "== 1) Any mention of 'api/webhooks' in web/index.js? (with 6 lines of context) =="
rg -n --no-ignore-vcs 'api/webhooks' "$FILE" -C 6 || true
echo

echo "== 2) Any mention of 'webhook' in web/index.js? (with 2 lines context) =="
rg -n --no-ignore-vcs 'webhook' "$FILE" -C 2 || true
echo

echo "== 3) If web/index.js doesn't mention it, list candidates in web/lib/** =="
rg -n --no-ignore-vcs 'api/webhooks|/api/webhooks|received POST|x-shopify-hmac|hmac' web/lib -S 2>/dev/null | head -n 80 || true
echo

echo "== 4) Also check web/src/index.js (source may still show the mount) =="
test -f web/src/index.js && rg -n --no-ignore-vcs 'api/webhooks|app\.use\(|webhooks' web/src/index.js -C 3 || true
echo
