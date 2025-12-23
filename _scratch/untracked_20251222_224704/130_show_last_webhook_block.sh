#!/usr/bin/env bash
set -euo pipefail

LOG=".dev_express.log"
test -f "$LOG" || { echo "❌ $LOG not found"; exit 1; }

# Find the last line number where the webhook block starts
START_LINE="$(grep -n "\[webhooks\] received POST /api/webhooks" "$LOG" | tail -n 1 | cut -d: -f1 || true)"

if [[ -z "${START_LINE}" ]]; then
  echo "❌ No webhook blocks found in $LOG"
  exit 1
fi

# Print a reasonable window after the start line to include the full object
END_LINE=$((START_LINE + 40))

echo "✅ Showing last webhook block:"
echo "   $LOG:$START_LINE-$END_LINE"
echo
nl -ba "$LOG" | sed -n "${START_LINE},${END_LINE}p"
