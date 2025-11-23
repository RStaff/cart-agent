#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$ROOT_DIR/web"
TARGET="$WEB_DIR/src/index.js"

echo "=== Patch backend /health route ==="
echo "Repo root: $ROOT_DIR"
echo "Backend dir: $WEB_DIR"
echo "Target file: $TARGET"
echo

if [ ! -f "$TARGET" ]; then
  echo "❌ Cannot find $TARGET"
  echo "   Expected backend at web/src/index.js"
  exit 1
fi

# If /health already exists, don't double-inject
if grep -q '"/health"' "$TARGET"; then
  echo "✅ /health route already present in src/index.js — nothing to do."
  exit 0
fi

echo "→ Injecting /health route after 'const app = express();' ..."

node - << 'NODE'
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const target = path.join(root, 'web', 'src', 'index.js');

let src = fs.readFileSync(target, 'utf8');

const needle = 'const app = express();';
if (!src.includes(needle)) {
  console.error('❌ Could not find `const app = express();` in web/src/index.js');
  process.exit(1);
}

if (src.includes('"/health"')) {
  console.log('✅ /health already present — skipping modify.');
  process.exit(0);
}

const injection = `
${needle}

// Simple health check for local + Render monitoring
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "abando-backend" });
});
`.trimStart();

src = src.replace(needle, injection);

fs.writeFileSync(target, src, 'utf8');
console.log('✅ /health route injected into web/src/index.js');
NODE

echo
echo "✅ Patch complete."
