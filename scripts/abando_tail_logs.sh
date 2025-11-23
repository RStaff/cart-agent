#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p logs
touch logs/backend_dev.log logs/frontend_dev.log

echo "=============================="
echo "   Abando Logs Tail"
echo "=============================="
echo
echo "Backend log : logs/backend_dev.log"
echo "Frontend log: logs/frontend_dev.log"
echo
echo "Press Ctrl+C to stop."
echo

# If your terminal supports it, you can run two tails in background;
# simple version: single combined tail
tail -f logs/backend_dev.log logs/frontend_dev.log
