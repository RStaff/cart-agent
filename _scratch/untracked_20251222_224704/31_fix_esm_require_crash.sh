#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

WEB_DIR="web"
INDEX="$WEB_DIR/src/index.js"

ts() { date +%s; }

backup() {
  local f="$1"
  test -f "$f" || return 0
  cp "$f" "$f.bak_$(ts)"
}

echo "🧩 Fixing ESM/CJS mismatch (require() in ESM scope)..."
test -f "$INDEX" || { echo "❌ Missing $INDEX"; exit 1; }

backup "$INDEX"

# 1) Patch index.js: replace require of entitlementRoutes with ESM import (and .js extension)
perl -i -pe '
  s/^\s*const\s*\{\s*entitlementRoutes\s*\}\s*=\s*require\(\s*["'\'']\.\/abando\/entitlement["'\'']\s*\)\s*;\s*$/import { entitlementRoutes } from "\.\/abando\/entitlement\.js";/m;
  s/^\s*const\s*\{\s*entitlementRoutes\s*\}\s*=\s*require\(\s*["'\'']\.\/abando\/entitlement\.(js|mjs|cjs|ts)["'\'']\s*\)\s*;\s*$/import { entitlementRoutes } from "\.\/abando\/entitlement\.js";/m;
  s/^\s*import\s*\{\s*entitlementRoutes\s*\}\s*from\s*["'\'']\.\/abando\/entitlement["'\'']\s*;\s*$/import { entitlementRoutes } from "\.\/abando\/entitlement\.js";/m;
' "$INDEX"

echo "✅ Patched: $INDEX"
echo

# 2) Find entitlement module file (prefer .js; else locate by grep)
ENT=""
for f in \
  "$WEB_DIR/src/abando/entitlement.js" \
  "$WEB_DIR/src/abando/entitlement.mjs" \
  "$WEB_DIR/src/abando/entitlement.cjs" \
  "$WEB_DIR/src/abando/entitlement.ts"
do
  if test -f "$f"; then ENT="$f"; break; fi
done

if test -z "$ENT"; then
  # Try to locate a file that defines entitlementRoutes
  ENT="$(grep -RIl --exclude-dir=node_modules --exclude='*.bak_*' 'entitlementRoutes' "$WEB_DIR/src/abando" 2>/dev/null | head -n 1 || true)"
fi

if test -z "$ENT"; then
  echo "⚠️ Could not locate entitlement module automatically."
  echo "   index.js was still patched; now locate the module and ensure it exports entitlementRoutes as ESM."
  exit 0
fi

echo "📦 Entitlement module: $ENT"
backup "$ENT"

# 3) Convert CommonJS export patterns to ESM-friendly export
# Handle:
# - module.exports = { entitlementRoutes }
# - module.exports = entitlementRoutes
# - exports.entitlementRoutes = ...
# If file already has ESM export, we’ll just ensure entitlementRoutes is exported.
perl -0777 -i -pe '
  # module.exports = { entitlementRoutes: entitlementRoutes } / module.exports = { entitlementRoutes }
  s/module\.exports\s*=\s*\{\s*entitlementRoutes\s*:\s*entitlementRoutes\s*\}\s*;?/export { entitlementRoutes };/g;
  s/module\.exports\s*=\s*\{\s*entitlementRoutes\s*\}\s*;?/export { entitlementRoutes };/g;

  # module.exports = entitlementRoutes
  s/module\.exports\s*=\s*entitlementRoutes\s*;?/export { entitlementRoutes };/g;

  # exports.entitlementRoutes = entitlementRoutes OR exports.entitlementRoutes = function...
  s/exports\.entitlementRoutes\s*=\s*entitlementRoutes\s*;?/\/\/ (converted from CJS)\nexport { entitlementRoutes };/g;

  # If exports.entitlementRoutes = (something inline), rewrite to const entitlementRoutes = (something) + export
  s/exports\.entitlementRoutes\s*=\s*([^\n;]+)\s*;?/const entitlementRoutes = $1;\nexport { entitlementRoutes };/g;
' "$ENT"

# 4) If no export found but entitlementRoutes is declared, append `export { entitlementRoutes }`
HAS_EXPORT="$(grep -nE '^\s*export\s+\{?\s*entitlementRoutes' "$ENT" || true)"
HAS_DECL="$(grep -nE '^\s*(export\s+)?(async\s+)?function\s+entitlementRoutes\b|^\s*const\s+entitlementRoutes\b|^\s*let\s+entitlementRoutes\b' "$ENT" || true)"

if test -z "$HAS_EXPORT" && test -n "$HAS_DECL"; then
  echo >> "$ENT"
  echo "// added by scripts/31_fix_esm_require_crash.sh" >> "$ENT"
  echo "export { entitlementRoutes };" >> "$ENT"
fi

echo "✅ Patched: $ENT"
echo

echo "== Post-patch sanity checks =="
echo "--- index.js entitlement line ---"
grep -nE 'abando/entitlement|entitlementRoutes' "$INDEX" || true
echo
echo "--- entitlement exports ---"
grep -nE 'module\.exports|exports\.|export\s+\{?\s*entitlementRoutes' "$ENT" || true

echo
echo "Done. Next: run scripts/32_verify_web_3000.sh"
