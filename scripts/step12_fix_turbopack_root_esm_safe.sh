#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

CFG="abando-frontend/next.config.mjs"
[ -f "$CFG" ] || { echo "❌ Missing $CFG"; exit 1; }

cp "$CFG" "$CFG.bak_$(date +%s)" || true

node - <<'NODE'
import fs from "fs";

const cfgPath = "abando-frontend/next.config.mjs";
let s = fs.readFileSync(cfgPath, "utf8");

// remove the broken __dirname line if present
s = s.replace(/turbopack:\s*\{\s*root:\s*__dirname\s*\},?\s*\n/g, "");

// if turbopack.root not present, inject a safe ESM root
if (!s.includes("turbopack:")) {
  s = s.replace(
    /const nextConfig = \{\n/,
`import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  turbopack: { root: __dirname },
`
  );
}

fs.writeFileSync(cfgPath, s);
console.log("✅ Patched turbopack.root safely in", cfgPath);
NODE

echo "NEXT: restart dev (./scripts/dev.sh ...)"
