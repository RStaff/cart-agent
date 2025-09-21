#!/usr/bin/env bash
set -euo pipefail

usage(){ echo "Usage: $0 [--domain <domain>] [--service <render-service-name>] [--apply] [--dry-run]"; exit 1; }
DOMAIN="${DOMAIN:-}"; SERVICE_NAME="${SERVICE_NAME:-}"; APPLY=false; DRY=false
while [ $# -gt 0 ]; do
  case "$1" in
    --domain)  DOMAIN="${2:-}"; shift 2;;
    --service) SERVICE_NAME="${2:-}"; shift 2;;
    --apply)   APPLY=true; shift;;
    --dry-run) DRY=true; shift;;
    *) usage;;
  esac
done

need(){ command -v "$1" >/dev/null 2>&1 || { echo "❌ missing: $1"; exit 127; }; }
need curl; need jq
: "${STRIPE_SECRET_KEY:?Set STRIPE_SECRET_KEY in the environment or GitHub secret}"
: "${RENDER_API_KEY:?Set RENDER_API_KEY in the environment or GitHub secret}"

json_ok(){ jq . >/dev/null 2>&1; }
die_http(){ code="$1"; body="$2"; echo "❌ HTTP $code"; printf '%s\n' "$body" | head -c 600; echo; exit 1; }

# --- find service via Owners API (works for all accounts) ---
OWNERS_RES="$(curl -sS -w $'\nHTTP:%{http_code}\n' -H "Authorization: Bearer $RENDER_API_KEY" https://api.render.com/v1/owners)"
OWNERS_CODE="$(printf '%s' "$OWNERS_RES" | sed -n '$s/^HTTP://p')"
OWNERS_BODY="$(printf '%s' "$OWNERS_RES" | sed '$d')"
[ "$OWNERS_CODE" = "200" ] || die_http "$OWNERS_CODE" "$OWNERS_BODY"
echo "$OWNERS_BODY" | json_ok || { echo "❌ owners not JSON"; exit 1; }

SERVICES_JSON='[]'
for oid in $(echo "$OWNERS_BODY" | jq -r '.[].id'); do
  SRES="$(curl -sS -w $'\nHTTP:%{http_code}\n' -H "Authorization: Bearer $RENDER_API_KEY" "https://api.render.com/v1/owners/$oid/services")"
  SCODE="$(printf '%s' "$SRES" | sed -n '$s/^HTTP://p')"
  SBODY="$(printf '%s' "$SRES" | sed '$d')"
  [ "$SCODE" = "200" ] || die_http "$SCODE" "$SBODY"
  SERVICES_JSON="$(jq -s '.[0] + .[1]' <(echo "$SERVICES_JSON") <(echo "$SBODY"))"
done

if [ -n "$DOMAIN" ]; then
  RENDER_SERVICE_ID="$(echo "$SERVICES_JSON" | jq -r --arg d "$DOMAIN" '.[] | select((.serviceDetails.url // "") | contains($d)) | .id' | head -n1)"
fi
if [ -z "${RENDER_SERVICE_ID:-}" ] && [ -n "$SERVICE_NAME" ]; then
  RENDER_SERVICE_ID="$(echo "$SERVICES_JSON" | jq -r --arg n "$SERVICE_NAME" '.[] | select(.name==$n) | .id' | head -n1)"
fi
if [ -z "${RENDER_SERVICE_ID:-}" ]; then
  echo "❌ Could not find Render service (domain='$DOMAIN' name='$SERVICE_NAME'). Available:"
  echo "$SERVICES_JSON" | jq -r '.[] | "\(.id)\t\(.name)\t\(.serviceDetails.url // "-")"'
  exit 1
fi
echo "✅ Using Render service: $RENDER_SERVICE_ID"

# --- Stripe: pull recurring prices and map them ---
PRES="$(curl -sS -w $'\nHTTP:%{http_code}\n' -u "$STRIPE_SECRET_KEY:" -G https://api.stripe.com/v1/prices \
  --data-urlencode active=true --data-urlencode limit=100 --data-urlencode "expand[]=data.product")"
PCODE="$(printf '%s' "$PRES" | sed -n '$s/^HTTP://p')"
PBODY="$(printf '%s' "$PRES" | sed '$d')"
[ "$PCODE" = "200" ] || die_http "$PCODE" "$PBODY"
echo "$PBODY" | json_ok || { echo "❌ Stripe response not JSON"; exit 1; }

find_price(){ # $1 needle (basic|growth|pro), $2 interval (month|year)
  printf '%s' "$PBODY" \
  | jq -r --arg n "$1" --arg i "$2" '
      .data[] | select(.recurring!=null)
      | select((.nickname // .product.name // "") | ascii_downcase | test($n))
      | select(.recurring.interval==$i) | .id' | head -n1
}
# Known-good fallbacks from your last dump
FALL_BASIC_M="price_1S773UJyylmUTExqPN3XO6oE"
FALL_GROWTH_M="price_1S7n40JyylmUTExqlkVFyeJN"
FALL_PRO_M="price_1S7n4HJyylmUTExqgIrntgZm"
FALL_BASIC_Y="price_1S9UTPJyylmUTExqJ3wwSrwR"
FALL_GROWTH_Y="price_1S9V2yJyylmUTExqMZ2BQyoV"
FALL_PRO_Y="price_1S9UruJyylmUTExqdzLaTxJ0"

BASIC_M="$(find_price basic month)";   [ -n "$BASIC_M" ]   || BASIC_M="$FALL_BASIC_M"
GROWTH_M="$(find_price growth month)"; [ -n "$GROWTH_M" ]  || GROWTH_M="$FALL_GROWTH_M"
PRO_M="$(find_price pro month)";       [ -n "$PRO_M" ]     || PRO_M="$FALL_PRO_M"
BASIC_Y="$(find_price basic year)";    [ -n "$BASIC_Y" ]   || BASIC_Y="$FALL_BASIC_Y"
GROWTH_Y="$(find_price growth year)";  [ -n "$GROWTH_Y" ]  || GROWTH_Y="$FALL_GROWTH_Y"
PRO_Y="$(find_price pro year)";        [ -n "$PRO_Y" ]     || PRO_Y="$FALL_PRO_Y"

echo "📦 Will sync:"
printf '  Basic  (monthly)  %s\n' "$BASIC_M"
printf '  Growth (monthly)  %s\n' "$GROWTH_M"
printf '  Pro    (monthly)  %s\n' "$PRO_M"
printf '  Basic  (yearly)   %s\n' "$BASIC_Y"
printf '  Growth (yearly)   %s\n' "$GROWTH_Y"
printf '  Pro    (yearly)   %s\n' "$PRO_Y"

ENV_BODY="$(jq -n \
  --arg s  "$BASIC_M"  --arg g  "$GROWTH_M"  --arg p  "$PRO_M" \
  --arg sy "$BASIC_Y"  --arg gy "$GROWTH_Y"  --arg py "$PRO_Y" '
  { envVars: [
      {key:"STRIPE_PRICE_STARTER",        value:$s},
      {key:"STRIPE_PRICE_SCALE",          value:$g},
      {key:"STRIPE_PRICE_PRO",            value:$p},
      {key:"STRIPE_PRICE_STARTER_YEARLY", value:$sy},
      {key:"STRIPE_PRICE_SCALE_YEARLY",   value:$gy},
      {key:"STRIPE_PRICE_PRO_YEARLY",     value:$py}
  ] }')"

if $DRY && ! $APPLY; then
  echo "🔎 Dry-run only. Would PUT this JSON to Render:"; echo "$ENV_BODY" | jq .
  exit 0
fi

PUT_RES="$(curl -sS -w $'\nHTTP:%{http_code}\n' -X PUT "https://api.render.com/v1/services/$RENDER_SERVICE_ID/env-vars" \
  -H "Authorization: Bearer $RENDER_API_KEY" -H "Content-Type: application/json" -d "$ENV_BODY")"
PUT_CODE="$(printf '%s' "$PUT_RES" | sed -n '$s/^HTTP://p')"
PUT_BODY="$(printf '%s' "$PUT_RES" | sed '$d')"
[ "$PUT_CODE" = "200" ] || die_http "$PUT_CODE" "$PUT_BODY"
echo "⬆️  Render env vars updated."

DEP_RES="$(curl -sS -w $'\nHTTP:%{http_code}\n' -X POST "https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys" \
  -H "Authorization: Bearer $RENDER_API_KEY" -H "Content-Type: application/json" -d '{"clearCache":false}')"
DEP_CODE="$(printf '%s' "$DEP_RES" | sed -n '$s/^HTTP://p')"
DEP_BODY="$(printf '%s' "$DEP_RES" | sed '$d')"
[ "$DEP_CODE" = "201" ] || die_http "$DEP_CODE" "$DEP_BODY"
echo "🚀 Deploy started."
