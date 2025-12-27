#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
TOML="$ROOT/shopify.app.toml"
ENVF="$ROOT/.env"

test -f "$TOML" || { echo "❌ Run from repo root (shopify.app.toml not found)."; exit 1; }
test -f "$ENVF" || { echo "❌ .env not found at repo root."; exit 1; }

URL="$(perl -ne 'print $1 if /^application_url\s*=\s*"(.*)"/' "$TOML" | head -n1 || true)"
GDPR="${URL%/}/api/webhooks/gdpr"

echo "📄 application_url: $URL"
echo "🔗 GDPR endpoint:   $GDPR"
echo

# Export all vars from .env into THIS shell environment for any child process you start next
set -a
source "$ENVF"
set +a

if [[ -z "${SHOPIFY_API_SECRET:-}" ]]; then
  echo "❌ SHOPIFY_API_SECRET is still empty after sourcing .env"
  exit 1
fi

echo "✅ SHOPIFY_API_SECRET exported (masked): ${SHOPIFY_API_SECRET:0:4}**** (len=$(echo -n "$SHOPIFY_API_SECRET" | wc -c | tr -d ' '))"
echo

echo "🌐 Quick reachability check (DNS/tunnel must be up):"
if curl -sS -I "$GDPR" | head -n 5; then
  echo "✅ Endpoint is reachable (at least at HTTP level)."
else
  echo "❌ Endpoint not reachable."
  echo "   If this is a trycloudflare URL, your tunnel is likely not running or URL changed."
  exit 1
fi

echo
echo "🎯 Next (copy/paste):"
echo "  # IMPORTANT: restart your dev server AFTER exporting env"
echo "  # If Next is already running, stop it and start again:"
echo "  npm run dev"
echo "  # Then re-run Partners → Distribution → Automated checks → Run"
