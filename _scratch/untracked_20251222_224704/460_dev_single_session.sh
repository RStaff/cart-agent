#!/usr/bin/env bash
set -euo pipefail
cd ~/projects/cart-agent || exit 1

echo "🧹 Killing listeners on 3000/3001/3457 and Shopify random ports (52000-59999)..."
ports=(3000 3001 3457)
for p in "${ports[@]}"; do
  lsof -tiTCP:"$p" -sTCP:LISTEN 2>/dev/null | xargs -r kill -9 || true
done

# kill random Shopify ports range
for pid in $(lsof -tiTCP -sTCP:LISTEN 2>/dev/null | uniq); do :; done 2>/dev/null || true
# targeted by ports:
lsof -nP -iTCP -sTCP:LISTEN 2>/dev/null | awk '
/:5[2-9][0-9]{3} \(LISTEN\)/ {print $2}
' | sort -u | xargs -r kill -9 || true

echo "✅ Ports cleared. Sanity:"
lsof -nP -iTCP -sTCP:LISTEN | egrep ":(3000|3001|3457|5[2-9][0-9]{3})\b" || echo "✅ clean"

echo
echo "🚀 Starting ONE dev session..."
exec shopify app dev --reset
