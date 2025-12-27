#!/usr/bin/env bash
set -euo pipefail

CFG="abando-frontend/next.config.mjs"
test -f "$CFG" || { echo "❌ $CFG not found"; exit 1; }

cp "$CFG" "$CFG.bak_$(date +%s)"

node <<'NODE'
const fs = require("fs");
const path = "abando-frontend/next.config.mjs";
let s = fs.readFileSync(path, "utf8");

// 1) Remove deprecated/invalid `eslint: {...}` blocks (common old Next config pattern)
s = s.replace(/\n\s*eslint\s*:\s*\{[\s\S]*?\}\s*,?\s*\n/g, "\n");

// 2) Ensure turbopack.root exists (helps Next pick correct workspace root)
if (!/turbopack\s*:/.test(s)) {
  // Insert turbopack config into the exported object if it looks like: export default { ... }
  s = s.replace(/export\s+default\s+\{\s*\n/, match => match + `  turbopack: { root: __dirname },\n`);
} else if (!/turbopack\s*:\s*\{[\s\S]*root\s*:/.test(s)) {
  // Add root inside existing turbopack block
  s = s.replace(/turbopack\s*:\s*\{\s*\n/, m => m + `    root: __dirname,\n`);
}

fs.writeFileSync(path, s);
console.log("✅ Patched next.config.mjs (removed eslint key, set turbopack.root)");
NODE
