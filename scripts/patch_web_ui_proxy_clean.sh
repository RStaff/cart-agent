#!/usr/bin/env bash
set -euo pipefail

node <<'NODE'
const fs = require("fs");

const file = "web/src/index.js";
let code = fs.readFileSync(file, "utf8");

// Remove previous proxy blocks/imports/calls (defensive)
code = code
  .replace(/^\s*import\s+\{?\s*attachUiProxy\s*\}?\s+from\s+["']\.\/ui-proxy\.mjs["'];\s*$/gm, "")
  .replace(/^\s*const\s+\{\s*attachUiProxy\s*\}\s*=\s*await\s+import\(\s*["']\.\/ui-proxy\.mjs["']\s*\);\s*$/gm, "")
  .replace(/^\s*attachUiProxy\s*\(\s*app\s*\)\s*;\s*$/gm, "")
  .replace(/^\s*\/\/\s*===\s*ABANDO_UI_PROXY_START\s*===.*?^\s*\/\/\s*===\s*ABANDO_UI_PROXY_END\s*===\s*$/gms, "");

// Insert clean block right after app creation
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

fs.writeFileSync(file, code, "utf8");
console.log("✅ patch_web_ui_proxy_clean: applied to", file);
NODE
