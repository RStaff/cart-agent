#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
TS="$(date +%Y%m%d_%H%M%S)"

cp "$FILE" "$FILE.bak_$TS"
echo "🧷 Backup created: $FILE.bak_$TS"

# Remove any ABANDO_DEV_PROXY blocks safely
perl -0777 -i -pe '
s@// ABANDO_DEV_PROXY_START.*?// ABANDO_DEV_PROXY_END@@gs
' "$FILE"

echo "✅ ABANDO_DEV_PROXY completely removed"
