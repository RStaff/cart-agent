#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

CFG="abando-frontend/next.config.mjs"
if [ ! -f "$CFG" ]; then
  echo "❌ Missing $CFG (expected from step6 ESM fix)"
  exit 1
fi

cp "$CFG" "$CFG.bak_$(date +%s)" || true

node - <<'NODE'
import fs from "fs";

const cfgPath = "abando-frontend/next.config.mjs";
let s = fs.readFileSync(cfgPath, "utf8");

// naive but safe: inject turbopack.root if missing
if (!s.includes("turbopack")) {
  s = s.replace(
    /const nextConfig = \{\n/,
    `const nextConfig = {\n  turbopack: { root: __dirname },\n`
  );
} else if (!s.includes("root:")) {
  // leave as-is; user can handle manually if they already customized
}

fs.writeFileSync(cfgPath, s);
console.log("✅ Patched turbopack.root in", cfgPath);
NODE

echo "NEXT:"
echo "  restart dev (./scripts/dev.sh ...) and confirm the warning is gone"
