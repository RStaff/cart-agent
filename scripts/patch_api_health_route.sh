#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Patching backend /api/health route (quiet mode)"
echo

# 1) Find a likely Express entry file
ENTRY=""

for candidate in \
  "api/src/index.ts" \
  "api/src/index.js" \
  "api/src/server.ts" \
  "api/src/server.js" \
  "api/index.ts" \
  "api/index.js"
do
  if [[ -f "$candidate" ]]; then
    ENTRY="$candidate"
    break
  fi
done

if [[ -z "$ENTRY" ]]; then
  echo "❌ Could not find an api entry file (index/server in api/ or api/src/)."
  echo "   Minimal next step: run 'ls api' and 'ls api/src' and paste that later."
  exit 1
fi

echo "✅ Using backend entry file: $ENTRY"
echo

# 2) If /api/health already exists, bail quietly
if grep -q '"/api/health"' "$ENTRY"; then
  echo "ℹ️  /api/health already present in $ENTRY – no changes made."
  exit 0
fi

# 3) Append a minimal health handler
cat << 'ROUTE' >> "$ENTRY"

// Health check for Render (pay.abando.ai) and status scripts
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
echo "🔍 Git diff (api only):"
git diff -- api | sed 's/^/  /' || true

echo
echo "✅ Patch complete. Commit & push when ready:"
echo "   git add api"
echo '   git commit -m "Add /api/health health check"'
echo "   git push"
