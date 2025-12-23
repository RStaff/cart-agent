#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/.abando_webhook_inbox.jsonl"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

echo "📌 Tailing: $FILE"
echo "   (Ctrl+C to stop)"
tail -n 50 -f "$FILE"
