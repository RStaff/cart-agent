#!/usr/bin/env bash
set -euo pipefail

echo "🧪 Diagnose :3000 connectivity + crashes"
echo "Time: $(date)"
echo "Repo: $(pwd)"
echo

echo "1) Is anything listening on 3000/3001?"
echo "--------------------------------------"
for p in 3000 3001; do
  echo "• tcp:$p"
  lsof -nP -iTCP:$p -sTCP:LISTEN || echo "  (none listening)"
done
echo

echo "2) Quick curl tests (localhost vs 127.0.0.1)"
echo "--------------------------------------------"
echo "curl localhost:3000/"
curl -fsSI http://localhost:3000/ | sed -n '1,12p' || echo "❌ localhost:3000 failed"
echo
echo "curl 127.0.0.1:3000/"
curl -fsSI http://127.0.0.1:3000/ | sed -n '1,12p' || echo "❌ 127.0.0.1:3000 failed"
echo

echo "3) What does 'localhost' resolve to?"
echo "------------------------------------"
getent hosts localhost 2>/dev/null || true
python3 - <<'PY' 2>/dev/null || true
import socket
print("socket.getaddrinfo(localhost):")
for x in socket.getaddrinfo("localhost", 3000):
    print(" ", x[0], x[4])
PY
echo

echo "4) Latest Express log tail + crash signatures"
echo "---------------------------------------------"
test -f .dev_express.log && tail -n 220 .dev_express.log || echo "(missing .dev_express.log)"
echo
echo "---- grep: crash / error ----"
test -f .dev_express.log && (grep -nE "app crashed|SyntaxError|Error:|Unhandled|EADDRINUSE|Prisma|ECONN|listen" .dev_express.log | tail -n 80 || true) || true
echo

echo "5) Confirm current entrypoints parse"
echo "-----------------------------------"
node --check web/start.mjs && echo "✅ web/start.mjs parses" || echo "❌ web/start.mjs parse error"
node --check web/src/index.js && echo "✅ web/src/index.js parses" || echo "❌ web/src/index.js parse error"
node --check web/src/routes/webhooks.js && echo "✅ webhooks.js parses" || echo "❌ webhooks.js parse error"
echo

echo "✅ Done."
