#!/usr/bin/env bash
set -euo pipefail

APP="abando-frontend"
test -d "$APP" || { echo "❌ $APP not found"; exit 1; }

cd "$APP"
ts="$(date +%s)"

# Pick config file preference:
# 1) next.config.js
# 2) next.config.mjs
# 3) create next.config.js
CFG=""
if [ -f "next.config.js" ]; then
  CFG="next.config.js"
elif [ -f "next.config.mjs" ]; then
  CFG="next.config.mjs"
else
  CFG="next.config.js"
  cat > "$CFG" <<'JS'
/** @type {import('next').NextConfig} */
const nextConfig = {};
module.exports = nextConfig;
JS
fi

cp "$CFG" "$CFG.bak_${ts}"

CFG_PATH="$CFG" node -e '
const fs = require("fs");

const cfgPath = process.env.CFG_PATH;
if (!cfgPath) throw new Error("CFG_PATH missing");

let s = fs.readFileSync(cfgPath, "utf8");
const isMjs = cfgPath.endsWith(".mjs");

function ensureTurbopackRootJS(input) {
  // If nextConfig object exists, inject turbopack there.
  if (input.includes("const nextConfig")) {
    if (!input.includes("turbopack")) {
      input = input.replace(
        /const nextConfig\s*=\s*\{([\s\S]*?)\};/,
        (m, inner) => `const nextConfig = {\n${inner}\n  turbopack: { root: __dirname },\n};`
      );
    } else if (!input.includes("root:")) {
      input = input.replace(/turbopack:\s*\{/, "turbopack: { root: __dirname,");
    }
    return input;
  }

  // Fallback: common minimal patterns
  if (input.includes("module.exports")) {
    // If module.exports is an object literal, try to inject turbopack
    if (input.match(/module\.exports\s*=\s*\{[\s\S]*\};/)) {
      if (!input.includes("turbopack")) {
        input = input.replace(
          /module\.exports\s*=\s*\{([\s\S]*?)\};/,
          (m, inner) => `module.exports = {\n${inner}\n  turbopack: { root: __dirname },\n};`
        );
      } else if (!input.includes("root:")) {
        input = input.replace(/turbopack:\s*\{/, "turbopack: { root: __dirname,");
      }
      return input;
    }
  }

  // Last resort: append a safe exported config
  if (!input.includes("turbopack")) {
    input += `\n\n// Added by scripts/142l2_set_turbopack_root.sh\nconst __abando_turbopack_root = __dirname;\n`;
  }
  return input;
}

function ensureTurbopackRootMJS(input) {
  // Ensure we have a __dirname polyfill
  if (!input.includes("fileURLToPath(import.meta.url)")) {
    input =
`import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

` + input;
  }

  // Ensure nextConfig exists
  if (!input.includes("const nextConfig")) {
    input =
`/** @type {import("next").NextConfig} */
const nextConfig = {};

` + input;
  }

  // Inject turbopack.root
  if (!input.includes("turbopack")) {
    input = input.replace(
      /const nextConfig\s*=\s*\{([\s\S]*?)\};/,
      (m, inner) => `const nextConfig = {\n${inner}\n  turbopack: { root: __dirname },\n};`
    );
  } else if (!input.includes("root:")) {
    input = input.replace(/turbopack:\s*\{/, "turbopack: { root: __dirname,");
  }

  // Ensure it is exported
  if (!input.includes("export default nextConfig")) {
    input += `\n\nexport default nextConfig;\n`;
  }

  return input;
}

const out = isMjs ? ensureTurbopackRootMJS(s) : ensureTurbopackRootJS(s);
fs.writeFileSync(cfgPath, out);
console.log("✅ Set turbopack.root in", cfgPath);
'

echo "✅ Patched: $APP/$CFG"
echo "✅ Backup:  $APP/$CFG.bak_${ts}"
echo "DONE ✅"
