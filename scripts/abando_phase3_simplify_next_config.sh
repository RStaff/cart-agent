#!/usr/bin/env bash
set -euo pipefail

echo "=== Abando Phase 3 – Simplify next.config.js ==="

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$ROOT/abando-frontend"

cat << 'CONFIG' > "$FRONTEND/next.config.js"
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Keep tracing rooted at the frontend itself
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
CONFIG

echo "✅ next.config.js simplified (no experimental flags)."
