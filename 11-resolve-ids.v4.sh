#!/usr/bin/env bash
set -Eeuo pipefail
die(){ echo "✖ $*" >&2; exit 1; }
: "${CF_API_TOKEN:?Set CF_API_TOKEN (export CF_API_TOKEN=...)}"
: "${AB_DOMAIN:?Set AB_DOMAIN (export AB_DOMAIN=abando.ai)}"

echo "AB_DOMAIN: $AB_DOMAIN"

req(){
  local url="$1"; local hdr="$2"; local body="$3"
  curl -sS -D "$hdr" -o "$body" -H "Authorization: Bearer ${CF_API_TOKEN}" "$url" >/dev/null || true
  code="$(awk 'NR==1{print $2}' "$hdr")"
  ctype="$(awk -F': ' 'tolower($1)=="content-type"{print $2}' "$hdr" | tr -d '\r' | head -n1)"
  echo "$code" "$ctype"
}

# zones by name
Z_HDR="$(mktemp)"; Z_BODY="$(mktemp)"
read -r Z_CODE Z_TYPE < <(req "https://api.cloudflare.com/client/v4/zones?name=${AB_DOMAIN}" "$Z_HDR" "$Z_BODY")
[ "$Z_CODE" = "200" ] || { sed -n '1,30p' "$Z_HDR"; die "zones lookup HTTP $Z_CODE"; }
printf %s "$Z_TYPE" | grep -qi 'application/json' || die "zones lookup not JSON"

COUNT="$(python3 - <<'PY' "$Z_BODY" || echo 0
import json,sys
d=json.load(open(sys.argv[1])); print(len(d.get("result",[])))
PY
)"
[ "$COUNT" -gt 0 ] || die "No zones matched '${AB_DOMAIN}' with this token."

read -r CF_ZONE_ID CF_ACCOUNT_ID Z_NAME <<EOF
$(python3 - <<'PY' "$Z_BODY"
import json,sys
d=json.load(open(sys.argv[1])); z=d.get("result",[{}])[0]
print(z.get("id",""), z.get("account",{}).get("id",""), z.get("name",""))
PY
)
EOF

[ -n "$CF_ZONE_ID" ] || die "missing CF_ZONE_ID"
[ -n "$CF_ACCOUNT_ID" ] || die "missing CF_ACCOUNT_ID"

echo "✓ CF_ZONE_ID     = $CF_ZONE_ID"
echo "✓ CF_ACCOUNT_ID  = $CF_ACCOUNT_ID"
echo "✓ Zone (confirm) = ${Z_NAME:-$AB_DOMAIN}"
echo
echo "Export for this shell:"
echo "  export CF_ZONE_ID=\"$CF_ZONE_ID\""
echo "  export CF_ACCOUNT_ID=\"$CF_ACCOUNT_ID\""
