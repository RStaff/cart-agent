#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Auto-patching backend /api/health route (quiet mode)"
echo

# Always operate from repo root
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

if [[ ! -d api ]]; then
  echo "❌ No ./api directory found. Backend might live elsewhere."
  exit 1
fi

# 1) Try to auto-detect an Express entry file
ENTRY="$(grep -R -l "express(" api \
  --include="*.js" --include="*.ts" \
  --exclude-dir=node_modules 2>/dev/null | head -n 1 || true)"

if [[ -z "$ENTRY" ]]; then
  echo "❌ Could not find any *.js/*.ts in ./api that call express(. "
  echo "   Minimal next step later: run 'ls api' and 'ls api/src' and paste."
  exit 1
fi

echo "✅ Using backend entry file: $ENTRY"
echo

# 2) Bail if /api/health already exists
if grep -q '"/api/health"' "$ENTRY"; then
  echo "ℹ️  /api/health already present in $ENTRY – no changes made."
  exit 0
fi

# 3) Append a minimal health handler
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
echo "🔍 Git diff (api only):"
git diff -- api | sed 's/^/  /' || true

echo
echo "✅ Patch complete. Commit & push when ready:"
echo "   git add api"
echo '   git commit -m "Add /api/health health check"'
echo "   git push"
