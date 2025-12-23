#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

INDEX="web/src/index.js"
test -f "$INDEX" || { echo "❌ Missing $INDEX"; exit 1; }

ts="$(date +%s)"
cp "$INDEX" "$INDEX.bak_$ts"

echo "🧯 Removing app.listen() from index.js so start.mjs is the only listener..."

# 1) Comment out any app.listen(...) line (best-effort, single-line or same line)
#    We only target lines that contain app.listen( to avoid broad edits.
perl -i -pe 's/^(\s*)(app\.listen\()/$1\/\/ [ABANDO] listen moved to web\/start.mjs\n$1\/\/ $2/g if /app\.listen\(/' "$INDEX"

# 2) If index.js does not export app, add `export default app;` near end
if ! grep -qE 'export\s+default\s+app\s*;' "$INDEX"; then
  printf "\n// [ABANDO] start.mjs owns listening; index exports app\nexport default app;\n" >> "$INDEX"
fi

echo "✅ Patched: $INDEX"
echo
echo "== Sanity: listen/export lines =="
grep -nE 'app\.listen\(|export\s+default\s+app' "$INDEX" || true
