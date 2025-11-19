#!/usr/bin/env bash
set -euo pipefail

echo "🔎 Cart Agent backend diagnostics (quiet mode)"
echo

# 1) Show candidate Node projects (no node_modules)
echo "📁 Candidate Node projects (top level only):"
find . -maxdepth 2 -type f -name package.json \
  ! -path "*/node_modules/*" \
  -print
echo

# 2) Look for common HTTP frameworks in those package.json files
echo "🔍 Grepping for Express/Fastify dependencies:"
grep -R --include="package.json" -E '"express"|"fastify"' \
  . 2>/dev/null || echo "  (no obvious HTTP frameworks found)"
echo

# 3) Look for any existing /api/health handlers
echo "🔍 Grepping for /api/health handlers (excluding node_modules):"
grep -R "api/health" -n . \
  --exclude-dir="node_modules" 2>/dev/null || echo "  (no /api/health handlers yet)"
echo

echo "✅ Diagnostics done (no node_modules spam)."
