#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ Not found: $FILE"; exit 1; }

cp "$FILE" "$FILE.bak_$(date +%s)"

# Ensure http-proxy-middleware import exists
if ! rg -n 'http-proxy-middleware' "$FILE" >/dev/null 2>&1; then
  # add near top (best-effort)
  perl -0777 -i -pe '
    if ($_ !~ /http-proxy-middleware/) {
      s/(^.*?\n)/$1const { createProxyMiddleware } = require("http-proxy-middleware");\n/s;
    }
  ' "$FILE"
fi

# Insert a "proxy everything except /api" block ONCE, near server/app init.
if rg -n "ABANDO_NEXT_DEV_PROXY_V1" "$FILE" >/dev/null 2>&1; then
  echo "✅ Proxy block already present."
  exit 0
fi

perl -0777 -i -pe '
  my $block = qq{

// === ABANDO_NEXT_DEV_PROXY_V1 ===
// In dev preview mode, Shopify loads /embedded, but Next assets are requested at /_next/* (root).
// Proxy ALL non-/api routes to Next dev so fonts, chunks, images load correctly through the tunnel.
if (process.env.ABANDO_DEV_PROXY === "1") {
  const nextTarget = process.env.ABANDO_DEV_PROXY_TARGET || "http://localhost:3000";
  const nextProxy = createProxyMiddleware({
    target: nextTarget,
    changeOrigin: true,
    ws: true,
    logLevel: "silent",
  });

  app.use((req, res, next) => {
    // Keep API + webhooks on the backend
    if (req.path.startsWith("/api")) return next();
    return nextProxy(req, res, next);
  });

  console.log(`[abandoDevProxy] enabled → ${nextTarget} (proxy all non-/api routes)`);
}
// === /ABANDO_NEXT_DEV_PROXY_V1 ===

};

  # Try to inject after "const app = express()" or similar.
  if ($_ =~ /const\s+app\s*=\s*express\(\)\s*;/s) {
    $_ =~ s/(const\s+app\s*=\s*express\(\)\s*;)/$1$block/s;
  } elsif ($_ =~ /app\s*=\s*express\(\)\s*;/s) {
    $_ =~ s/(app\s*=\s*express\(\)\s*;)/$1$block/s;
  } else {
    # fallback: append near top
    $_ = $block . $_;
  }

  $_;
' "$FILE"

echo "✅ Patched $FILE (backup created)."
