#!/usr/bin/env bash
set -euo pipefail

FILE="web/index.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }
cp "$FILE" "$FILE.bak_$(date +%s)"

# Replace with a minimal, correct proxy entry.
cat > "$FILE" <<'JS'
/** Proxy entry for production hosts that still call `node web/index.js` */
require("./src/index.js");
JS

echo "✅ Fixed $FILE (minimal proxy). Backup created."
