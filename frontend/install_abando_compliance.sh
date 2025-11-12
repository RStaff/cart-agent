#!/usr/bin/env bash
set -euo pipefail
echo "🔧 Installing Abando Compliance Kit into current Next.js repo..."

if [ ! -f "package.json" ]; then
  echo "❌ Run this from your Next.js project root (where package.json lives)."
  exit 1
fi

mkdir -p pages public/abando-assets
cp -f kit/pages/privacy.tsx pages/privacy.tsx
cp -f kit/pages/terms.tsx pages/terms.tsx
cp -f kit/pages/support.tsx pages/support.tsx

# Prefer rsync, else fallback to cp -R
if command -v rsync >/dev/null 2>&1; then
  rsync -a kit/public/abando-assets/ public/abando-assets/
else
  cp -R kit/public/abando-assets/* public/abando-assets/ 2>/dev/null || true
fi

echo "✅ Pages installed: /pages/{privacy,terms,support}.tsx"
echo "✅ Assets installed: /public/abando-assets/*"
echo "➡️  Next: git add . && git commit -m 'Add compliance pages & assets' && git push"
