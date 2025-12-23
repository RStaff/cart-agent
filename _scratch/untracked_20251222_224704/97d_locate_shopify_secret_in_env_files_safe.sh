#!/usr/bin/env bash
set -euo pipefail

keys=(SHOPIFY_API_SECRET SHOPIFY_API_SECRET_KEY SHOPIFY_APP_SECRET SHOPIFY_SECRET)

check_file () {
  local f="$1"
  if [ ! -f "$f" ]; then
    echo "↪ $f (missing)"
    return
  fi
  echo "📄 $f"
  for k in "${keys[@]}"; do
    if grep -qE "^${k}=" "$f"; then
      # Show only the key name + value length (safe)
      val="$(grep -E "^${k}=" "$f" | tail -n 1 | sed "s/^${k}=//")"
      echo "  ✔ ${k}: present (len=${#val})"
    else
      echo "  ✖ ${k}: absent"
    fi
  done
}

echo "🔎 Locating Shopify secret keys in env files (safe):"
check_file ".env"
check_file "web/.env"
