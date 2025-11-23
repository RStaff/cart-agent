#!/usr/bin/env bash
set -euo pipefail

echo "=== Abando: fix Next.js config for ESM ==="

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$ROOT/abando-frontend"

cd "$FRONTEND"

# Backup any existing config
if [ -f next.config.js ]; then
  TS="$(date +%s)"
  cp next.config.js "next.config.js.bak.$TS"
  echo "→ Backed up existing next.config.js to next.config.js.bak.$TS"
fi

# Write ESM-compatible config that also fixes the workspace-root warning
cat << 'CONFIG' > next.config.js
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Point Next's file-tracing root at the monorepo root to silence the warning
  outputFileTracingRoot: path.join(__dirname, '..'),

  experimental: {
    // We keep the App Router enabled since your routes (e.g. /command-center) live there
    appDir: true,
  },
};

export default nextConfig;
CONFIG

echo "✅ next.config.js rewritten as ESM + workspace-root aware."
