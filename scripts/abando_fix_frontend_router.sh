#!/usr/bin/env bash
set -euo pipefail

echo "=== Abando frontend router fix ==="

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_DIR="$ROOT/abando-frontend"

echo "→ Frontend dir: $FRONTEND_DIR"
cd "$FRONTEND_DIR"

echo "→ Writing next.config.js with explicit outputFileTracingRoot..."
cat << 'CFG' > next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force Next.js to treat abando-frontend as the tracing root
  outputFileTracingRoot: __dirname,
};

module.exports = nextConfig;
CFG
echo "✅ next.config.js written."

echo "→ Cleaning any App Router command-center route (we use pages/ instead)…"
if [ -d "app/command-center" ]; then
  rm -rf app/command-center
  echo "✅ Removed app/command-center."
else
  echo "ℹ️ No app/command-center directory found (that's fine)."
fi

echo "=== Frontend router fix complete ==="
