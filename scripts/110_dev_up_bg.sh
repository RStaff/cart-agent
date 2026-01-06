#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

LOG="/tmp/abando_shopify_dev.log"

echo "== Stop any existing shopify dev =="
pkill -f "shopify app dev" >/dev/null 2>&1 || true

echo "== Start shopify dev in background with nohup (stable) =="
# nohup keeps it alive even if the terminal hiccups
nohup shopify app dev > "$LOG" 2>&1 & disown

echo "✅ Started."
echo "LOG=$LOG"
echo
echo "== Tail the log =="
echo "tail -n 50 -f $LOG"
