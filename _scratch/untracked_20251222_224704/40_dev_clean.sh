#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

SHOP="${1:-cart-agent-dev.myshopify.com}"

echo "🧹 Killing ports 3000 + 3001..."
lsof -ti tcp:3000 | xargs -r kill -9 || true
lsof -ti tcp:3001 | xargs -r kill -9 || true

echo "🚀 Starting Express (:3000) + Next (:3001)..."
./scripts/dev.sh "$SHOP"

echo
echo "🔎 Verifying curl to Express (:3000) and UI proxy (:3001)..."
curl -fsS "http://localhost:3000/api/billing/status?shop=$SHOP" >/dev/null
curl -fsS "http://localhost:3001/api/billing/status?shop=$SHOP" >/dev/null
echo "✅ Verified: billing/status responds on both :3000 and :3001"

echo
echo "✅ OPEN:"
echo "  UI:        http://localhost:3001/embedded?shop=$SHOP"
echo "  Playground:http://localhost:3001/demo/playground?shop=$SHOP"
echo "  Billing:   http://localhost:3001/api/billing/status?shop=$SHOP"
echo "  Preview:   http://localhost:3001/api/rescue/preview?shop=$SHOP"
echo "  Real:      http://localhost:3001/api/rescue/real?shop=$SHOP"

echo
echo "Logs:"
echo "  tail -n 160 .dev_express.log"
echo "  tail -n 160 .dev_next.log"
