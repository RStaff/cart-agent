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
for i in {1..60}; do
  if curl -fsS "http://localhost:3000/healthz" >/dev/null 2>&1; then
    echo "✅ Express up"
    break
  fi
  sleep 0.25
done

echo "⏳ Waiting for Next..."
for i in {1..60}; do
  if curl -fsS "http://localhost:3001/" >/dev/null 2>&1; then
    echo "✅ Next up"
    break
  fi
  sleep 0.25
done

echo ""
echo "🧪 Paid loop (stub)"
curl -s "http://localhost:3000/billing/create?shop=$SHOP" \
  -H 'content-type: application/json' \
  -d '{"planKey":"starter"}' | jq .

curl -sI "http://localhost:3000/billing/confirm-stub?shop=$SHOP&plan=starter" \
  | egrep -i 'HTTP/|location' || true

curl -s "http://localhost:3000/api/billing/status?shop=$SHOP" | jq .

echo ""
echo "✅ OPEN:"
echo "  UI:  http://localhost:3001/embedded?shop=$SHOP"
echo "  Typo-safe: http://localhost:3001/embeddeded?shop=$SHOP"
echo ""
echo "Logs:"
echo "  tail -n 80 .dev_next.log"
echo "  tail -n 80 .dev_express.log"
