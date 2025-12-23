#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ Missing: $FILE"; exit 1; }

CANDIDATES=(
  "web/src/abando/metrics.js"
  "web/src/abando/metrics.mjs"
  "web/src/abando/metrics/index.js"
  "web/src/abando/metrics/index.mjs"
)

MOD=""
for c in "${CANDIDATES[@]}"; do
  if test -f "$c"; then
    MOD="$c"
    break
  fi
done

if [ -z "$MOD" ]; then
  echo "❌ Could not find metrics module at:"
  printf "   - %s\n" "${CANDIDATES[@]}"
  echo "   (Run: ls -la web/src/abando | sed -n '1,200p' and paste it)"
  exit 1
fi

REL="./${MOD#web/src/}"
echo "✅ Detected metrics module: $REL"

stamp="$(date +%s)"
cp "$FILE" "$FILE.bak_${stamp}"
echo "✅ Backup: $FILE.bak_${stamp}"

perl -0777 -i -pe '
  my $rel = $ENV{REL};

  # Remove CommonJS require
  s/^[ \t]*const\s*\{\s*metricsRoutes\s*\}\s*=\s*require\([^)]*\)\s*;\s*\n//mg;

  # Remove any existing ESM import to avoid duplicates
  s/^[ \t]*import\s*\{\s*metricsRoutes\s*\}\s*from\s*["\047][^"\047]+["\047]\s*;\s*\n//mg;

  # Insert ESM import after last top-level import
  if (m/^(?:[ \t]*import\b.*\n)+/m) {
    s/^(?:[ \t]*import\b.*\n)+/$&import { metricsRoutes } from "$rel";\n/m;
  } else {
    $_ = qq{import { metricsRoutes } from "$rel";\n} . $_;
  }
' "$FILE"

echo "🔍 Sanity check:"
node --check "$FILE"
echo "✅ index.js parses (metrics fixed)"

echo
echo "🔁 Restart dev stack"
lsof -ti tcp:3000 | xargs -r kill -9 || true
lsof -ti tcp:3001 | xargs -r kill -9 || true
./scripts/dev.sh cart-agent-dev.myshopify.com

echo
echo "✅ Status:"
lsof -nP -iTCP:3000 -sTCP:LISTEN || true
lsof -nP -iTCP:3001 -sTCP:LISTEN || true

echo
echo "🔎 Remaining requires in index.js (should be none):"
grep -n "require(" web/src/index.js || echo "✅ none"
