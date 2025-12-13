#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "== Possible duplicate/conflicting routing logic =="

echo ""
echo "-- /demo or /embedded handlers --"
rg -n --hidden --glob '!.git/**' \
  '["'\'']?/demo|["'\'']?/embedded|/demo/playground|/embedded\b' \
  web abando-frontend api scripts 2>/dev/null || true

echo ""
echo "-- Root redirect logic --"
rg -n --hidden --glob '!.git/**' \
  'res\.redirect\(|307|Temporary Redirect|/demo/playground' \
  web abando-frontend api scripts 2>/dev/null || true

echo ""
echo "-- Proxy middleware usage --"
rg -n --hidden --glob '!.git/**' \
  'http-proxy-middleware|createProxyMiddleware|attachUiProxy|pathFilter|pathRewrite' \
  web abando-frontend api scripts 2>/dev/null || true
