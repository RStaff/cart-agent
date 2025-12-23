#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

ts(){ date +%s; }
backup(){ test -f "$1" && cp "$1" "$1.bak_$(ts)" || true; }

INDEX="web/src/index.js"
ENT="web/src/abando/entitlement.js"
MET="web/src/abando/metrics.js"

echo "🧩 Fixing nested require() in metrics + cleaning index.js…"
test -f "$INDEX" || { echo "❌ Missing $INDEX"; exit 1; }
test -f "$ENT"   || { echo "❌ Missing $ENT"; exit 1; }
test -f "$MET"   || { echo "❌ Missing $MET"; exit 1; }

backup "$INDEX"
backup "$ENT"
backup "$MET"

# 1) Fix glued statements in index.js (ensure newline before entitlementRoutes(app);)
perl -i -pe 's/(metrics\.js";)\s*entitlementRoutes\(/\1\nentitlementRoutes(/g' "$INDEX"

# 2) Convert require("./entitlement") in metrics.js to ESM import with .js extension
perl -i -pe '
  s/^\s*const\s*\{\s*computeEntitlement\s*,\s*getBillingMode\s*\}\s*=\s*require\(\s*["'\'']\.\/entitlement["'\'']\s*\)\s*;\s*$/import { computeEntitlement, getBillingMode } from "\.\/entitlement\.js";/m;
  s/^\s*const\s*\{\s*computeEntitlement\s*,\s*getBillingMode\s*\}\s*=\s*require\(\s*["'\'']\.\/entitlement\.js["'\'']\s*\)\s*;\s*$/import { computeEntitlement, getBillingMode } from "\.\/entitlement\.js";/m;
' "$MET"

# 3) Ensure entitlement.js exports computeEntitlement + getBillingMode if they are defined
has_decl_compute="$(grep -nE '^\s*(async\s+)?function\s+computeEntitlement\b|^\s*const\s+computeEntitlement\b|^\s*let\s+computeEntitlement\b' "$ENT" || true)"
has_decl_mode="$(grep -nE '^\s*(async\s+)?function\s+getBillingMode\b|^\s*const\s+getBillingMode\b|^\s*let\s+getBillingMode\b' "$ENT" || true)"

# If file already exports them, do nothing. Otherwise append a named export line.
has_export_line="$(grep -nE '^\s*export\s+\{[^}]*computeEntitlement|^\s*export\s+\{[^}]*getBillingMode' "$ENT" || true)"

if test -z "$has_export_line"; then
  if test -n "$has_decl_compute" || test -n "$has_decl_mode"; then
    echo >> "$ENT"
    echo "// added by scripts/34_fix_metrics_entitlement_imports.sh" >> "$ENT"
    # export only what exists (avoid exporting undefined)
    if test -n "$has_decl_compute" && test -n "$has_decl_mode"; then
      echo "export { computeEntitlement, getBillingMode };" >> "$ENT"
    elif test -n "$has_decl_compute"; then
      echo "export { computeEntitlement };" >> "$ENT"
    elif test -n "$has_decl_mode"; then
      echo "export { getBillingMode };" >> "$ENT"
    fi
  fi
fi

echo
echo "✅ Patched:"
echo " - $INDEX"
echo " - $MET"
echo " - $ENT"
echo
echo "== Sanity =="
echo "--- index.js around imports/calls ---"
nl -ba "$INDEX" | sed -n '1,80p' | sed -n '12,40p'
echo
echo "--- metrics.js entitlement import line ---"
grep -nE 'entitlement' "$MET" || true
echo
echo "--- entitlement exports found ---"
grep -nE 'export\s+\{[^}]*entitlementRoutes|export\s+\{[^}]*computeEntitlement|export\s+\{[^}]*getBillingMode' "$ENT" || true

echo
echo "Next: run scripts/32_verify_web_3000.sh"
