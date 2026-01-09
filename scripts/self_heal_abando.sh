#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${HOME}/projects/cart-agent"
SCRIPTS_DIR="$ROOT_DIR/scripts"

ABANDO_MARKETING="https://abando.ai"
ABANDO_FRONTEND_HEALTH="https://abando.ai/api/health"
ABANDO_EMBEDDED="https://app.abando.ai/embedded"
ABANDO_PAY_HEALTH="https://pay.abando.ai/api/health"
ABANDO_RENDER_HEALTH="https://cart-agent-api.onrender.com/health"

failed_frontend=0
failed_backend=0

check() {
  local name="$1"
  local url="$2"
  local role="$3"   # frontend | backend | other

  echo "→ $name ($url)"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")

  if [[ "$code" == "200" || "$code" == "204" || "$code" == "307" ]]; then
    echo "   ✅ OK ($code)"
  else
    echo "   ❌ FAILED ($code)"
    if [[ "$role" == "frontend" ]]; then
      failed_frontend=1
    elif [[ "$role" == "backend" ]]; then
      failed_backend=1
    fi
  fi
  echo
}

echo "🔁 Abando.ai self-heal check started…"
echo

check "Marketing site" "$ABANDO_MARKETING" "other"
check "Frontend /api/health" "$ABANDO_FRONTEND_HEALTH" "frontend"
check "Embedded app shell" "$ABANDO_EMBEDDED" "other"
check "Checkout API (via pay.abando.ai)" "$ABANDO_PAY_HEALTH" "backend"
check "Checkout API (Render origin)" "$ABANDO_RENDER_HEALTH" "backend"

echo "📊 Summary:"
echo "   Frontend unhealthy? $failed_frontend"
echo "   Backend unhealthy?  $failed_backend"
echo

if [[ "$failed_frontend" -eq 1 ]]; then
  if [[ -x "$SCRIPTS_DIR/deploy_frontend.sh" ]]; then
    echo "🛠 Frontend issues detected → triggering deploy_frontend.sh…"
    "$SCRIPTS_DIR/deploy_frontend.sh"
  else
    echo "⚠ Frontend issues detected but scripts/deploy_frontend.sh not found."
  fi
  echo
fi

if [[ "$failed_backend" -eq 1 ]]; then
  if [[ -x "$SCRIPTS_DIR/deploy_backend.sh" ]]; then
    echo "🛠 Backend issues detected → triggering deploy_backend.sh…"
    "$SCRIPTS_DIR/deploy_backend.sh"
  else
    echo "⚠ Backend issues detected but scripts/deploy_backend.sh not found."
  fi
  echo
fi

if [[ "$failed_frontend" -eq 0 && "$failed_backend" -eq 0 ]]; then
  echo "✅ All core services healthy. No healing required."
else
  echo "✨ Self-heal run complete. Check logs above for actions taken."
fi
