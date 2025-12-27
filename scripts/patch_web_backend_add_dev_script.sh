#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
PKG="$ROOT/web/package.json"

echo "🔧 Patch web-backend package.json to include a dev script (Shopify CLI requirement)"
echo "📁 Root: $ROOT"
test -f "$PKG" || { echo "❌ Missing: $PKG"; exit 1; }

# Choose a reasonable entrypoint automatically
ENTRY=""
for c in \
  "src/index.js" \
  "src/server.js" \
  "index.js" \
  "server.js" \
  "app.js" \
  "dist/index.js"
do
  if test -f "$ROOT/web/$c"; then ENTRY="$c"; break; fi
done

if [[ -z "$ENTRY" ]]; then
  echo "❌ Could not find an entrypoint in web/. Looked for src/index.js, index.js, server.js, etc."
  echo "   Quick check:"
  ls -lah "$ROOT/web" | sed -n '1,120p' || true
  echo "   And:"
  find "$ROOT/web" -maxdepth 2 -type f -name "*.js" | sed -n '1,120p' || true
  exit 1
fi

echo "✅ Detected entrypoint: web/$ENTRY"

BAK="$PKG.bak_$(date +%s)"
cp "$PKG" "$BAK"
echo "🧾 Backup: $BAK"

python3 - << PY
import json
from pathlib import Path

pkg_path = Path("$PKG")
data = json.loads(pkg_path.read_text())

scripts = data.get("scripts") or {}
changed = False

# Only set dev if missing
if "dev" not in scripts:
    scripts["dev"] = f'node { "$ENTRY" }'
    changed = True

# Keep a sane start script too
if "start" not in scripts:
    scripts["start"] = f'node { "$ENTRY" }'
    changed = True

data["scripts"] = scripts

pkg_path.write_text(json.dumps(data, indent=2) + "\n")

print("✅ Updated scripts:")
for k in ("dev","start"):
    print(f"  {k}: {data['scripts'].get(k)}")

print("✅ Wrote:", pkg_path)
PY

echo
echo "🔍 Confirming package.json now contains a dev script:"
node -e "const p=require('./web/package.json'); console.log('dev:', p.scripts && p.scripts.dev ? p.scripts.dev : '(missing)')"

echo
echo "🎯 Next (copy/paste):"
echo "  cd \"$ROOT\""
echo "  shopify app dev"
