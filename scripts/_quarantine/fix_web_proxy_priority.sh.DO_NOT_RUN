#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="$ROOT/web/src/index.js"

echo "🛠 Fixing proxy priority in: $TARGET"
cp "$TARGET" "$TARGET.bak_proxyprio_$(date +%s)"

# Remove any prior ABANDO blocks and any prior createProxyMiddleware import we added
perl -0777 -i -pe '
  s|\n// ✅ ABANDO_PORT3000_PROXY.*?\n\n||gs;
  s|\nimport \{ createProxyMiddleware \} from "http-proxy-middleware";\n||gs;
' "$TARGET"

# Insert a single canonical import + block immediately after app init.
perl -0777 -i -pe '
  my $code = $_;

  # Ensure we import createProxyMiddleware (place after the LAST import line)
  if ($code !~ /createProxyMiddleware/) {
    $code =~ s|((?:^import .*?;\n)+)|$1import { createProxyMiddleware } from "http-proxy-middleware";\n|m;
  }

  my $block = qq|\n// ✅ ABANDO_PORT3000_PROXY (canonical)\n// Keep embedded UI same-origin on :3000 by proxying Next.js UI from :3001.\n// MUST be registered early (right after app init), before Shopify/auth routes.\napp.get("/", (_req, res) => res.redirect(307, "/demo/playground"));\napp.use("/demo", createProxyMiddleware({ target: "http://localhost:3001", changeOrigin: true, ws: true }));\napp.use("/embedded", createProxyMiddleware({ target: "http://localhost:3001", changeOrigin: true, ws: true }));\n\n|;

  # Insert block immediately after: const app = express();
  if ($code =~ s/(const\\s+app\\s*=\\s*express\\(\\)\\s*;)/$1$block/s) { $_ = $code; next; }

  # Insert block after: const app = express()
  if ($code =~ s/(const\\s+app\\s*=\\s*express\\(\\)\\s*)(;?)/$1;$block/s) { $_ = $code; next; }

  $_ = "// ❌ Could not find `const app = express()` to insert proxy block\n" . $code;
' "$TARGET"

echo "✅ Done."
echo "Next:"
echo "  ./scripts/dev_stack_abando.sh"
echo "Verify:"
echo "  curl -I http://localhost:3000/embedded | head -n 12"
echo "  curl -I http://localhost:3000/demo/playground | head -n 12"
