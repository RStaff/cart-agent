#!/usr/bin/env bash
set -euo pipefail

ABANDO_MARKETING="https://abando.ai"
ABANDO_FRONTEND_HEALTH="https://abando.ai/api/health"
ABANDO_EMBEDDED="https://app.abando.ai/embedded"
ABANDO_PAY_HEALTH="https://pay.abando.ai/api/health"
ABANDO_RENDER_HEALTH="https://cart-agent-api.onrender.com/health"

echo "🔎 Checking Abando.ai full stack…"
echo

check() {
  local name="$1"
  local url="$2"

  echo "→ $name ($url)"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")

  if [[ "$code" == "200" || "$code" == "204" || "$code" == "307" ]]; then
    echo "   ✅ OK ($code)"
  else
    echo "   ❌ FAILED ($code)"
  fi
  echo
}

check "Marketing site" "$ABANDO_MARKETING"
check "Frontend /api/health" "$ABANDO_FRONTEND_HEALTH"
check "Embedded app shell" "$ABANDO_EMBEDDED"
check "Checkout API (via pay.abando.ai)" "$ABANDO_PAY_HEALTH"
check "Checkout API (Render origin)" "$ABANDO_RENDER_HEALTH"

echo "✨ DNS + health check complete."
