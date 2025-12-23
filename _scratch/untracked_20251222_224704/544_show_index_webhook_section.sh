#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

echo "===== INDEX.JS: webhook-related lines ====="
nl -ba "$FILE" | sed -n '70,210p' | rg -n "api/webhooks|webhooksRouter|handler_ok_send|shopify|raw|hmac|triggered|topic|next\\(|res\\.status\\(|send\\(" -n || true

echo
echo "===== FULL 70-210 CONTEXT (so we can see braces) ====="
nl -ba "$FILE" | sed -n '70,210p'
