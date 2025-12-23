#!/usr/bin/env bash
set -euo pipefail

echo "== 1) Where is '/api/webhooks' referenced? =="
rg -n --hidden --no-ignore-vcs '"/api/webhooks"|'\''/api/webhooks'\''|/api/webhooks' web/src web/index.js web/start.mjs web/src/index.js 2>/dev/null || true
echo

echo "== 2) Where is 'received POST /api/webhooks' logged? =="
rg -n --hidden --no-ignore-vcs '\[webhooks\].*received POST /api/webhooks|received POST /api/webhooks' web/src web/index.js web/start.mjs web/src/index.js 2>/dev/null || true
echo

echo "== 3) Where is '[abando][inbox]' logged? =="
rg -n --hidden --no-ignore-vcs '\[abando\]\[inbox\]' web/src web/index.js web/start.mjs web/src/index.js 2>/dev/null || true
echo

echo "== 4) List all router.post handlers in web/src/routes/webhooks.js =="
rg -n 'router\.post\(' web/src/routes/webhooks.js || true
