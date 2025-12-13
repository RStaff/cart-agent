#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Starting Abando Billing End-to-End Test"

##############################################
# 1) Start dev server in background (safe)
##############################################
echo "🟦 Launching dev server in background..."

cd web
npm run dev >/tmp/devserver.log 2>&1 &

SERVER_PID=$!
echo "🟢 Dev server PID: $SERVER_PID"

##############################################
# 2) Wait for port 3000 to respond
##############################################
echo "⏳ Waiting for localhost:3000 to become available..."

for i in {1..30}; do
  if nc -z localhost 3000 2>/dev/null; then
    echo "✅ Server is live!"
    break
  fi
  sleep 1
done

if ! nc -z localhost 3000 2>/dev/null; then
  echo "❌ Server never came online. Log:"
  cat /tmp/devserver.log
  kill $SERVER_PID || true
  exit 1
fi

##############################################
# 3) Run billing/create test
##############################################
echo "🧪 Sending test request to POST /billing/create..."

curl -s -X POST http://localhost:3000/billing/create \
  -H "Content-Type: application/json" \
  -d '{"planKey":"starter"}' | jq . || {
    echo "❌ Billing test failed. Raw curl output:"
    curl -v -X POST http://localhost:3000/billing/create \
      -H "Content-Type: application/json" \
      -d '{"planKey":"starter"}'
}

##############################################
# 4) Cleanup
##############################################
echo "🧹 Cleaning up dev server..."
kill $SERVER_PID 2>/dev/null || true

echo "🎉 Billing end-to-end test complete."
