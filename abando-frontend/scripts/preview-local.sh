#!/usr/bin/env bash
set -euo pipefail
lsof -ti :4173 | xargs -r kill || true
npm --prefix web/frontend run build
( cd web/frontend && npx vite preview --port 4173 --strictPort --host 127.0.0.1 > preview.log 2>&1 & echo $! > preview.pid )
for i in {1..30}; do curl -fsS http://127.0.0.1:4173/ >/dev/null && break || sleep 1; done
echo "→ open http://127.0.0.1:4173"
tail -n +1 web/frontend/preview.log | sed 's/^/[preview] /'
