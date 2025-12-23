#!/usr/bin/env bash
set -euo pipefail
FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

echo "=== Candidates containing 'webhooks' / Router registration ==="
grep -nEi 'webhooks|router\.(post|all|use)|app\.(post|all|use)|\/api\/webhooks' "$FILE" || true

echo
echo "=== First 140 lines (context) ==="
nl -ba "$FILE" | sed -n '1,140p'
