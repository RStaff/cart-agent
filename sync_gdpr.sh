#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
TOML="$ROOT/shopify.app.toml"

URL="$(ps aux | grep cloudflared | grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' | tail -n 1)"

if [[ -z "$URL" ]]; then
  echo "❌ No active trycloudflare URL found."
  echo "Start tunnel first in another terminal."
  exit 1
fi

GDPR="$URL/api/webhooks/gdpr"

echo "Using:"
echo "  application_url = $URL"
echo "  GDPR uri        = $GDPR"

cp "$TOML" "$TOML.bak_$(date +%s)"

perl -0777 -i -pe '
  s/^application_url\s*=.*$/application_url = "'"$URL"'"/m;
  s/\n\[\[webhooks\.subscriptions\]\][^\[]*//sg;
' "$TOML"

cat >> "$TOML" <<TOML_APPEND

[[webhooks.subscriptions]]
uri = "$GDPR"
format = "json"
compliance_topics = ["customers/data_request", "customers/redact", "shop/redact"]
TOML_APPEND

echo
echo "✅ Final webhook config:"
grep -nE 'application_url|webhooks\.subscriptions|uri|compliance_topics' "$TOML"
