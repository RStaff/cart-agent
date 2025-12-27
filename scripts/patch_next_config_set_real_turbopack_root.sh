#!/usr/bin/env bash
set -euo pipefail

CFG="abando-frontend/next.config.mjs"
test -f "$CFG" || { echo "❌ $CFG not found"; exit 1; }

cp "$CFG" "$CFG.bak_$(date +%s)"

node <<'NODE'
const fs = require("fs");

const p = "abando-frontend/next.config.mjs";
let s = fs.readFileSync(p, "utf8");

// If we already have a __dirname shim, do nothing.
const hasDirnameShim =
  /fileURLToPath\s*\(\s*import\.meta\.url\s*\)/.test(s) &&
  /const\s+__dirname\s*=/.test(s);

if (!hasDirnameShim) {
  // Prepend an ESM-safe __dirname shim
  const shim =
`import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

`;
  s = shim + s;
}

// Ensure turbopack.root is present in export default object.
if (!/turbopack\s*:/.test(s)) {
  s = s.replace(/export\s+default\s+\{\s*\n/, m => m + `  turbopack: { root: __dirname },\n`);
} else if (!/turbopack\s*:\s*\{[\s\S]*root\s*:/.test(s)) {
  s = s.replace(/turbopack\s*:\s*\{\s*\n/, m => m + `    root: __dirname,\n`);
}

fs.writeFileSync(p, s);
console.log("✅ next.config.mjs: added ESM __dirname shim + turbopack.root");
NODE
