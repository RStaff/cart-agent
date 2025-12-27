#!/usr/bin/env bash
set -euo pipefail

FILE="abando-frontend/vercel.json"
mkdir -p abando-frontend
cp -f "$FILE" "$FILE.bak_$(date +%s)" 2>/dev/null || true

cat > "$FILE" <<'JSON'
{
  "framework": "nextjs"
}
JSON

echo "✅ Wrote abando-frontend/vercel.json forcing Next.js"
