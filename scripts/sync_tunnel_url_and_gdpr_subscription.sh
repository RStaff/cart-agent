#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
TOML="$ROOT/shopify.app.toml"

NEWURL="https://oxide-intellectual-mpg-walking.trycloudflare.com"
GDPR="$NEWURL/api/webhooks/gdpr"

echo "🔧 Sync tunnel URL + GDPR compliance webhook"
echo "📁 Root: $ROOT"
test -f "$TOML" || { echo "❌ Missing: $TOML"; exit 1; }

echo "✅ Using:"
echo "  application_url = $NEWURL"
echo "  GDPR uri        = $GDPR"

BAK="$TOML.bak_$(date +%s)"
cp "$TOML" "$BAK"
echo "🧾 Backup: $BAK"

# Update application_url line
perl -0777 -i -pe 's/^application_url\s*=.*$/application_url = "'"$NEWURL"'"/m' "$TOML"

# Remove ALL existing webhook subscription blocks, then append ONE clean GDPR compliance subscription
perl -0777 -i -pe 's/\n\[\[webhooks\.subscriptions\]\][^\[]*//sg' "$TOML"

cat >> "$TOML" <<TOML_APPEND

[[webhooks.subscriptions]]
uri = "$GDPR"
format = "json"
compliance_topics = ["customers/data_request", "customers/redact", "shop/redact"]
TOML_APPEND

echo
echo "🔍 Confirming TOML (application_url + GDPR block):"
grep -nE '^application_url\s*=|\[\[webhooks\.subscriptions\]\]|\buri\s*=|\bcompliance_topics\s*=|\bformat\s*=' "$TOML" | tail -n 40 || true

echo
echo "🌐 Reachability check (DNS + HTTP HEAD):"
if curl -sS -I "$GDPR" | head -n 5; then
  echo "✅ Tunnel endpoint reachable."
else
  echo "❌ Not reachable. (Tunnel may have changed or is blocked.)"
  exit 1
fi

echo
echo "🎯 Next (copy/paste):"
echo "  # In THIS terminal (where shopify app dev is running), keep it running."
echo "  # In a NEW terminal:"
echo "  cd \"$ROOT\""
echo "  shopify app deploy"
echo "  # Then Partners → Distribution → Run checks"
