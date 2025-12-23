#!/usr/bin/env bash
set -euo pipefail

echo "🔎 Locate the '[server] listening' source"
echo "Repo: $(pwd)"
echo

echo "1) Files containing the log string:"
grep -RIn --exclude-dir=node_modules --exclude-dir=.git '\[server\] listening' . || true

echo
echo "2) Show listen() callsites under web/ (top 200):"
grep -RIn --exclude-dir=node_modules --exclude-dir=.git -E '\.listen\s*\(' web | head -n 200 || true

echo
echo "3) Show listen() callsites outside web/ that might be imported:"
grep -RIn --exclude-dir=node_modules --exclude-dir=.git -E '\.listen\s*\(' . \
  | grep -v '^./web/' \
  | head -n 200 || true

echo
echo "✅ Done."
