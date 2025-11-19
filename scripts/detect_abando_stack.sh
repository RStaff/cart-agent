#!/usr/bin/env bash
set -euo pipefail

echo "🔎 Detecting Abando stack (frontend + backend)…"
echo

########################################
# Frontend: abando-frontend
########################################
if [[ -d "abando-frontend" ]]; then
  echo "📦 Frontend: ./abando-frontend"

  if [[ -f "abando-frontend/package.json" ]]; then
    if grep -q '"next"' abando-frontend/package.json 2>/dev/null; then
      echo "  • Framework: Next.js"
    elif grep -q '"react"' abando-frontend/package.json 2>/dev/null; then
      echo "  • Framework: React (non-Next)"
    else
      echo "  • Framework: (no obvious Next/React dependency found)"
    fi
  else
    echo "  • package.json: MISSING"
  fi

  # Router style
  if [[ -d "abando-frontend/src/app" ]]; then
    echo "  • Router: App Router (src/app/*)"
  fi

  if [[ -d "abando-frontend/pages" ]]; then
    echo "  • Router: Pages Router (pages/*)"
  fi

  if [[ ! -d "abando-frontend/src/app" && ! -d "abando-frontend/pages" ]]; then
    echo "  • Router: (no src/app or pages directory found)"
  fi
else
  echo "📦 Frontend: ./abando-frontend (directory NOT found)"
fi

echo

########################################
# Backend: api
########################################
if [[ -d "api" ]]; then
  echo "📦 Backend: ./api"

  if [[ -f "api/package.json" ]]; then
    if grep -q '"express"' api/package.json 2>/dev/null; then
      echo "  • Framework: Express"
    elif grep -q '"fastify"' api/package.json 2>/dev/null; then
      echo "  • Framework: Fastify"
    else
      echo "  • Framework: (no express/fastify dependency found)"
    fi
  else
    echo "  • package.json: MISSING"
  fi

  # Try to identify entry file
  entry=""
  for candidate in "api/server.js" "api/index.js" "api/src/server.js" "api/src/index.js"; do
    if [[ -f "$candidate" ]]; then
      entry="$candidate"
      break
    fi
  done

  if [[ -n "$entry" ]]; then
    echo "  • Entry file: $entry"
    # Quick check for app.get('/api/health')
    if grep -q 'app.get("/api/health"' "$entry" 2>/dev/null; then
      echo '  • Health route: /api/health ✅'
    else
      echo '  • Health route: /api/health not found in entry file'
    fi
  else
    echo "  • Entry file: (no server.js/index.js found under api/ or api/src/)"
  fi
else
  echo "📦 Backend: ./api (directory NOT found)"
fi

echo
echo "✅ Detection complete."
