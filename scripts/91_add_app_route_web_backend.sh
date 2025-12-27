#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

TARGET="web/src/index.js"
test -f "$TARGET" || { echo "❌ $TARGET not found"; exit 1; }

echo "🔒 Backing up $TARGET..."
cp "$TARGET" "$TARGET.bak_$(date +%Y%m%d_%H%M%S)"

# If /app route already exists, do nothing
if grep -qE 'app\.get\(\s*["'\'']/app' "$TARGET"; then
  echo "ℹ️ /app route already present. No change."
  exit 0
fi

# Insert right after: const app = express();
perl -0777 -i -pe '
  s/(const\s+app\s*=\s*express\(\)\s*;\s*\n)/$1\n\/\/ --- Embedded entrypoint alias (Shopify Application URL) ---\napp.get(\"\/app\", (req,res)=> res.redirect(307, \"\/demo\/playground\"));\napp.get(\"\/app\\\/\", (req,res)=> res.redirect(307, \"\/demo\/playground\"));\napp.get(\"\/app\\\/.*\", (req,res)=> res.redirect(307, \"\/demo\/playground\"));\n\n/s
' "$TARGET"

echo "✅ Added /app redirect routes."
