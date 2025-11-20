#!/usr/bin/env bash
set -euo pipefail

########################################
# Config
########################################

# Your domain
DOMAIN="abando.ai"

# Targets – you can override via CLI args if needed
CNAME_WWW="${1:-abando-frontend-jf7tdapnl-ross-projects-1d9d3b7c.vercel.app}"
CNAME_APP="${2:-$CNAME_WWW}"
CNAME_PAY="${3:-cart-agent-api.onrender.com}"

# ✅ CORRECT Hostinger DNS API base
API_BASE="https://developers.hostinger.com/api/dns/v1"

########################################
# Safety checks
########################################

if [[ -z "${HOSTINGER_API_TOKEN:-}" ]]; then
  echo "❌ HOSTINGER_API_TOKEN is not set."
  echo "   Run this in your shell first (with your real token):"
  echo "   export HOSTINGER_API_TOKEN='YOUR_REAL_TOKEN_HERE'"
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "❌ jq is required but not installed. Install with:"
  echo "   brew install jq"
  exit 1
fi

########################################
# Build body + call API
########################################

echo "🔐 Syncing DNS on Hostinger for: ${DOMAIN}"
echo "   www → ${CNAME_WWW}"
echo "   app → ${CNAME_APP}"
echo "   pay → ${CNAME_PAY}"
echo

# We send only the records we care about.
# overwrite=false ⇒ Hostinger merges these into the existing zone.
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

echo
echo "✨ DNS sync complete for ${DOMAIN}"
echo "   Updated CNAMEs: www, app, pay"
