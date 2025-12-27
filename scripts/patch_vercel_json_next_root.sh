#!/usr/bin/env bash
set -euo pipefail

FILE="vercel.json"
cp -f "$FILE" "$FILE.bak_$(date +%s)" 2>/dev/null || true

cat > "$FILE" <<'JSON'
{
  "framework": "nextjs",
  "rootDirectory": "abando-frontend"
}
JSON

echo "✅ Wrote vercel.json forcing Next.js + rootDirectory=abando-frontend"
