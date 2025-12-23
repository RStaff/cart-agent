#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"
mkdir -p scripts

echo "🧱 Generating Abando runbook scripts in: $ROOT/scripts"

# ---------------------------
# 30) Diagnose ESM/CJS mismatch
# ---------------------------
cat << 'E30' > scripts/30_esm_require_diagnostic.sh
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
E30
chmod +x scripts/30_esm_require_diagnostic.sh

# ---------------------------
# 33) Convert entitlement + metrics to pure ESM + fix index imports
# ---------------------------
cat << 'E33' > scripts/33_fix_entitlement_metrics_to_esm.sh
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
E33
chmod +x scripts/33_fix_entitlement_metrics_to_esm.sh

# ---------------------------
# 32) Verify web dev binds :3000 (quick smoke)
# ---------------------------
cat << 'E32' > scripts/32_verify_web_3000.sh
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

LOG="../.verify_web_3000.log"
rm -f "$LOG"

echo "🧪 Verifying web dev server binds :3000 and stays up..."
pushd web >/dev/null

npm run dev >"$LOG" 2>&1 &
PID="$!"
popd >/dev/null

echo "PID: $PID"
echo "Log: $LOG"

# Wait up to 18s
for i in $(seq 1 36); do
  if lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
    echo "✅ Port 3000 is listening."
    echo
    echo "---- last 80 log lines ----"
    tail -n 80 "$LOG" || true
    echo
    echo "Stopping dev server..."
    kill "$PID" >/dev/null 2>&1 || true
    exit 0
  fi
  if ! kill -0 "$PID" >/dev/null 2>&1; then
    echo "❌ Dev process exited early."
    echo
    echo "---- log ----"
    cat "$LOG" || true
    exit 1
  fi
  sleep 0.5
done

echo "❌ Timed out waiting for :3000."
echo
echo "---- log ----"
tail -n 120 "$LOG" || true
echo
echo "Stopping dev server..."
kill "$PID" >/dev/null 2>&1 || true
exit 1
E32
chmod +x scripts/32_verify_web_3000.sh

# ---------------------------
# 40) Clean start dev (kills 3000/3001, runs scripts/dev.sh)
# ---------------------------
cat << 'E40' > scripts/40_dev_clean.sh
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

SHOP="${1:-cart-agent-dev.myshopify.com}"

echo "🧹 Killing ports 3000 + 3001..."
lsof -ti tcp:3000 | xargs -r kill -9 || true
lsof -ti tcp:3001 | xargs -r kill -9 || true

echo "🚀 Starting Express (:3000) + Next (:3001)..."
./scripts/dev.sh "$SHOP"

echo
echo "✅ OPEN:"
echo "  UI:        http://localhost:3001/embedded?shop=$SHOP"
echo "  Playground:http://localhost:3001/demo/playground?shop=$SHOP"
echo "  Billing:   http://localhost:3001/api/billing/status?shop=$SHOP"
echo "  Preview:   http://localhost:3001/api/rescue/preview?shop=$SHOP"
echo "  Real:      http://localhost:3001/api/rescue/real?shop=$SHOP"
echo
echo "Logs:"
echo "  tail -n 160 .dev_express.log"
echo "  tail -n 160 .dev_next.log"
E40
chmod +x scripts/40_dev_clean.sh

# ---------------------------
# 41) Stub E2E (assumes dev is already running)
# ---------------------------
cat << 'E41' > scripts/41_test_billing_stub_e2e_no_boot.sh
#!/usr/bin/env bash
set -euo pipefail
SHOP="${1:-cart-agent-dev.myshopify.com}"

echo "🧪 Billing Stub E2E (NO BOOT) — assumes dev is already running"
echo "Shop: $SHOP"
echo

BASE="http://localhost:3001"
STATUS="$BASE/api/billing/status?shop=$SHOP"
PREVIEW="$BASE/api/rescue/preview?shop=$SHOP"

echo "1) Checking billing status…"
curl -fsS "$STATUS" | sed -n '1,240p'
echo
echo "✅ status ok"
echo

echo "2) Checking rescue preview…"
curl -fsS "$PREVIEW" | sed -n '1,240p'
echo
echo "✅ preview ok"
echo
echo "Done."
E41
chmod +x scripts/41_test_billing_stub_e2e_no_boot.sh

# ---------------------------
# 60) Status dump (status + preview + real)
# ---------------------------
cat << 'E60' > scripts/60_status_dump.sh
#!/usr/bin/env bash
set -euo pipefail
SHOP="${1:-cart-agent-dev.myshopify.com}"
BASE="${2:-http://localhost:3001}"

echo "📋 Abando Status Dump"
echo "Shop: $SHOP"
echo "Base: $BASE"
echo

for path in "api/billing/status" "api/rescue/preview" "api/rescue/real"; do
  echo "== GET /$path =="
  curl -fsS "$BASE/$path?shop=$SHOP" | sed -n '1,260p'
  echo
done
E60
chmod +x scripts/60_status_dump.sh

# ---------------------------
# 70) Tail logs helper
# ---------------------------
cat << 'E70' > scripts/70_tail_logs.sh
#!/usr/bin/env bash
set -euo pipefail
echo "📜 Tailing dev logs (Ctrl+C to stop)…"
echo
echo "=== .dev_express.log (last 120, then follow) ==="
tail -n 120 -f .dev_express.log
E70
chmod +x scripts/70_tail_logs.sh

# ---------------------------
# 42) Optional: patch start.mjs to refuse EADDRINUSE (double-listen visibility)
# ---------------------------
cat << 'E42' > scripts/42_fix_double_listen_3000.sh
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

START="web/start.mjs"
test -f "$START" || { echo "❌ Missing $START"; exit 1; }

ts="$(date +%s)"
cp "$START" "$START.bak_$ts"

echo "🔎 Inspecting for double-listen behavior..."
echo
echo "== web/start.mjs (listen-related lines) =="
nl -ba "$START" | sed -n '1,220p' | grep -nE 'listen\(|EADDRINUSE|port in use|skipping|refusing' || true
echo

# Rewrite EADDRINUSE handler to exit(1) (so you SEE it)
perl -0777 -i -pe '
  s/if\s*\(\s*err\s*&&\s*err\.code\s*===\s*["'\'']EADDRINUSE["'\'']\s*\)\s*\{\s*[^}]*?\}/if (err && err.code === "EADDRINUSE") {\n  console.error("[start] EADDRINUSE: port already in use; refusing to start twice (fix applied)");\n  process.exit(1);\n}/gs;
' "$START" || true

echo "✅ Patched: $START"
echo
echo "== Post-patch listen-related lines =="
nl -ba "$START" | sed -n '1,260p' | grep -nE 'listen\(|EADDRINUSE|refusing to start twice|port already in use|port in use' || true
E42
chmod +x scripts/42_fix_double_listen_3000.sh

echo "✅ Done generating scripts."
echo
echo "NEXT (run in order):"
echo "  1) ./scripts/30_esm_require_diagnostic.sh"
echo "  2) ./scripts/33_fix_entitlement_metrics_to_esm.sh"
echo "  3) ./scripts/32_verify_web_3000.sh"
echo "  4) ./scripts/40_dev_clean.sh cart-agent-dev.myshopify.com"
echo "  5) ./scripts/41_test_billing_stub_e2e_no_boot.sh cart-agent-dev.myshopify.com"
echo "  6) ./scripts/60_status_dump.sh cart-agent-dev.myshopify.com"
echo "Optional:"
echo "  - ./scripts/42_fix_double_listen_3000.sh"
