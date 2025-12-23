#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

WEB_DIR="web"
INDEX="$WEB_DIR/src/index.js"
PKG="$WEB_DIR/package.json"

echo "🔎 Abando ESM/CJS Diagnostic"
echo "Root: $ROOT"
echo

echo "== web/package.json type =="
node -p "require('./$PKG').type || '(none)'" 2>/dev/null || echo "(unable to read)"
echo

echo "== Entrypoint files =="
test -f "$WEB_DIR/start.mjs" && echo "✅ web/start.mjs exists" || echo "❌ web/start.mjs missing"
test -f "$INDEX" && echo "✅ web/src/index.js exists" || echo "❌ web/src/index.js missing"
echo

echo "== Offending line(s) in web/src/index.js (require/import of entitlement/metrics) =="
nl -ba "$INDEX" | sed -n '1,240p' | grep -nE 'require\(|abando/(entitlement|metrics)|entitlementRoutes|metricsRoutes' || true
echo

echo "== Search for entitlement module file =="
FOUND=""
for f in \
  "$WEB_DIR/src/abando/entitlement.js" \
  "$WEB_DIR/src/abando/entitlement.mjs" \
  "$WEB_DIR/src/abando/entitlement.ts" \
  "$WEB_DIR/src/abando/entitlement/index.js"
do
  if test -f "$f"; then FOUND="$f"; break; fi
done

if test -n "$FOUND"; then
  echo "✅ Found: $FOUND"
  echo
  echo "== Preview exports in $FOUND =="
  nl -ba "$FOUND" | sed -n '1,220p' | grep -nE 'module\.exports|exports\.|export ' || true
else
  echo "⚠️ Not found at standard path(s). Grepping for 'entitlementRoutes' under web/src..."
  grep -RIn --exclude-dir=node_modules --exclude='*.bak_*' 'entitlementRoutes' "$WEB_DIR/src" || true
fi

echo
echo "== Search for metrics module file =="
FOUND2=""
for f in \
  "$WEB_DIR/src/abando/metrics.js" \
  "$WEB_DIR/src/abando/metrics.mjs" \
  "$WEB_DIR/src/abando/metrics.ts" \
  "$WEB_DIR/src/abando/metrics/index.js"
do
  if test -f "$f"; then FOUND2="$f"; break; fi
done

if test -n "$FOUND2"; then
  echo "✅ Found: $FOUND2"
  echo
  echo "== Preview exports in $FOUND2 =="
  nl -ba "$FOUND2" | sed -n '1,240p' | grep -nE 'require\(|module\.exports|exports\.|export ' || true
else
  echo "⚠️ Not found at standard path(s). Grepping for 'metricsRoutes' under web/src..."
  grep -RIn --exclude-dir=node_modules --exclude='*.bak_*' 'metricsRoutes' "$WEB_DIR/src" || true
fi

echo
echo "Done."
