#!/usr/bin/env bash
set -euo pipefail
FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

cp "$FILE" "$FILE.bak_$(date +%s)"

# Insert debug right after the path is read (after const p = ...)
perl -0777 -i -pe '
  s/(const p = process\.env\.ABANDO_EVENT_INBOX_PATH[\s\S]{0,200}?;\n)/$1\n  try {\n    const path = require("node:path");\n    const resolved = p ? path.resolve(process.cwd(), p) : "(none)";\n    console.log("[abando][inbox] cwd=", process.cwd(), "raw=", p, "resolved=", resolved);\n  } catch (e) {\n    console.log("[abando][inbox] debug failed", e?.message || e);\n  }\n/s
' "$FILE"

echo "✅ Patched $FILE with inbox path debug."
