#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
TS="$(date +%Y%m%d_%H%M%S)"

cp "$FILE" "$FILE.bak_disable_proxy_$TS"
echo "🧷 Backup created: $FILE.bak_disable_proxy_$TS"

# Remove ABANDO_DEV_PROXY logic safely
perl -0777 -i -pe '
s@// ABANDO_DEV_PROXY_START.*?// ABANDO_DEV_PROXY_END@@gs
' "$FILE"

echo "✅ Frontend proxy disabled (API-only backend)"
