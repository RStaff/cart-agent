#!/usr/bin/env bash
set -euo pipefail

TARGET="web/src/index.js"

echo "📦 Patching Shopify boot → NO-OP for dev (prevents crashes)..."

if [ ! -f "$TARGET" ]; then
  echo "❌ Target not found: $TARGET"
  exit 1
fi

# Backup original
cp "$TARGET" "$TARGET.bak_$(date +%s)" || true

# Ensure the line exists (avoid no-op)
if ! grep -q 'import shopify from "../shopify.js";' "$TARGET"; then
  echo "❌ Expected import not found in $TARGET:"
  echo '   import shopify from "../shopify.js";'
  echo "   (File may use different quotes/path. We'll patch by pattern next if needed.)"
  exit 2
fi

# Replace Shopify boot import with stub shopify object
sed -i '' -e 's|import shopify from "../shopify.js";|// shopify disabled for dev\nconst shopify = { authenticate: () => (req,res,next)=>next(), validateAuthenticatedSession: () => (req,res,next)=>next() };|g' "$TARGET"

echo "✅ Shopify boot patched. Express will no longer crash due to shopify imports."
