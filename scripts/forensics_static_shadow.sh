#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"

echo "== A) Static root configured in index.js =="
grep -n 'express\.static' "$FILE" || true
echo

echo "== B) Root + demo routes in index.js =="
grep -n 'app\.get("\/".*' "$FILE" || true
grep -n 'demo\/playground' "$FILE" || true
echo

echo "== C) Does web/src/public exist? =="
ls -la web/src/public 2>/dev/null || echo "❌ web/src/public NOT found"
echo

echo "== D) Look for likely served files =="
for p in \
  "web/src/public/index.html" \
  "web/src/public/demo/playground/index.html" \
  "web/src/public/demo/playground.html" \
  "web/public/index.html" \
  "web/public/demo/playground/index.html" \
  "web/public/demo/playground.html"
do
  if [ -f "$p" ]; then
    echo "✅ FOUND: $p"
  fi
done
echo

echo "== E) Grep the phrase 'AI Shopping Copilot Playground' across static dirs =="
grep -R --line-number --fixed-strings "AI Shopping Copilot Playground" web/src/public web/public 2>/dev/null || true

echo
echo "✅ Forensics complete."
