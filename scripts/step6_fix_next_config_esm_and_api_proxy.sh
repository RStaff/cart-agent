#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

# If abando-frontend is ESM ("type":"module"), Next config must be ESM too.
JS_BAD="abando-frontend/next.config.js"
MJS_OK="abando-frontend/next.config.mjs"

if [ -f "$JS_BAD" ]; then
  cp "$JS_BAD" "$JS_BAD.bak_$(date +%s)" || true
  echo "✅ Backed up: $JS_BAD"
  rm -f "$JS_BAD"
  echo "🧹 Removed: $JS_BAD (was CommonJS; breaks under type:module)"
fi

cat > "$MJS_OK" <<'MJS'
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // UI runs on :3001, Express APIs on :3000
    const apiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN || "http://localhost:3000";
    return [
      { source: "/api/:path*", destination: `${apiOrigin}/api/:path*` },
    ];
  },
};

export default nextConfig;
MJS

echo "✅ Wrote ESM config: $MJS_OK"
echo "NEXT:"
echo "  ./scripts/step7_restart_and_verify_api_links.sh example.myshopify.com"
