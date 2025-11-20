#!/usr/bin/env bash
set -euo pipefail

DOMAIN="abando.ai"

# Expected CNAME targets (from Vercel + Render)
EXPECTED_WWW="e73a762f08ffef0c.vercel-dns-017.com."
EXPECTED_APP="4ab6828cccbdbb3.vercel-dns-017.com."
EXPECTED_PAY="cart-agent-api.onrender.com."

check_cname () {
  local host="$1"
  local expected="$2"

  echo "🔎 Checking CNAME for ${host}.${DOMAIN} …"

  # Try dig first, fall back to host
  if command -v dig >/dev/null 2>&1; then
    actual="$(dig +short CNAME "${host}.${DOMAIN}" || true)"
  else
    actual="$(host -t CNAME "${host}.${DOMAIN}" 2>/dev/null | awk '/is an alias for/ {print $NF}' || true)"
  fi

  if [[ -z "$actual" ]]; then
    echo "  ❌ No CNAME found (got empty result)"
    echo
    return
  fi

  echo "  • Actual:   ${actual}"
  echo "  • Expected: ${expected}"

  # Normalize trailing dots
  norm_actual="${actual%.}"
  norm_expected="${expected%.}"

  if [[ "$norm_actual" == "$norm_expected" ]]; then
    echo "  ✅ MATCH"
  else
    echo "  ❌ MISMATCH"
  fi
  echo
}

check_cname "www" "$EXPECTED_WWW"
check_cname "app" "$EXPECTED_APP"
check_cname "pay" "$EXPECTED_PAY"

echo "✨ DNS check complete."
