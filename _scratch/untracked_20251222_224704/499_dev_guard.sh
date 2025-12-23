#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

echo "🛡️ Abando Dev Guard"

# Is shopify dev already running?
if pgrep -f "shopify app dev" >/dev/null 2>&1; then
  echo "⚠️ A Shopify dev session is already running."
  echo
  echo "=== Running shopify dev processes ==="
  ps aux | egrep "shopify app dev" | egrep -v egrep || true

  echo
  echo "=== Ports (3000/3001/3457) owners ==="
  lsof -nP -iTCP -sTCP:LISTEN | egrep ":(3000|3001|3457)\b" || echo "✅ none"

  echo
  echo "➡️ If you meant to restart, run:"
  echo "   ./scripts/497_dev_restart_clean.sh"
  exit 0
fi

echo "✅ No existing shopify dev session detected."
echo "🚀 Starting: shopify app dev --reset"
exec shopify app dev --reset
