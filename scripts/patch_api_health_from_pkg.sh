#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Adding /api/health to backend (quiet)"

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

if [[ ! -f api/package.json ]]; then
  echo "❌ api/package.json not found – backend might live elsewhere."
  exit 1
fi

# 1) Figure out entry file from package.json "main" (if present)
ENTRY_REL="$(jq -r '.main // empty' api/package.json || echo "")"

CANDIDATES=()
if [[ -n "$ENTRY_REL" ]]; then
  CANDIDATES+=("api/$ENTRY_REL")
fi
CANDIDATES+=(
  "api/index.ts"
  "api/index.js"
  "api/server.ts"
  "api/server.js"
  "api/src/index.ts"
  "api/src/index.js"
  "api/src/server.ts"
  "api/src/server.js"
)

ENTRY=""
for f in "${CANDIDATES[@]}"; do
  if [[ -f "$f" ]]; then
    ENTRY="$f"
    break
  fi
done

if [[ -z "$ENTRY" ]]; then
  # last resort: first .ts/.js in api (non-node_modules)
  ENTRY="$(find api -maxdepth 2 -type f \( -name '*.ts' -o -name '*.js' \) \
    ! -path '*/node_modules/*' | head -n 1 || true)"
fi

if [[ -z "$ENTRY" ]]; then
  echo "❌ Could not auto-detect backend entry file in ./api."
  exit 1
fi

echo "✅ Using backend entry file: $ENTRY"

# 2) Skip if /api/health already exists
if grep -q '"/api/health"' "$ENTRY"; then
  echo "ℹ️ /api/health already present – no changes made."
  exit 0
fi

# 3) Append the Express health route
cat << 'ROUTE' >> "$ENTRY"

// Health check for Render (pay.abando.ai) and status scripts.
// Safe to call unauthenticated and used for uptime/telemetry.
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    service: "abando-backend",
    connected_to: "staffordmedia.ai",
  });
});
ROUTE

echo "✅ Added /api/health route to $ENTRY"
echo
echo "🔍 Git diff for api/:"
git diff -- api | sed 's/^/  /' || true

echo
echo "✅ When ready, deploy with:"
echo "   git add api"
echo '   git commit -m "Add /api/health health check"'
echo "   git push"
