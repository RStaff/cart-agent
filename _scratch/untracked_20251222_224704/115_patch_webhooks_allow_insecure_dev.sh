#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/routes/webhooks.js"
test -f "$FILE" || { echo "❌ Missing: $FILE"; exit 1; }

stamp="$(date +%s)"
cp "$FILE" "$FILE.bak_${stamp}"
echo "✅ Backup: $FILE.bak_${stamp}"

perl -0777 -i -pe '
s/(router\.post\([^)]*\)\s*=>\s*{\s*)/$1\n  if (process.env.ABANDO_ALLOW_INSECURE_WEBHOOKS === \"1\") {\n    console.log(\"[webhooks] insecure dev bypass enabled\");\n    return res.status(200).send(\"ok\");\n  }\n\n/s;
' "$FILE"

echo "🔍 Sanity check:"
node --check "$FILE"
echo "✅ webhooks.js parses"

echo
echo "🔁 Restart Express"
lsof -ti tcp:3000 | xargs -r kill -9 || true
./scripts/dev.sh cart-agent-dev.myshopify.com
