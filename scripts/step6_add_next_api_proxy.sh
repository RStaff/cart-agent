#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

CFG="abando-frontend/next.config.js"
if [ -f "$CFG" ]; then
  cp "$CFG" "$CFG.bak_$(date +%s)"
  echo "✅ Backed up: $CFG"
fi

cat > "$CFG" <<'JS'
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // In dev, UI runs on :3001 and Express APIs on :3000.
    // This makes /api/* work from the UI origin (prevents 404s).
    const apiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN || "http://localhost:3000";
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
JS

echo "✅ Wrote abando-frontend/next.config.js with /api proxy rewrite"
echo "NEXT:"
echo "  ./scripts/step7_restart_and_verify_api_links.sh example.myshopify.com"
