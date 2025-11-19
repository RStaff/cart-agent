#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${HOME}/projects/cart-agent"
SERVER_JS="$ROOT_DIR/api/server.js"
TMP_FILE="$SERVER_JS.tmp"

if [[ ! -f "$SERVER_JS" ]]; then
  echo "❌ $SERVER_JS not found at: $SERVER_JS"
  exit 1
fi

echo "🔧 Fixing duplicate logEvent require in: $SERVER_JS"

awk '
  /const { logEvent } = require\(.\.\/lib\/eventLogger.\);/ {
    if (seen == 1) {
      # skip duplicate require
      next
    }
    seen = 1
  }
  { print }
' "$SERVER_JS" > "$TMP_FILE"

mv "$TMP_FILE" "$SERVER_JS"

cd "$ROOT_DIR"
git add api/server.js || true
git commit -m "Fix duplicate logEvent require in api/server.js" || echo "(no changes)"

echo "✅ fix_duplicate_logevent_require.sh complete."
