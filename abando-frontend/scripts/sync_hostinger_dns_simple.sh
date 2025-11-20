#!/usr/bin/env bash
set -euo pipefail

# ===== CONFIG =====
DOMAIN="abando.ai"

# Your targets (from Vercel + Render)
CNAME_WWW="abando-frontend-jf7tdapnl-ross-projects-1d9d3b7c.vercel.app"
CNAME_APP="abando-frontend-jf7tdapnl-ross-projects-1d9d3b7c.vercel.app"
CNAME_PAY="cart-agent-api.onrender.com"

# Hostinger API base
API_BASE="https://api.hostinger.com/api/dns/v1"

if [[ -z "${HOSTINGER_API_TOKEN:-}" ]]; then
  echo "❌ HOSTINGER_API_TOKEN is not set."
  echo "   Run: export HOSTINGER_API_TOKEN='YOUR_TOKEN_HERE'"
  exit 1
fi

echo "🔐 Syncing DNS on Hostinger for: ${DOMAIN}"
echo "   www → ${CNAME_WWW}"
echo "   app → ${CNAME_APP}"
echo "   pay → ${CNAME_PAY}"
echo

# Build JSON body for updateDNSRecordsV1
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

echo "➡️  PUT ${API_BASE}/zones/${DOMAIN}?overwrite=false"
echo "   (If this fails, the API will print a JSON error next)"

# IMPORTANT: no -s here, so you can see the actual error message
HTTP_CODE="$(
  curl -X PUT \
    -w "%{http_code}" \
    -o /tmp/hostinger_dns_response.json \
    -H "Authorization: Bearer ${HOSTINGER_API_TOKEN}" \
    -H "Content-Type: application/json" \
    "${API_BASE}/zones/${DOMAIN}?overwrite=false" \
    -d "$BODY"
)"

echo "HTTP status: ${HTTP_CODE}"
echo "Response body:"
cat /tmp/hostinger_dns_response.json || echo "(no body returned)"

if [[ "$HTTP_CODE" != "200" && "$HTTP_CODE" != "201" ]]; then
  echo "❌ Hostinger API did not accept the request."
  exit 1
fi

echo "✨ DNS sync complete for ${DOMAIN}"
echo "   Updated CNAMEs: www, app, pay"
