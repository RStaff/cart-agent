#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/db/billingState.js"
test -f "$FILE" || { echo "❌ Missing: $FILE"; exit 1; }

echo "🔎 Looking for newest backup that parses..."
candidates=($(ls -1t web/src/db/billingState.js.bak_* 2>/dev/null || true))

if [ ${#candidates[@]} -eq 0 ]; then
  echo "❌ No backups found (web/src/db/billingState.js.bak_*)"
  exit 1
fi

for b in "${candidates[@]}"; do
  if node --check "$b" >/dev/null 2>&1; then
    echo "✅ Found parsing backup: $b"
    cp "$b" "$FILE"
    node --check "$FILE"
    echo "✅ Restored billingState.js to a parsing version"
    exit 0
  fi
done

echo "❌ None of the backups parse. We'll need to reconstruct manually."
exit 1
