#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="$ROOT/web/src/index.js"

echo "🧩 Patching proxy routes into: $TARGET"
cp "$TARGET" "$TARGET.bak_proxy_$(date +%s)"

# 1) Ensure import exists
perl -0777 -i -pe '
  my $code = $_;
  if ($code !~ /http-proxy-middleware/) {
    # insert near top after other imports
    $code =~ s|(\nimport .*?\n)|$1import { createProxyMiddleware } from "http-proxy-middleware";\n|s;
  }
  $_ = $code;
' "$TARGET"

# 2) Remove old ABANDO_PORT3000_REDIRECTS blocks (any)
perl -0777 -i -pe '
  s|\n// ✅ ABANDO_PORT3000_REDIRECTS.*?\n\n||gs;
' "$TARGET"

# 3) Insert proxy block AFTER app init
perl -0777 -i -pe '
  my $code = $_;
  my $insert = qq|\n// ✅ ABANDO_PORT3000_REDIRECTS (patched)\n// Port 3000 is Shopify backend. Proxy UI from Next.js :3001 to keep same-origin for embedded.\napp.get("/", (_req, res) => res.redirect(307, "/demo/playground"));\napp.use("/demo", createProxyMiddleware({ target: "http://localhost:3001", changeOrigin: true }));\napp.use("/embedded", createProxyMiddleware({ target: "http://localhost:3001", changeOrigin: true }));\n\n|;

  if ($code =~ s/(const\\s+app\\s*=\\s*express\\(\\)\\s*;)/$1$insert/s) { $_ = $code; next; }
  if ($code =~ s/(const\\s+app\\s*=\\s*express\\(\\)\\s*)(;?)/$1;$insert/s) { $_ = $code; next; }

  $_ = "// ❌ Could not find app initialization for proxy insertion\n" . $code;
' "$TARGET"

echo "✅ Patch complete."
echo "Next:"
echo "  ./scripts/dev_stack_abando.sh"
echo ""
echo "Verify:"
echo "  curl -I http://localhost:3000/embedded | head -n 12"
echo "Expected: HTTP/1.1 200 (proxied), not a redirect"
