#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

FILE="scripts/32_verify_web_3000.sh"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

ts="$(date +%s)"
cp "$FILE" "$FILE.bak_$ts"

# Make LOG file live in repo root (not ../)
perl -i -pe 's/LOG="\.\.\/\.verify_web_3000\.log"/LOG="\.verify_web_3000\.log"/g' "$FILE"

echo "✅ Patched: $FILE"
grep -nE 'LOG=' "$FILE" || true
