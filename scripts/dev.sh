#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
SHOP="${1:-example.myshopify.com}"

echo "🧹 Killing ports 3000 + 3001..."
lsof -ti tcp:3000 | xargs -r kill -9 || true
lsof -ti tcp:3001 | xargs -r kill -9 || true

echo "🚀 Starting Express (:3000)..."
nohup npm run start > .dev_express.log 2>&1 &

echo "🚀 Starting Next UI (:3001)..."
nohup npm --prefix abando-frontend run dev -- --port 3001 > .dev_next.log 2>&1 &

echo "⏳ Waiting for Express..."
for i in {1..80}; do
  if curl -fsS "http://localhost:3000/healthz" >/dev/null 2>&1; then
    echo "✅ Express up"
    break
  fi
  sleep 0.25
done

echo "⏳ Waiting for Next..."
for i in {1..80}; do
  if curl -fsS "http://localhost:3001/" >/dev/null 2>&1; then
    echo "✅ Next up"
    break
  fi
  sleep 0.25
done

echo ""
echo "✅ OPEN:"
echo "  UI:   http://localhost:3001/embedded?shop=$SHOP"
echo "  Typo: http://localhost:3001/embeddeded?shop=$SHOP"
echo ""
echo "✅ API via UI origin (proxy rewrite):"
echo "  http://localhost:3001/api/billing/status?shop=$SHOP"
echo "  http://localhost:3001/api/rescue/preview?shop=$SHOP"
echo ""
echo "Logs:"
echo "  tail -n 120 .dev_express.log"
echo "  tail -n 120 .dev_next.log"
echo ""
echo "Stop:"
echo "  lsof -ti tcp:3000 | xargs -r kill -9; lsof -ti tcp:3001 | xargs -r kill -9"
