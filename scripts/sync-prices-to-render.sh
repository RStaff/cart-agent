#!/usr/bin/env bash
set -euo pipefail

# ---------- args ----------
usage(){ echo "Usage: $0 [--domain abando.ai | --service <render-service-name>] [--apply]"; exit 1; }
DOMAIN="abando.ai"; SERVICE_NAME=""; APPLY="false"
while [ $# -gt 0 ]; do
  case "$1" in
    --domain)   DOMAIN="${2:-}"; shift 2;;
    --service)  SERVICE_NAME="${2:-}"; shift 2;;
    --apply)    APPLY="true"; shift;;
    *) usage;;
  esac
done

# ---------- hard requirements ----------
need(){ command -v "$1" >/dev/null 2>&1 || { echo "❌ missing: $1"; exit 1; }; }
need curl; need jq
: "${STRIPE_SECRET_KEY:?Set STRIPE_SECRET_KEY in the shell or .env (starts with sk_live_...)}"
: "${RENDER_API_KEY:?Set RENDER_API_KEY in the shell (Render dashboard -> API Keys)}"

# ---------- helpers ----------
json_ok(){ jq . >/dev/null 2>&1; }

die_http(){ code="$1"; body="$2"; echo "❌ HTTP $code"; printf '%s\n' "$body" | head -c 500; echo; exit 1; }

# ---------- Render: list services & pick one ----------
SERVICES_RES="$(curl -sS -w $'\nHTTP:%{http_code}\n' -H "Authorization: Bearer $RENDER_API_KEY" https://api.render.com/v1/services)"
SERVICES_CODE="$(printf '%s' "$SERVICES_RES" | sed -n '$s/^HTTP://p')"
SERVICES_BODY="$(printf '%s' "$SERVICES_RES" | sed '$d')"
[ "$SERVICES_CODE" = "200" ] || die_http "$SERVICES_CODE" "$SERVICES_BODY"
echo "$SERVICES_BODY" | json_ok || { echo "❌ Render services response not JSON"; echo "$SERVICES_BODY" | head -c 400; exit 1; }

if [ -n "$SERVICE_NAME" ]; then
  RENDER_SERVICE_ID="$(echo "$SERVICES_BODY" | jq -r --arg n "$SERVICE_NAME" '.[] | select(.name==$n) | .id' | head -n1)"
else
  RENDER_SERVICE_ID="$(echo "$SERVICES_BODY" | jq -r --arg d "$DOMAIN" '.[] | select((.serviceDetails.url? // "") | contains($d)) | .id' | head -n1)"
fi
[ -n "${RENDER_SERVICE_ID:-}" ] || { echo "❌ Could not find Render service (domain=$DOMAIN name=$SERVICE_NAME)"; echo "$SERVICES_BODY" | jq -r '.[] | "\(.id)\t\(.name)\t\(.serviceDetails.url // "-")"'; exit 1; }
echo "✅ Render service: $RENDER_SERVICE_ID"

# ---------- Stripe: fetch prices ----------
PRICES_RES="$(curl -sS -w $'\nHTTP:%{http_code}\n' -u "$STRIPE_SECRET_KEY:" -G https://api.stripe.com/v1/prices \
  --data-urlencode active=true --data-urlencode limit=100 --data-urlencode "expand[]=data.product")"
PRICES_CODE="$(printf '%s' "$PRICES_RES" | sed -n '$s/^HTTP://p')"
PRICES_BODY="$(printf '%s' "$PRICES_RES" | sed '$d')"
[ "$PRICES_CODE" = "200" ] || die_http "$PRICES_CODE" "$PRICES_BODY"
echo "$PRICES_BODY" | json_ok || { echo "❌ Stripe prices response not JSON"; echo "$PRICES_BODY" | head -c 400; exit 1; }

find_price(){ # $1 needle (basic|growth|pro), $2 interval (month|year)
  printf '%s' "$PRICES_BODY" \
  | jq -r --arg n "$1" --arg i "$2" '
      .data[] | select(.recurring!=null)
      | select((.nickname // .product.name // "") | ascii_downcase | contains($n))
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

echo "📦 Price IDs to sync:"
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

if [ "$APPLY" != "true" ]; then
  echo "🔎 Dry-run (no changes). Would send:"
  echo "$ENV_BODY" | jq .
  exit 0
fi

# ---------- PUT env vars ----------
PUT_RES="$(curl -sS -w $'\nHTTP:%{http_code}\n' -X PUT "https://api.render.com/v1/services/$RENDER_SERVICE_ID/env-vars" \
  -H "Authorization: Bearer $RENDER_API_KEY" -H "Content-Type: application/json" -d "$ENV_BODY")"
PUT_CODE="$(printf '%s' "$PUT_RES" | sed -n '$s/^HTTP://p')"
PUT_BODY="$(printf '%s' "$PUT_RES" | sed '$d')"
[ "$PUT_CODE" = "200" ] || die_http "$PUT_CODE" "$PUT_BODY"
echo "⬆️  Render env vars updated."

# ---------- trigger deploy ----------
DEP_RES="$(curl -sS -w $'\nHTTP:%{http_code}\n' -X POST "https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys" \
  -H "Authorization: Bearer $RENDER_API_KEY" -H "Content-Type: application/json" -d '{"clearCache":false}')"
DEP_CODE="$(printf '%s' "$DEP_RES" | sed -n '$s/^HTTP://p')"
DEP_BODY="$(printf '%s' "$DEP_RES" | sed '$d')"
[ "$DEP_CODE" = "201" ] || die_http "$DEP_CODE" "$DEP_BODY"
echo "🚀 Deploy started."
