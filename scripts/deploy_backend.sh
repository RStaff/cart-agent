#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${ABANDO_BACKEND_SERVICE:-}" ]]; then
  echo "❌ ABANDO_BACKEND_SERVICE not set."
  echo "   Export it to your Render service ID or name, e.g.:"
  echo "   export ABANDO_BACKEND_SERVICE='cart-agent-api'"
  exit 1
fi

ROOT_DIR="${HOME}/projects/cart-agent"

echo "📂 In repo root: $ROOT_DIR"
cd "$ROOT_DIR"

echo "🚀 Triggering backend deploy via Render CLI…"
# Non-interactive, auto-confirm
render deploys create "$ABANDO_BACKEND_SERVICE" --confirm

echo "✅ Backend deploy triggered."
