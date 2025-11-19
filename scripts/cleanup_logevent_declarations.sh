#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${HOME}/projects/cart-agent"
SERVER_JS="$ROOT_DIR/api/server.js"
TMP_FILE="$SERVER_JS.tmp"

if [[ ! -f "$SERVER_JS" ]]; then
  echo "❌ $SERVER_JS not found at: $SERVER_JS"
  exit 1
fi

echo "🧹 Cleaning extra logEvent declarations in: $SERVER_JS"

awk '
  # Any line mentioning logEvent:
  /logEvent/ {
    # Keep the canonical require from ./lib/eventLogger
    if ($0 ~ /require\(.\.\/lib\/eventLogger.\)/) {
      print
      next
    }
    # Drop explicit declarations like:
    #   const logEvent = ...
    #   let logEvent = ...
    #   var logEvent = ...
    if ($0 ~ /(const|let|var)[[:space:]]+logEvent\b/) {
      next
    }
    # Drop function logEvent(...) declarations
    if ($0 ~ /function[[:space:]]+logEvent\b/) {
      next
    }
    # For anything else mentioning logEvent (e.g. logEvent(...)), keep it
    print
    next
  }

  # All other lines pass through unchanged
  { print }
' "$SERVER_JS" > "$TMP_FILE"

mv "$TMP_FILE" "$SERVER_JS"

cd "$ROOT_DIR"
git add api/server.js || true
git commit -m "Cleanup extra logEvent declarations in api/server.js" || echo "(no changes)"

echo "✅ cleanup_logevent_declarations.sh complete."
