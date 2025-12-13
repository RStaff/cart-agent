#!/usr/bin/env bash
set -euo pipefail

echo "== Preflight guardrails =="

# 1) web/src/index.js must contain exactly one canonical block
count="$(grep -c "=== ABANDO_UI_PROXY_START ===" web/src/index.js || true)"
[ "$count" -eq 1 ] || { echo "❌ Expected 1 ABANDO_UI_PROXY_START, got $count"; exit 1; }

# 2) No legacy proxy markers should exist
bad="$(grep -n "✅ ABANDO_UI_PROXY" web/src/index.js || true)"
[ -z "$bad" ] || { echo "❌ Found legacy ✅ ABANDO_UI_PROXY marker(s):"; echo "$bad"; exit 1; }

# 3) Smoke routes
./scripts/smoke_proxy_routes.sh

echo "✅ preflight_guardrails: PASS"
