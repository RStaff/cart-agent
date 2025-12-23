#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
TARGET="$ROOT/web/src/index.js"

if [[ ! -f "$TARGET" ]]; then
  echo "❌ Cannot find $TARGET"
  echo "Run this from your repo root: ~/projects/cart-agent"
  exit 1
fi

echo "🧩 Patching: $TARGET"
cp "$TARGET" "$TARGET.bak_$(date +%s)"

# 1) Comment out legacy Vite static serving lines (frontend/dist, build, etc.)
#    We ONLY comment lines that contain express.static AND (frontend/dist OR /dist OR build) to avoid breaking other static assets.
perl -0777 -i -pe '
  my @lines = split(/\n/, $_, -1);
  for (my $i=0; $i<@lines; $i++) {
    my $l = $lines[$i];

    # Skip if already commented
    next if $l =~ /^\s*\/\//;

    if ($l =~ /express\.static/ && $l =~ /(frontend\/dist|\/dist\b|\/build\b|frontend\/build)/) {
      $lines[$i] = "// 🔴 DISABLED legacy Vite static UI (patched)\n// " . $l;
    }

    # Also catch serve-static wrappers that mount dist/build
    if ($l =~ /serveStatic|serve-static/ && $l =~ /(frontend\/dist|\/dist\b|\/build\b|frontend\/build)/) {
      $lines[$i] = "// 🔴 DISABLED legacy Vite static UI (patched)\n// " . $l;
    }
  }
  $_ = join("\n", @lines);
' "$TARGET"

# 2) Ensure redirect handlers exist (insert right after app initialization)
#    Insert only if not already present.
perl -0777 -i -pe '
  my $code = $_;

  if ($code !~ /ABANDO_PORT3000_REDIRECTS/) {
    my $insert = qq|\n// ✅ ABANDO_PORT3000_REDIRECTS (patched)\n// Port 3000 is the Shopify backend. UI lives on Next.js :3001.\napp.get(\"/\", (_req, res) => res.redirect(302, \"http://localhost:3001/demo/playground\"));\napp.get(\"/embedded\", (_req, res) => res.redirect(302, \"http://localhost:3001/embedded\"));\n\n|;

    # Try to place immediately after: const app = express();
    if ($code =~ s/(const\\s+app\\s*=\\s*express\\(\\)\\s*;)/$1$insert/s) {
      $_ = $code; next;
    }
    # Try: const app = express()
    if ($code =~ s/(const\\s+app\\s*=\\s*express\\(\\)\\s*)/$1;$insert/s) {
      $_ = $code; next;
    }
    # Fallback: place after first occurrence of "app =" line
    if ($code =~ s/(\\n.*app\\s*=\\s*express\\(\\)\\s*;?\\n)/$1$insert/s) {
      $_ = $code; next;
    }

    # Last resort: put at top (safe)
    $_ = $insert . $code;
  } else {
    $_ = $code;
  }
' "$TARGET"

echo "✅ Patch complete."
echo "Next: restart the web backend:"
echo "  cd web && npm run dev"
echo ""
echo "Verify:"
echo "  curl -I http://localhost:3000/ | head"
echo "Expected: HTTP/1.1 302 Found  (Location: http://localhost:3001/demo/playground)"
