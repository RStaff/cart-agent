#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1
FILE="web/.abando_webhook_inbox.jsonl"

test -f "$FILE" || { echo "❌ Missing $FILE (no inbox yet)"; exit 1; }

echo "📡 Watching $FILE (Ctrl+C to stop)"
tail -n 0 -f "$FILE"
