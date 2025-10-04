#!/usr/bin/env sh
set -eu
echo "→ Stripe env check"
prod=${NODE_ENV:-development}
need_key=1
[ "${prod}" = "production" ] && need_key=1 || need_key=0

missing=0
if [ "$need_key" -eq 1 ]; then
  if [ -z "${STRIPE_SECRET_KEY:-}" ]; then echo "❌ STRIPE_SECRET_KEY is missing"; missing=1; fi
fi

# Plan -> price mapping may come via individual vars or JSON map
# Accepted:
#   STRIPE_PRICE_BASIC, STRIPE_PRICE_GROWTH, STRIPE_PRICE_PRO
#   or STRIPE_PRICE_MAP='{"basic":"price_...","growth":"price_..."}'
if [ -n "${STRIPE_PRICE_MAP:-}" ]; then
  echo "✓ STRIPE_PRICE_MAP detected"
else
  for p in BASIC GROWTH PRO; do
    eval v=\$STRIPE_PRICE_${p:-}
    if [ -z "${v:-}" ]; then
      echo "ℹ️ STRIPE_PRICE_${p} not set (ok if using STRIPE_PRICE_MAP)"
    else
      echo "✓ STRIPE_PRICE_${p}=${v}"
    fi
  done
fi

if [ "${missing}" -eq 1 ]; then
  echo "💥 Missing required vars for production."
  exit 1
fi
echo "✅ Stripe env check OK"
