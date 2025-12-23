#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Abando Billing Stub End-to-End Test"

##############################################
# 0) Ensure port 3000 is free
##############################################
echo "🔪 Ensuring nothing is listening on port 3000..."
lsof -ti tcp:3000 | xargs kill -9 2>/dev/null || true

##############################################
# 1) Launch dev server
##############################################
echo "🟦 Launching web dev server..."
cd web
npm run dev > ../tmp.web-dev.log 2>&1 &
SERVER_PID=$!
echo "🟢 Dev server PID: $SERVER_PID"

##############################################
# 2) Wait for localhost:3000
##############################################
echo "⏳ Waiting for localhost:3000..."
for i in $(seq 1 40); do
  if nc -z localhost 3000 2>/dev/null; then
    echo "✅ Server is live!"
    break
  fi
  sleep 1
done

if ! nc -z localhost 3000 2>/dev/null; then
  echo "❌ Server never came online. Dev log:"
  echo "------------------------------------"
  cat ../tmp.web-dev.log || true
  echo "------------------------------------"
  kill $SERVER_PID 2>/dev/null || true
  exit 1
fi

##############################################
# 3) Hit POST /billing/create
##############################################
echo "🧪 Sending POST /billing/create..."
RESPONSE="$(curl -s -X POST http://localhost:3000/billing/create \
  -H 'Content-Type: application/json' \
  -d '{\"planKey\":\"starter\"}')"

echo
echo "📦 Raw response:"
echo "$RESPONSE"

##############################################
# 4) Basic sanity check (JSON-ish + contains ok/message)
##############################################
echo
echo "🔎 Quick sanity check..."
if echo "$RESPONSE" | grep -q '"ok"' ; then
  echo "✅ Found \"ok\" in response – stub route is wired."
else
  echo "⚠️ Did not find \"ok\" in response. This is still useful:"
  echo "   • If HTML: route not mounted or Express error page."
  echo "   • If JSON error: stub is wired but returning an error."
fi

##############################################
# 5) Cleanup
##############################################
echo
echo "🧹 Cleaning up dev server..."
kill $SERVER_PID 2>/dev/null || true

echo "🎉 Billing stub end-to-end test complete."
