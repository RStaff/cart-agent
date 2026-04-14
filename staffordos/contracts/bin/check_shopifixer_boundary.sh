#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$PWD}"
cd "$ROOT"

echo "== boundary file =="
test -f staffordos/contracts/SHOPIFIXER_BOUNDARY_LOCK.md

echo "== banned strings in outreach payloads =="
if grep -RniE 'Abando|ngrok-free\.dev|localhost:3000|localhost:3001' staffordos/outreach/*.json 2>/dev/null; then
  echo "FAIL: banned strings found in outreach artifacts"
  exit 1
fi

echo "== link builder base env =="
if ! grep -q '^SHOPIFIXER_PUBLIC_BASE=https://staffordmedia.ai$' .env 2>/dev/null; then
  echo "FAIL: SHOPIFIXER_PUBLIC_BASE is not locked to https://staffordmedia.ai"
  exit 1
fi

echo "== /audit-result live check =="
curl -fsS -I "http://localhost:3000/audit-result?store=luckettstore.com" >/dev/null || {
  echo "FAIL: localhost:3000 /audit-result not reachable"
  exit 1
}

echo "== no /audit route dependency in live outreach generator output =="
if grep -Rni 'ngrok-free\.dev/audit\|localhost:3000/audit\|localhost:3001/audit' staffordos/outreach 2>/dev/null; then
  echo "FAIL: outreach still points to invalid /audit routes"
  exit 1
fi

echo "PASS: ShopiFixer boundary checks passed"
