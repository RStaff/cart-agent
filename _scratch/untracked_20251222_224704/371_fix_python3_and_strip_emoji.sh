#!/usr/bin/env bash
set -euo pipefail

fix_file () {
  local f="$1"
  test -f "$f" || { echo "❌ Missing $f"; exit 1; }
  cp "$f" "$f.bak_$(date +%s)"

  # 1) python -> python3
  perl -0777 -i -pe 's/\bpython\b/python3/g' "$f"

  # 2) Remove any naked lines that start with emoji (they must be echo'ed or commented)
  #    This catches lines like: 🔎 Fetching...
  perl -0777 -i -pe 's/^\s*[\x{1F300}-\x{1FAFF}].*\n//mg' "$f"

  echo "✅ Fixed $f"
}

fix_file scripts/369_pick_secret_matching_server_fp.sh
fix_file scripts/370_send_signed_webhook.sh

echo
echo "NEXT: rerun -> ./scripts/370_send_signed_webhook.sh .shopify_dev.log checkouts/update cart-agent-dev.myshopify.com"
