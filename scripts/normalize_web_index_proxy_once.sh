#!/usr/bin/env bash
set -euo pipefail

node <<'NODE'
const fs = require("fs");

const file = "web/src/index.js";
let code = fs.readFileSync(file, "utf8");

// Remove ANY proxy blocks/markers we previously injected (all variants)
code = code
  // remove the "=== ABANDO_UI_PROXY_START ===" style blocks
  .replace(/^\s*\/\/\s*===\s*ABANDO_UI_PROXY_START\s*===\s*$[\s\S]*?^\s*\/\/\s*===\s*ABANDO_UI_PROXY_END\s*===\s*$/gm, "")
  // remove the "✅ ABANDO_UI_PROXY_START" style blocks
  .replace(/^\s*\/\/\s*✅\s*ABANDO_UI_PROXY_START\s*$[\s\S]*?^\s*\/\/\s*✅\s*ABANDO_UI_PROXY_END\s*$/gm, "")
  // remove any stray single marker lines
  .replace(/^\s*\/\/\s*✅\s*ABANDO_UI_PROXY.*$/gm, "")
  // remove any import lines for ui-proxy we injected
  .replace(/^\s*import\s+\{?\s*attachUiProxy\s*\}?\s+from\s+["']\.\/ui-proxy\.mjs["'];\s*$/gm, "")
  // remove any dynamic import+call lines we injected
  .replace(/^\s*const\s+\{\s*attachUiProxy\s*\}\s*=\s*await\s+import\(\s*["']\.\/ui-proxy\.mjs["']\s*\);\s*$/gm, "")
  .replace(/^\s*attachUiProxy\s*\(\s*app\s*\)\s*;\s*$/gm, "");

// Re-inject ONE canonical block right after app creation
const marker = /(const\s+app\s*=\s*express\(\)\s*;)/;
if (!marker.test(code)) {
  console.error("❌ Could not find `const app = express();` in web/src/index.js");
  process.exit(1);
}

const block = `$1

// === ABANDO_UI_PROXY_START ===
// Proxy Next UI (3001) through Express (3000) for /demo/* and /embedded*
const { attachUiProxy } = await import("./ui-proxy.mjs");
attachUiProxy(app);
// === ABANDO_UI_PROXY_END ===
`;

code = code.replace(marker, block);

fs.writeFileSync(file, code, "utf8");
console.log("✅ normalize_web_index_proxy_once: normalized", file);
NODE
