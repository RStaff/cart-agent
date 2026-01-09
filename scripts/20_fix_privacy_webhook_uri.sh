#!/usr/bin/env bash
set -euo pipefail

FILE="shopify.app.toml"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

TS="$(date +%Y%m%d_%H%M%S)"
cp -v "$FILE" "${FILE}.bak.${TS}"

echo "== Before =="
grep -nEi '^\s*uri\s*=|compliance_topics|^\[webhooks\]|\[\[webhooks\.subscriptions\]\]' "$FILE" || true
echo

# Replace any absolute URL for the GDPR webhook with a relative path
perl -0777 -i -pe '
  s/^\s*uri\s*=\s*"(https?:\/\/[^"]+\/api\/webhooks\/gdpr)"\s*$/  uri = "\/api\/webhooks\/gdpr"/m;
' "$FILE"

echo "== After =="
grep -nEi '^\s*uri\s*=|compliance_topics|^\[webhooks\]|\[\[webhooks\.subscriptions\]\]' "$FILE" || true

echo
echo "✅ Updated GDPR webhook uri to /api/webhooks/gdpr"
echo "🧾 Backup: ${FILE}.bak.${TS}"
