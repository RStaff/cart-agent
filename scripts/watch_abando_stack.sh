#!/usr/bin/env bash
set -euo pipefail

# Simple status probe for Abando stack (quiet mode).
# Ctrl+C to stop.

ABANDO_MARKETING="https://abando.ai"
ABANDO_EMBEDDED="https://app.abando.ai/embedded"
ABANDO_PAY_HEALTH="https://pay.abando.ai/api/health"
ABANDO_RENDER_HEALTH="https://cart-agent-api.onrender.com/api/health"

check() {
  local label="$1" url="$2" show_body="${3:-false}"
  local status json
  status=$(curl -s -o /tmp/abando_check_body -w "%{http_code}" "$url" || echo "000")
  json=$(cat /tmp/abando_check_body 2>/dev/null || echo "")

  # Treat 2xx and 3xx as OK (Vercel likes 307 redirects)
  if [[ "$status" =~ ^2..$ || "$status" =~ ^3..$ ]]; then
    echo "✅ $label ($url) → $status"
    if [[ "$show_body" == "true" && -n "$json" ]]; then
      echo "   body: $json"
    fi
  else
    echo "❌ $label ($url) → $status"
    [[ -n "$json" ]] && echo "   body: $json"
  fi
}

while true; do
  echo
  echo "🔎 Abando status $(date '+%Y-%m-%d %H:%M:%S')"

  # Marketing: status only, no body spam
  check "Marketing site"        "$ABANDO_MARKETING" "false"

  # Embedded HTML is huge; just show status
  check "Embedded app shell"    "$ABANDO_EMBEDDED" "false"

  # APIs: show body (small JSON)
  check "Checkout API (pay)"    "$ABANDO_PAY_HEALTH" "true"
  check "Checkout API (Render)" "$ABANDO_RENDER_HEALTH" "true"

  echo "--------------------------------------------"
  sleep 60
done
