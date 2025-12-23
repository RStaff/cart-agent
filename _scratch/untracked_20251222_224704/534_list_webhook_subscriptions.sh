#!/usr/bin/env bash
set -euo pipefail

cd ~/projects/cart-agent || exit 1

# You need an Admin API access token for the dev store (custom app token) OR a saved token from your app install flow.
# Common env var names people use:
TOKEN="${SHOPIFY_ADMIN_ACCESS_TOKEN:-${ADMIN_ACCESS_TOKEN:-}}"
SHOP="${SHOPIFY_SHOP_DOMAIN:-cart-agent-dev.myshopify.com}"

if [ -z "${TOKEN}" ]; then
  echo "❌ Missing admin token. Export one of:"
  echo "   export SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_..."
  echo "   export ADMIN_ACCESS_TOKEN=shpat_..."
  exit 1
fi

Q='{"query":"{ webhookSubscriptions(first: 50) { edges { node { id topic endpoint { __typename ... on WebhookHttpEndpoint { callbackUrl } } } } } }"}'

curl -sS "https://${SHOP}/admin/api/2025-01/graphql.json" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Access-Token: ${TOKEN}" \
  --data "${Q}" | python3 - <<'PY'
import json,sys
d=json.load(sys.stdin)
edges=d.get("data",{}).get("webhookSubscriptions",{}).get("edges",[])
print(f"Found {len(edges)} webhookSubscriptions")
for e in edges:
  n=e["node"]
  ep=n.get("endpoint",{})
  url=ep.get("callbackUrl") if ep.get("__typename")=="WebhookHttpEndpoint" else str(ep)
  print(f"- {n.get('topic'):24s}  {url}")
PY
