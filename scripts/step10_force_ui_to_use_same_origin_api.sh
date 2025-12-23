#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

echo "🔧 Forcing UI to use same-origin /api/* (works with our Next rewrite proxy)..."

# Patch likely API helper(s) if they exist
candidates=(
  "abando-frontend/lib/api.ts"
  "abando-frontend/lib/api.js"
  "abando-frontend/lib/server.ts"
  "abando-frontend/lib/server.js"
  "abando-frontend/app/lib/api.ts"
  "abando-frontend/app/lib/api.js"
  "abando-frontend/src/lib/api.ts"
  "abando-frontend/src/lib/api.js"
)

patched=0
for f in "${candidates[@]}"; do
  if [ -f "$f" ]; then
    cp "$f" "$f.bak_$(date +%s)" || true

    # Replace hard-coded localhost:3000 with same-origin
    perl -0777 -i -pe 's#http://localhost:3000/api/#/api/#g; s#http://127\.0\.0\.1:3000/api/#/api/#g' "$f"

    echo "✅ Patched: $f"
    patched=1
  fi
done

# Also patch the embedded page directly (common place for fetch)
EMBED="abando-frontend/app/embedded/page.tsx"
if [ -f "$EMBED" ]; then
  cp "$EMBED" "$EMBED.bak_$(date +%s)" || true
  perl -0777 -i -pe 's#http://localhost:3000/api/#/api/#g; s#http://127\.0\.0\.1:3000/api/#/api/#g' "$EMBED"
  echo "✅ Patched: $EMBED"
  patched=1
fi

if [ "$patched" -eq 0 ]; then
  echo "⚠️ No known API files found to patch automatically."
  echo "Tell me where getStatus()/fetch calls live and I’ll patch that exact file."
fi

echo "NEXT:"
echo "  restart: lsof -ti tcp:3000 | xargs -r kill -9; lsof -ti tcp:3001 | xargs -r kill -9"
echo "  then:    ./scripts/dev.sh example.myshopify.com"
