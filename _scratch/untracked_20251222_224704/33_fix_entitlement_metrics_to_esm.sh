#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

WEB_DIR="web"
INDEX="$WEB_DIR/src/index.js"
ENT="$WEB_DIR/src/abando/entitlement.js"
METRICS="$WEB_DIR/src/abando/metrics.js"

echo "🛠  Converting entitlement + metrics to pure ESM and fixing index.js…"
test -f "$INDEX" || { echo "❌ Missing $INDEX"; exit 1; }
test -f "$ENT" || { echo "❌ Missing $ENT"; exit 1; }
test -f "$METRICS" || { echo "❌ Missing $METRICS"; exit 1; }

ts="$(date +%s)"
cp "$INDEX"   "$INDEX.bak_$ts"
cp "$ENT"     "$ENT.bak_$ts"
cp "$METRICS" "$METRICS.bak_$ts"

# --- Fix index.js: remove require() for entitlement/metrics and add ESM imports
# If the file already has correct imports, this is safe.
# We:
#  1) delete lines containing: require("./abando/entitlement") and require("./abando/metrics")
#  2) ensure we have:
#       import { entitlementRoutes } from "./abando/entitlement.js";
#       import { metricsRoutes } from "./abando/metrics.js";
perl -i -ne '
  next if /require\(\s*["'\'']\.\/abando\/entitlement/;
  next if /require\(\s*["'\'']\.\/abando\/metrics/;
  print;
' "$INDEX"

# Ensure imports exist near the top (after last import line, or at file top)
# Insert only if missing.
if ! grep -qE 'import\s+\{\s*entitlementRoutes\s*\}\s+from\s+"\.\/abando\/entitlement\.js"' "$INDEX"; then
  perl -0777 -i -pe '
    if ($_ !~ /import\s+\{\s*entitlementRoutes\s*\}\s+from\s+"\.\/abando\/entitlement\.js"/) {
      s/(\nimport[^\n]*;\s*)/\1import { entitlementRoutes } from "\.\/abando\/entitlement\.js";\n/s;
      if ($_ !~ /import\s+\{\s*entitlementRoutes\s*\}\s+from/) {
        $_ = "import { entitlementRoutes } from \"\.\/abando\/entitlement\.js\";\n" . $_;
      }
    }
  ' "$INDEX"
fi

if ! grep -qE 'import\s+\{\s*metricsRoutes\s*\}\s+from\s+"\.\/abando\/metrics\.js"' "$INDEX"; then
  perl -0777 -i -pe '
    if ($_ !~ /import\s+\{\s*metricsRoutes\s*\}\s+from\s+"\.\/abando\/metrics\.js"/) {
      s/(\nimport[^\n]*;\s*)/\1import { metricsRoutes } from "\.\/abando\/metrics\.js";\n/s;
      if ($_ !~ /import\s+\{\s*metricsRoutes\s*\}\s+from/) {
        $_ = "import { metricsRoutes } from \"\.\/abando\/metrics\.js\";\n" . $_;
      }
    }
  ' "$INDEX"
fi

# --- Fix entitlement.js: remove module.exports and ensure named exports exist
# We keep existing function bodies, but remove CJS export blocks.
perl -0777 -i -pe '
  s/\n\s*module\.exports\s*=\s*\{.*?\}\s*;?\s*\n/\n/sg;
  s/\n\s*exports\.[A-Za-z0-9_]+\s*=\s*.*?;?\s*\n/\n/sg;
' "$ENT"

# If entitlementRoutes is declared but not exported, add export line.
HAS_ER="$(grep -nE '^\s*(export\s+)?(async\s+)?function\s+entitlementRoutes\b|^\s*(export\s+)?const\s+entitlementRoutes\b' "$ENT" || true)"
if [ -n "$HAS_ER" ] && ! grep -qE 'export\s+\{\s*entitlementRoutes\s*\}' "$ENT"; then
  printf "\n// added by scripts/33_fix_entitlement_metrics_to_esm.sh\nexport { entitlementRoutes };\n" >> "$ENT"
fi

# If computeEntitlement/getBillingMode exist but not exported, add them.
HAS_CE="$(grep -nE '^\s*(export\s+)?(async\s+)?function\s+computeEntitlement\b|^\s*(export\s+)?const\s+computeEntitlement\b' "$ENT" || true)"
HAS_GBM="$(grep -nE '^\s*(export\s+)?(async\s+)?function\s+getBillingMode\b|^\s*(export\s+)?const\s+getBillingMode\b' "$ENT" || true)"
if [ -n "$HAS_CE$HAS_GBM" ] && ! grep -qE 'export\s+\{\s*computeEntitlement' "$ENT"; then
  printf "\nexport { computeEntitlement, getBillingMode };\n" >> "$ENT"
fi

# --- Fix metrics.js: convert require("./entitlement") to ESM import
perl -0777 -i -pe '
  s/const\s+\{\s*computeEntitlement\s*,\s*getBillingMode\s*\}\s*=\s*require\(\s*["'\'']\.\/entitlement["'\'']\s*\)\s*;?/import { computeEntitlement, getBillingMode } from "\.\/entitlement\.js";/g;
  s/require\(\s*["'\'']\.\/entitlement\.js["'\'']\s*\)/await import("\.\/entitlement\.js")/g;
  s/\n\s*module\.exports\s*=\s*\{.*?\}\s*;?\s*\n/\n/sg;
  s/\n\s*exports\.[A-Za-z0-9_]+\s*=\s*.*?;?\s*\n/\n/sg;
' "$METRICS"

# Ensure metricsRoutes is exported
HAS_MR="$(grep -nE '^\s*(export\s+)?(async\s+)?function\s+metricsRoutes\b|^\s*(export\s+)?const\s+metricsRoutes\b' "$METRICS" || true)"
if [ -n "$HAS_MR" ] && ! grep -qE 'export\s+\{\s*metricsRoutes\s*\}' "$METRICS"; then
  printf "\n// added by scripts/33_fix_entitlement_metrics_to_esm.sh\nexport { metricsRoutes };\n" >> "$METRICS"
fi

# Ensure index calls the routes (best-effort; won’t duplicate)
grep -q 'entitlementRoutes(app' "$INDEX" || echo 'entitlementRoutes(app);' >> "$INDEX"
grep -q 'metricsRoutes(app' "$INDEX" || echo 'metricsRoutes(app);' >> "$INDEX"

echo
echo "✅ Patched files:"
echo " - $INDEX"
echo " - $ENT"
echo " - $METRICS"
echo
echo "== Quick sanity =="
echo "--- index imports (entitlement/metrics) ---"
grep -nE 'import\s+\{\s*(entitlementRoutes|metricsRoutes)\s*\}\s+from\s+"\.\/abando\/(entitlement|metrics)\.js"' "$INDEX" || true
echo
echo "--- metrics.js entitlement import line ---"
grep -nE 'import\s+\{\s*computeEntitlement\s*,\s*getBillingMode\s*\}\s+from\s+"\.\/entitlement\.js"' "$METRICS" || true
echo
echo "--- entitlement exports found ---"
grep -nE 'export\s+\{\s*entitlementRoutes\s*\}|export\s+\{\s*computeEntitlement|export\s+\{\s*computeEntitlement,\s*getBillingMode' "$ENT" || true

echo
echo "Next: run scripts/32_verify_web_3000.sh"
