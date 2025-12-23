#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/.abando_webhook_probe.jsonl"
touch "$FILE"
echo "🧪 Watching $FILE (Ctrl+C to stop)"
tail -n 50 -f "$FILE"
