#!/usr/bin/env bash
set -euo pipefail

FILE="vercel.json"
cp -f "$FILE" "$FILE.bak_$(date +%s)" 2>/dev/null || true

cat > "$FILE" <<'JSON'
{
  "framework": "nextjs",
  "rootDirectory": "abando-frontend",
  "installCommand": "npm ci || npm install",
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}
JSON

echo "✅ Patched vercel.json to force Next.js + rootDirectory + outputDirectory=.next"
