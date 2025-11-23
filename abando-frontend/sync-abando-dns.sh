#!/usr/bin/env bash
set -euo pipefail

DOMAIN="abando.ai"
CNAME_WWW="e73a762f08ffef0c.vercel-dns-017.com"
CNAME_APP="4ab6828cccbbdb3.vercel-dns-017.com"
CNAME_PAY="cname.vercel-dns.com"

API_BASE="https://developers.hostinger.com/api/dns/v1"

if [[ -z "${HOSTINGER_API_TOKEN-}" ]]; then
  echo "❌ HOSTINGER_API_TOKEN is not set."
  echo "   Run:  export HOSTINGER_API_TOKEN='your-token-here'"
  exit 1
fi

command -v jq >/dev/null 2>&1 || {
  echo "❌ jq is required but not installed. Install with: brew install jq"
  exit 1
}

echo "🔐 Syncing DNS on Hostinger for: ${DOMAIN}"

BODY="$(jq -n \
  --arg ww  "$CNAME_WWW" \
  --arg app "$CNAME_APP" \
  --arg pay "$CNAME_PAY" '
  {
    zone: {
      records: [
        { type: "CNAME", name: "www", value: $ww,  ttl: 3600 },
        { type: "CNAME", name: "app", value: $app, ttl: 3600 },
        { type: "CNAME", name: "pay", value: $pay, ttl: 3600 }
      ]
    }
  }'
)"

curl -sfS -X PUT \
  -H "Authorization: Bearer ${HOSTINGER_API_TOKEN}" \
  -H "Content-Type: application/json" \
  "${API_BASE}/zones/${DOMAIN}?overwrite=false" \
  -d "$BODY"

echo "✨ DNS sync complete for ${DOMAIN}"
echo "   Updated CNAMEs: www, app, pay"
