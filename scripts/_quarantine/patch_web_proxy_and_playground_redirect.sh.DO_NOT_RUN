#!/usr/bin/env bash
set -euo pipefail

node <<'NODE'
const fs = require("fs");

const file = "web/src/index.js";
let code = fs.readFileSync(file, "utf8");

// 1) Remove any old proxy imports/calls/blocks (defensive)
code = code
  .replace(/^\s*import\s+\{?\s*attachUiProxy\s*\}?\s+from\s+["']\.\/ui-proxy\.mjs["'];\s*$/gm, "")
  .replace(/^\s*const\s+\{\s*attachUiProxy\s*\}\s*=\s*await\s+import\(\s*["']\.\/ui-proxy\.mjs["']\s*\);\s*$/gm, "")
  .replace(/^\s*attachUiProxy\s*\(\s*app\s*\)\s*;\s*$/gm, "")
  .replace(/^\s*\/\/\s*===\s*ABANDO_UI_PROXY_START\s*===.*?^\s*\/\/\s*===\s*ABANDO_UI_PROXY_END\s*===\s*$/gms, "");

// 2) Insert a single clean proxy block right after app creation
const marker = /(const\s+app\s*=\s*express\(\)\s*;)/;
if (!marker.test(code)) {
  console.error("❌ Could not find `const app = express();` in web/src/index.js");
  process.exit(1);
}

code = code.replace(marker, `$1

// === ABANDO_UI_PROXY_START ===
// Proxy Next UI (3001) through Express (3000) for /demo/* and /embedded*
const { attachUiProxy } = await import("./ui-proxy.mjs");
attachUiProxy(app);
// === ABANDO_UI_PROXY_END ===
`);

// 3) Ensure /playground redirects to /demo/playground (fixes your screenshot)
if (!code.includes('app.get("/playground"')) {
  code = code.replace(
    /\/\/\s*===\s*ABANDO_UI_PROXY_END\s*===\s*\n/,
    match => match + `\n// Convenience route (people will type /playground)\napp.get("/playground", (_req, res) => res.redirect(307, "/demo/playground"));\n\n`
  );
}

fs.writeFileSync(file, code, "utf8");
console.log("✅ patch_web_proxy_and_playground_redirect: applied to", file);
NODE
