#!/usr/bin/env bash
set -euo pipefail

echo "=== Backend dev runner ==="

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$ROOT/web"

echo "Backend dir: $BACKEND_DIR"
cd "$BACKEND_DIR"

echo
echo "→ Using Node version:"
node -v || echo "⚠️ Node not found in PATH"

echo
echo "→ Checking available npm scripts..."
node - << 'NODE'
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
console.log(JSON.stringify(pkg.scripts || {}, null, 2));
NODE

RUN_SCRIPT=""

# Prefer dev if present
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
  if (pkg.scripts && pkg.scripts.dev) process.exit(0); else process.exit(1);
" && RUN_SCRIPT="dev" || true

# Fallback to start if no dev
if [ -z "$RUN_SCRIPT" ]; then
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
    if (pkg.scripts && pkg.scripts.start) process.exit(0); else process.exit(1);
  " && RUN_SCRIPT="start" || true
fi

if [ -z "$RUN_SCRIPT" ]; then
  echo "❌ Neither 'dev' nor 'start' script found in web/package.json"
  exit 1
fi

echo
echo "→ Running: npm run $RUN_SCRIPT"
echo "   (Leave this process running while you test; Ctrl+C to stop.)"
echo

npm run "$RUN_SCRIPT"
