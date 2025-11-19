#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${HOME}/projects/cart-agent"
SERVER_JS="$ROOT_DIR/api/server.js"

if [[ ! -f "$SERVER_JS" ]]; then
  echo "❌ api/server.js not found at: $SERVER_JS"
  exit 1
fi

echo "=== api/server.js : first 80 lines ==="
nl -ba "$SERVER_JS" | sed -n '1,80p'

echo
echo "=== Any lines mentioning logEvent or log-test ==="
nl -ba "$SERVER_JS" | grep -nE 'logEvent|log-test' || echo "(none)"

echo
echo "=== Any lines mentioning express() / app.use / router ==="
nl -ba "$SERVER_JS" | grep -nE 'express\\(|app\\.use|router\\.' || echo "(none)"
