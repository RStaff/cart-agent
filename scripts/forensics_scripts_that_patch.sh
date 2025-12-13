#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "== Scripts that overwrite or mutate source files =="

echo ""
echo "-- Uses sed / heredocs / fs.writeFileSync --"
rg -n --hidden --glob '!.git/**' \
  'sed\s+-i|cat\s+>\s+|tee\s+|<<'\''EOF'\''|<<'\''NODE'\''|fs\.writeFileSync\(' \
  scripts web/scripts 2>/dev/null || true

echo ""
echo "-- Touching web/src/index.js or ui-proxy --"
rg -n --hidden --glob '!.git/**' \
  'web/src/index\.js|ui-proxy\.mjs|ABANDO_UI_PROXY' \
  scripts web/scripts 2>/dev/null || true
