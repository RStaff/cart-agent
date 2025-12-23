#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"

echo "🔧 Ensuring billing route is mounted in $FILE"

if grep -q "billing_create" "$FILE"; then
  echo "✅ Billing route already mounted."
  exit 0
fi

# Insert mount above the last export or end of file
sed -i.bak '/app.use/a \
app.use("/billing", (await import("./routes/billing_create.js")).default);' "$FILE"

echo "✅ Billing route mounted."
