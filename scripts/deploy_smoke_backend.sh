#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE:-https://cart-agent-backend.onrender.com}"

echo "== Stage common backend files (if present) =="
git add web/index.js web/package.json 2>/dev/null || true
git commit -m "chore: backend update" || true

echo "== Stash ANY uncommitted edits =="
git stash -u || true

echo "== Rebase & push =="
git pull --rebase origin main || true
git push || true

echo "== Restore stashed edits (if any) =="
git stash pop || true

echo "== Poll /health =="
for i in $(seq 1 40); do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/health" || true)
  if [ "$code" = "200" ]; then
    echo "health OK"
    break
  fi
  echo "waiting $i (code=$code)"
  sleep 3
done
curl -fsS "$BASE/health" && echo

echo "== Smoke /api/generate-copy =="
payload='{"items":["T-Shirt x2"],"tone":"Friendly","brand":"Default","goal":"recover","total":49.99}'
curl -sS -X POST "$BASE/api/generate-copy" -H "Content-Type: application/json" -d "$payload" || true
echo
