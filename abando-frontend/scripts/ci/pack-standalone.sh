#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
mkdir -p preview
rm -rf preview/*
cp -a .next/standalone/* preview/
mkdir -p preview/.next/static
cp -a .next/static/* preview/.next/static/
if [ -d public ]; then
  mkdir -p preview/public
  cp -a public/* preview/public/ 2>/dev/null || true
fi
cat > preview/README.txt <<'TXT'
Run locally:
  PORT=3000 node server.js
TXT
echo "✓ packed Next standalone preview → preview/"
ls -la preview | sed 's/^/  /'
