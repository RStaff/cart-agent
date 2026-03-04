#!/usr/bin/env bash
set -euo pipefail
FILE="web/src/index.js"

echo "=== preflight ==="
node -c "$FILE" >/dev/null && echo "✓ node -c ok (before)"
grep -n "function normalizeShopDomain" "$FILE" | head -n 5 || { echo "✗ normalizeShopDomain not found"; exit 1; }

BACKUP="${FILE}.bak_$(date +%Y%m%d_%H%M%S)_rmNormDomain"
cp -v "$FILE" "$BACKUP" >/dev/null
echo "✓ backup: $BACKUP"

node <<'NODE'
const fs = require("fs");
const path = "web/src/index.js";
const s = fs.readFileSync(path, "utf8");

// Remove the entire function normalizeShopDomain(raw) { ... } block.
// This regex is intentionally anchored to "function normalizeShopDomain" and removes until the matching closing brace
// followed by optional whitespace/newlines.
const re = /(^|\n)function normalizeShopDomain\s*\(\s*raw\s*\)\s*\{[\s\S]*?\n\}\n/m;

if (!re.test(s)) {
  console.error("✗ Could not find normalizeShopDomain function block");
  process.exit(1);
}

const out = s.replace(re, "\n");
fs.writeFileSync(path, out, "utf8");
NODE

echo "=== postflight ==="
node -c "$FILE" >/dev/null && echo "✓ node -c ok (after)"
echo "=== confirm removed (should be empty) ==="
grep -n "function normalizeShopDomain" "$FILE" || true

echo ""
echo "=== diff ==="
git diff -- "$FILE" | sed -n '1,200p'
