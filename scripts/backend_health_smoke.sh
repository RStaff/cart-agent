#!/usr/bin/env bash
set -euo pipefail

echo "=== Backend health smoke ==="

URL="http://localhost:3000/health"

echo "→ Probing $URL ..."
if curl -fsS "$URL" -o /tmp/backend_health.json 2>/dev/null; then
  echo "✅ OK: $URL"
  echo "Response:"
  cat /tmp/backend_health.json
  echo
  echo "=== Health smoke complete ==="
  exit 0
else
  echo "❌ No response from $URL"
  echo "   Make sure the backend is running (scripts/backend_run_local.sh)."
  exit 1
fi
