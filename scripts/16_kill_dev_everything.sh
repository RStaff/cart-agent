#!/usr/bin/env bash
set -euo pipefail

echo "== Kill dev processes (Shopify + cloudflared + backend + Next) =="

pkill -f "shopify app dev" || true
pkill -f cloudflared || true
pkill -f "node src/index.js" || true
pkill -f "next dev" || true
pkill -f "PORT=3000 npm run dev" || true

echo
echo "== Kill listeners on common ports (best effort) =="
for p in 3000 3457; do
  lsof -nP -iTCP:$p -sTCP:LISTEN -t 2>/dev/null | xargs -r kill -9 || true
done

# also kill any listeners in 60800-61200 range (where Shopify dev tends to land)
lsof -nP -iTCP -sTCP:LISTEN | awk '
  $0 ~ /LISTEN/ && $0 ~ /:60(8|9)[0-9][0-9][0-9]/ {print $2}
  $0 ~ /LISTEN/ && $0 ~ /:61(0|1)[0-9][0-9][0-9]/ {print $2}
' | sort -u | xargs -r kill -9 || true

echo "✅ Done."
