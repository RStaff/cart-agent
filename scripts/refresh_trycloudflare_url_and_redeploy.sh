#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
TOML="$ROOT/shopify.app.toml"

test -f "$TOML" || { echo "❌ Run from repo root (shopify.app.toml not found)."; exit 1; }

echo "🔎 Checking current application_url in shopify.app.toml..."
CUR="$(perl -ne 'print $1 if /^application_url\s*=\s*"(.*)"/' "$TOML" | head -n1 || true)"
echo "  current: ${CUR:-<none>}"
echo

echo "📌 Paste your NEW https://<something>.trycloudflare.com URL and press Enter:"
read -r NEWURL

if [[ ! "$NEWURL" =~ ^https://[a-z0-9-]+\.trycloudflare\.com/?$ ]]; then
  echo "❌ That doesn't look like a trycloudflare URL: $NEWURL"
  exit 1
fi
NEWURL="${NEWURL%/}"
GDPR="$NEWURL/api/webhooks/gdpr"

echo
echo "🧾 Backing up shopify.app.toml..."
cp "$TOML" "$TOML.bak_$(date +%s)"

echo "✍️ Updating application_url..."
perl -0777 -i -pe 's/^application_url\s*=.*$/application_url = "'"$NEWURL"'"/m' "$TOML"

echo "✍️ Ensuring ONE GDPR webhook subscription (uri/format/compliance_topics)..."
perl -0777 -i -pe '
  # remove all existing webhook subscription blocks
  s/\n\[\[webhooks\.subscriptions\]\][^\[]*//sg;
' "$TOML"

cat >> "$TOML" <<TOML_APPEND

[[webhooks.subscriptions]]
uri = "$GDPR"
format = "json"
compliance_topics = ["customers/data_request", "customers/redact", "shop/redact"]
TOML_APPEND

echo
echo "🌐 Quick DNS/HTTP check:"
curl -sS -I "$GDPR" | head -n 5 || { echo "❌ Still not reachable. Tunnel likely not running."; exit 1; }

echo
echo "✅ Updated:"
echo "  application_url = $NEWURL"
echo "  GDPR uri        = $GDPR"
echo
echo "🎯 Next (copy/paste):"
echo "  shopify app deploy"
