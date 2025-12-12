#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "== LOCKFILES =="
ls -la package-lock.json 2>/dev/null || true
ls -la web/package-lock.json 2>/dev/null || true
ls -la abando-frontend/package-lock.json 2>/dev/null || true
echo ""

echo "== npm workspaces hint =="
cat package.json | node -e '
let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{ 
  const j=JSON.parse(s); 
  console.log("workspaces:", j.workspaces || "<none>");
});'
echo ""

echo "== http-proxy-middleware resolution from each folder =="
for d in "." "web" "abando-frontend"; do
  echo "--- $d ---"
  (cd "$d" && node -p "try{require('http-proxy-middleware/package.json').version}catch(e){'NOT FOUND'}")
done
