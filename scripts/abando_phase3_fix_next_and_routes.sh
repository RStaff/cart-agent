#!/usr/bin/env bash
set -euo pipefail

echo "=== Abando Phase 3 – Final Next.js Fix ==="

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$ROOT/abando-frontend"

echo "→ Frontend: $FRONTEND"

###############################################
# 1. Rewrite next.config.js (ESM, correct roots)
###############################################
cat << 'CONFIG' > "$FRONTEND/next.config.js"
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// WORKS reliably in all monorepo layouts
const nextConfig = {
  reactStrictMode: false,

  // This is the correct tracing root for cart-agent monorepo
  outputFileTracingRoot: path.join(__dirname),

  experimental: {
    serverMinification: false,
    esmExternals: true,
  }
};

export default nextConfig;
CONFIG
echo "✅ next.config.js rewritten."

###############################################
# 2. Ensure app/command-center route exists
###############################################
mkdir -p "$FRONTEND/app/command-center"

cat << 'PAGE' > "$FRONTEND/app/command-center/page.jsx"
export default function CommandCenter() {
  return (
    <div style={{ padding: "40px", fontFamily: "system-ui" }}>
      <h1>Command Center (Temp Dev Page)</h1>
      <p>This route is now working.</p>
    </div>
  );
}
PAGE
echo "✅ /app/command-center/page.jsx written."

###############################################
# 3. Clean .next and reinstall modules
###############################################
echo "→ Cleaning frontend..."
rm -rf "$FRONTEND/.next" || true
rm -rf "$FRONTEND/node_modules" || true

echo "→ Installing fresh frontend deps..."
cd "$FRONTEND"
npm install --legacy-peer-deps

echo "=== Next.js & route fix complete ==="
