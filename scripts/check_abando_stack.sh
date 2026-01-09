#!/usr/bin/env bash
set -euo pipefail

check() {
  local label="$1"
  local url="$2"
  echo
  echo "→ $label ($url)"
  local code
  code="$(curl -sS -o /dev/null -w "%{http_code}" -L "$url" || true)"
  if [[ "$code" =~ ^2|3 ]]; then
    echo "   ✅ OK ($code)"
  else
    echo "   ❌ FAILED ($code)"
  fi
}

echo
echo "🔎 Checking Abando.ai full stack…"

check "Marketing site" "https://abando.ai"
check "Frontend /api/health" "https://abando.ai/api/health"
check "Embedded app shell" "https://app.abando.ai/embedded"

# IMPORTANT: canonical health path is /health (not /api/health)
check "Checkout API (via pay.abando.ai)" "https://pay.abando.ai/health"
check "Checkout API (Render origin)" "https://cart-agent-api.onrender.com/health"

echo
echo "✨ DNS + health check complete."
