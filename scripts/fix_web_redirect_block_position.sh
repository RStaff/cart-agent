#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
TARGET="$ROOT/web/src/index.js"

if [[ ! -f "$TARGET" ]]; then
  echo "❌ Cannot find $TARGET"
  echo "Run from repo root: ~/projects/cart-agent"
  exit 1
fi

echo "🧯 Fixing redirect block position in: $TARGET"
cp "$TARGET" "$TARGET.bak_fixpos_$(date +%s)"

# 1) Remove any existing ABANDO_PORT3000_REDIRECTS block (anywhere in file)
perl -0777 -i -pe '
  s|\n// ✅ ABANDO_PORT3000_REDIRECTS \(patched\)\n.*?\n\n||gs;
' "$TARGET"

# 2) Insert block immediately after app initialization
perl -0777 -i -pe '
  my $code = $_;

  my $insert = qq|\n// ✅ ABANDO_PORT3000_REDIRECTS (patched)\n// Port 3000 is the Shopify backend. UI lives on Next.js :3001.\napp.get(\"/\", (_req, res) => res.redirect(307, \"http://localhost:3001/demo/playground\"));\napp.get(\"/embedded\", (_req, res) => res.redirect(307, \"http://localhost:3001/embedded\"));\n\n|;

  # const app = express();
  if ($code =~ s/(const\\s+app\\s*=\\s*express\\(\\)\\s*;)/$1$insert/s) { $_ = $code; next; }

  # const app = express()
  if ($code =~ s/(const\\s+app\\s*=\\s*express\\(\\)\\s*)(;?)/$1;$insert/s) { $_ = $code; next; }

  # fallback: if we can’t find app init, add a clear failure marker at top
  $_ = \"// ❌ Could not find app initialization for redirect insertion\\n\" . $code;
' "$TARGET"

echo "✅ Done."
echo "Now restart web:"
echo "  cd web && npm run dev"
echo ""
echo "Verify:"
echo "  curl -I http://localhost:3000/ | head -n 20"
echo "Expected: Location: http://localhost:3001/demo/playground"
