#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG="$ROOT/logs/frontend_dev.log"

echo "=== Abando debug: capture /command-center 500 ==="
echo
echo "Log file: $LOG"
echo

if [ ! -f "$LOG" ]; then
  echo "⚠️ Frontend log not found at $LOG"
  echo "   Make sure you've run scripts/abando_stack_boot.sh at least once."
  exit 1
fi

echo "----- BEFORE (last 40 lines of frontend log) -----"
tail -n 40 "$LOG" || true

echo
echo "----- HITTING /command-center (curl) -----"
set +e
curl -sS -D - http://localhost:3001/command-center || true
set -e

echo
echo "----- AFTER (last 80 lines of frontend log) -----"
tail -n 80 "$LOG" || true

echo
echo "=== End debug snapshot ==="
