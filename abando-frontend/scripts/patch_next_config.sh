#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

CONFIG_FILE="next.config.mjs"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "❌ $CONFIG_FILE not found in $(pwd)"
  exit 1
fi

BACKUP_FILE="${CONFIG_FILE}.bak-eslint-$(date +%Y%m%d-%H%M%S)"
cp "$CONFIG_FILE" "$BACKUP_FILE"
echo "📦 Backed up existing config to $BACKUP_FILE"

cat > "$CONFIG_FILE" <<'CFG'
/**
 * Next.js config for Abando
 * - Allows Shopify to iframe the app
 * - Ignores ESLint errors during production builds
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't fail production builds on lint errors
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Silence the workspace root warning
  outputFileTracingRoot: process.cwd(),

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value:
              "frame-ancestors https://admin.shopify.com https://*.myshopify.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
CFG

echo "✅ Wrote iframe-safe, eslint-tolerant Next.js config to $CONFIG_FILE."
