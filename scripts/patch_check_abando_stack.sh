#!/usr/bin/env bash
set -euo pipefail

cat > scripts/check_abando_stack.sh << 'INNER'
#!/usr/bin/env bash
set -euo pipefail

echo "🔎 Checking Abando.ai full stack…"
echo

check() {
  local name="$1"
  local url="$2"
  echo "→ $name ($url)"

  # Try curl, but if it fails (TLS error, etc.), capture that as "000"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 5 "$url" 2>/dev/null || echo "000")

  if [[ "$code" == "200" || "$code" == "204" ]]; then
    echo "   ✅ OK ($code)"
  elif [[ "$code" == "000" ]]; then
    echo "   ❌ FAILED (TLS / connection error)"
  else
    echo "   ❌ FAILED ($code)"
  fi
  echo
}

check "Marketing site"                    "https://abando.ai"
check "Embedded app shell"               "https://app.abando.ai/embedded"
check "Checkout API (via pay.abando.ai)" "https://pay.abando.ai/api/health"
check "Checkout API (Render origin)"     "https://cart-agent-api.onrender.com/health"

echo "✨ Done."
INNER

chmod +x scripts/check_abando_stack.sh
echo "✅ check_abando_stack.sh patched."
