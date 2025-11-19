#!/usr/bin/env bash
set -euo pipefail

echo "🔎 Cart Agent API diagnostics"
echo

ROOT_DIR="cart-agent-api"

if [[ ! -d "$ROOT_DIR" ]]; then
  echo "❌ Directory $ROOT_DIR not found. Adjust ROOT_DIR in this script."
  exit 1
fi

cd "$ROOT_DIR"

echo "📄 package.json:"
jq '.name, .main, .scripts, .dependencies.express, .dependencies.fastify, .dependencies["@fastify/express"]' package.json || cat package.json
echo

echo "📂 src tree (top level):"
ls -R src | sed 's/^/  /'
echo

echo "🔍 Grep for /api/health in src:"
grep -R "api/health" -n src || echo "  (none found)"
echo

echo "✅ Done."
