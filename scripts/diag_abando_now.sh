#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "== SYSTEM =="
echo "pwd: $PWD"
echo "node: $(node -v)"
echo "npm : $(npm -v)"
echo "git : $(git rev-parse --short HEAD 2>/dev/null || true)"
echo ""

echo "== ENV (relevant) =="
echo "ABANDO_UI_ORIGIN=${ABANDO_UI_ORIGIN:-<unset>}"
echo ""

echo "== PORTS =="
for p in 3000 3001; do
  echo "--- tcp:$p ---"
  lsof -nP -iTCP:$p -sTCP:LISTEN 2>/dev/null || echo "not listening"
done
echo ""

echo "== HTTP IDENTITY =="
echo "--- 3000 / (should be Express 307 -> /demo/playground) ---"
curl -sI http://localhost:3000/ | egrep -i 'HTTP/|x-powered-by|location' || true
echo "--- 3000 /demo/playground (should be Next 200) ---"
curl -sI http://localhost:3000/demo/playground | egrep -i 'HTTP/|x-powered-by|location' || true
echo "--- 3000 /embedded (should be Next 200) ---"
curl -sI http://localhost:3000/embedded | egrep -i 'HTTP/|x-powered-by|location' || true
echo ""

echo "== NEXT DIRECT (bypass Express) =="
echo "--- 3001 /demo/playground ---"
curl -sI http://localhost:3001/demo/playground | egrep -i 'HTTP/|x-powered-by|location' || true
echo "--- 3001 /embedded ---"
curl -sI http://localhost:3001/embedded | egrep -i 'HTTP/|x-powered-by|location' || true
echo ""

echo "== DEP VERSIONS (proxy) =="
node - <<'NODE'
function tryRequire(name){
  try { return require(name + "/package.json").version; } catch(e){ return null; }
}
console.log("http-proxy-middleware:", tryRequire("http-proxy-middleware") || "NOT FOUND");
try {
  const { createProxyMiddleware } = require("http-proxy-middleware");
  console.log("createProxyMiddleware.length:", createProxyMiddleware.length);
} catch (e) {
  console.log("createProxyMiddleware not require-able from root:", e.message);
}
NODE
echo ""

echo "== FILE CHECKS =="
echo "--- web/src/ui-proxy.mjs head ---"
sed -n '1,120p' web/src/ui-proxy.mjs 2>/dev/null || true
echo ""
echo "--- web/src/index.js proxy block context ---"
grep -n "ABANDO_UI_PROXY" -n web/src/index.js 2>/dev/null || true
echo ""
