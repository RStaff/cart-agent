#!/usr/bin/env bash
set -euo pipefail

FILE="web/start.mjs"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

cp "$FILE" "$FILE.bak_$(date +%s)"
echo "✅ Backup: $FILE.bak_*"

# Remove shebang if present anywhere in file
sed -i '' '/^#!\/usr\/bin\/env node/d' "$FILE"

echo "✅ Removed shebang from $FILE"
