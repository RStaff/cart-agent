#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ Missing: $FILE"; exit 1; }

# Detect the entitlement module path (prefer ESM-friendly targets)
CANDIDATES=(
  "web/src/abando/entitlement.js"
  "web/src/abando/entitlement.mjs"
  "web/src/abando/entitlement/index.js"
  "web/src/abando/entitlement/index.mjs"
)

MOD=""
for c in "${CANDIDATES[@]}"; do
  if test -f "$c"; then
    MOD="$c"
    break
  fi
done

if [ -z "$MOD" ]; then
  echo "❌ Could not find entitlement module at:"
  printf "   - %s\n" "${CANDIDATES[@]}"
  echo "   (If it exists but with a different name, tell me the filename under web/src/abando/)"
  exit 1
fi

# Build relative import path from web/src/index.js
# MOD like web/src/abando/entitlement.js -> ./abando/entitlement.js
REL="./${MOD#web/src/}"
echo "✅ Detected entitlement module: $REL"

stamp="$(date +%s)"
cp "$FILE" "$FILE.bak_${stamp}"
echo "✅ Backup: $FILE.bak_${stamp}"

# 1) Remove the CommonJS require line if present
# 2) Ensure we have a single ESM import for entitlementRoutes near the top (after existing imports)
perl -0777 -i -pe '
  my $rel = $ENV{REL};

  # Remove: const { entitlementRoutes } = require("./abando/entitlement");
  s/^[ \t]*const\s*\{\s*entitlementRoutes\s*\}\s*=\s*require\([^)]*\)\s*;\s*\n//mg;

  # Remove any previous ESM import of entitlementRoutes (avoid duplicates)
  s/^[ \t]*import\s*\{\s*entitlementRoutes\s*\}\s*from\s*["\047][^"\047]+["\047]\s*;\s*\n//mg;

  # Insert the import after the last top-level import line
  if (m/^(?:[ \t]*import\b.*\n)+/m) {
    s/^(?:[ \t]*import\b.*\n)+/$&import { entitlementRoutes } from "$rel";\n/m;
  } else {
    $_ = qq{import { entitlementRoutes } from "$rel";\n} . $_;
  }
' "$FILE"

echo "🔍 Sanity check:"
node --check "$FILE"
echo "✅ index.js parses (ESM)"

echo
echo "🔁 Restart dev stack"
lsof -ti tcp:3000 | xargs -r kill -9 || true
lsof -ti tcp:3001 | xargs -r kill -9 || true
./scripts/dev.sh cart-agent-dev.myshopify.com

echo
echo "✅ Status:"
lsof -nP -iTCP:3000 -sTCP:LISTEN || true
lsof -nP -iTCP:3001 -sTCP:LISTEN || true
