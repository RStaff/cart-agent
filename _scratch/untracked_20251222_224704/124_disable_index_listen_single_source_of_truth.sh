#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

stamp="$(date +%s)"
cp "$FILE" "$FILE.bak_${stamp}"
echo "✅ Backup: $FILE.bak_${stamp}"

# Comment out any app.listen(...) line (do not delete)
perl -0777 -i -pe '
  s/^(\s*app\.listen\s*\(.*?\);\s*)$/\/\/ DISABLED (handled by start.mjs): $1/mg
' "$FILE"

echo "🔍 Sanity check:"
node --check "$FILE"
echo "✅ index.js parses"

echo
echo "🧹 Free ports 3000/3001"
lsof -ti tcp:3000 | xargs -r kill -9 || true
lsof -ti tcp:3001 | xargs -r kill -9 || true

echo
echo "🚀 Restarting dev stack"
./scripts/dev.sh cart-agent-dev.myshopify.com

echo
echo "✅ Listening status:"
lsof -nP -iTCP:3000 -sTCP:LISTEN || true
lsof -nP -iTCP:3001 -sTCP:LISTEN || true
