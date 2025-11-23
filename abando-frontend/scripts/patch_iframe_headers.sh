#!/usr/bin/env bash
set -euo pipefail

# Always run from abando-frontend root
cd "$(dirname "$0")/.."

CONFIG_FILE=""
for f in next.config.mjs next.config.js; do
  if [ -f "$f" ]; then
    CONFIG_FILE="$f"
    break
  fi
done

if [ -z "$CONFIG_FILE" ]; then
  echo "❌ No next.config.mjs or next.config.js found in $(pwd)"
  exit 1
fi

if grep -qi "ALLOWALL" "$CONFIG_FILE"; then
  echo "✅ $CONFIG_FILE already appears to have iframe headers; skipping overwrite."
  exit 0
fi

BACKUP_FILE="${CONFIG_FILE}.bak-$(date +%Y%m%d-%H%M%S)"
cp "$CONFIG_FILE" "$BACKUP_FILE"
echo "📦 Backed up existing config to $BACKUP_FILE"

cat > "$CONFIG_FILE" <<'CFG'
/**
 * Auto-generated iframe-safe Next.js config for Abando.
 * Original file backed up with .bak-<timestamp>.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Allow Shopify admin to embed this app in an iframe
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          // Restrict who can iframe us for safety
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

echo "✅ Patched $CONFIG_FILE with iframe-safe headers."
