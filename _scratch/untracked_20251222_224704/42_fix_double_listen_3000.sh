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
