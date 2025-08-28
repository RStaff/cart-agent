#!/usr/bin/env bash
set -euo pipefail

BASE="https://cart-agent-backend.onrender.com"

echo "== Stage & commit backend changes =="
git add web/index.js web/package.json || true
git commit -m "backend: update" || true

echo "== Temporarily stash other local edits =="
git stash -u || true

echo "== Rebase and push =="
git pull --rebase origin main
git push

echo "== Restore stashed edits (if any) =="
git stash pop || true

echo "== Poll /health until 200 =="
for i in $(seq 1 40); do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/health" || true)
  if [ "$code" = "200" ]; then
    echo "health OK"
    break
  fi
  echo "waiting $i (code=$code)"
  sleep 3
done

echo "== Smoke: POST /api/generate-copy =="
payload='{"items":["T-Shirt x2"],"tone":"Friendly","brand":"Default","goal":"recover","total":49.99}'
curl -sS -X POST "$BASE/api/generate-copy" \
  -H "Content-Type: application/json" \
  -d "$payload"
echo
