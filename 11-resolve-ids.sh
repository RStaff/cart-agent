#!/usr/bin/env bash
set -Eeuo pipefail

: "${CF_API_TOKEN:?Set CF_API_TOKEN first (export CF_API_TOKEN=...)}"
: "${AB_DOMAIN:?Set AB_DOMAIN first (export AB_DOMAIN=abando.ai)}"

echo "Verifying token..."
curl -sS -H "Authorization: Bearer $CF_API_TOKEN" \
  https://api.cloudflare.com/client/v4/user/tokens/verify \
| python3 - <<'PY'
import sys,json
d=json.load(sys.stdin)
ok = d.get("success") and d.get("result",{}).get("status") == "active"
print("status:", "active ✅" if ok else "NOT ACTIVE ❌")
PY

echo "Resolving Account ID..."
export CF_ACCOUNT_ID="$(
  curl -sS -H "Authorization: Bearer $CF_API_TOKEN" https://api.cloudflare.com/client/v4/accounts \
  | python3 - <<'PY'
import sys,json
d=json.load(sys.stdin)
acc = d.get("result", [])
print(acc[0]["id"] if acc else "", end="")
PY
)"
[ -n "$CF_ACCOUNT_ID" ] || { echo "Account list empty. Token likely lacks Account read scope."; exit 1; }

echo "Resolving Zone ID for ${AB_DOMAIN}..."
export CF_ZONE_ID="$(
  curl -sS -H "Authorization: Bearer $CF_API_TOKEN" "https://api.cloudflare.com/client/v4/zones?name=${AB_DOMAIN}" \
  | python3 - <<'PY'
import sys,json
d=json.load(sys.stdin)
zones = d.get("result", [])
print(zones[0]["id"] if zones else "", end="")
PY
)"
[ -n "$CF_ZONE_ID" ] || { echo "Zone query empty. Ensure the domain exists in your CF account and token has Zone read scope."; exit 1; }

echo "ACCOUNT: $CF_ACCOUNT_ID"
echo "ZONE:    $CF_ZONE_ID"
