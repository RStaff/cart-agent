#!/usr/bin/env bash
set -euo pipefail

BASE="web/src"
echo "🔎 Scanning for imports from ../db/billingState.js under $BASE ..."
echo

grep -RIn --include='*.js' --include='*.mjs' \
  'from "../db/billingState.js"' "$BASE" || true

echo
echo "✅ Required named imports (unique):"
grep -RIn --include='*.js' --include='*.mjs' \
  'from "../db/billingState.js"' "$BASE" \
  | sed -E 's/.*import[[:space:]]+\{([^}]*)\}.*/\1/' \
  | tr ',' '\n' \
  | sed -E 's/^[[:space:]]+|[[:space:]]+$//g' \
  | grep -v '^$' \
  | sort -u
