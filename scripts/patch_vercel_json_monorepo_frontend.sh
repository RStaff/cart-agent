#!/usr/bin/env bash
set -euo pipefail

# 1) Root vercel.json (valid schema)
ROOT="vercel.json"
cp -f "$ROOT" "$ROOT.bak_$(date +%s)" 2>/dev/null || true

cat > "$ROOT" <<'JSON'
{
  "installCommand": "npm ci || npm install",
  "buildCommand": "cd abando-frontend && (npm ci || npm install) && npm run build",
  "outputDirectory": "abando-frontend/.next"
}
JSON

echo "✅ Patched $ROOT (no rootDirectory; build/output routed to abando-frontend)"

# 2) Remove frontend vercel.json if present (avoid conflicting config)
if [ -f abando-frontend/vercel.json ]; then
  mv abando-frontend/vercel.json "abando-frontend/vercel.json.bak_$(date +%s)"
  echo "✅ Moved abando-frontend/vercel.json aside (to avoid config conflicts)"
fi
