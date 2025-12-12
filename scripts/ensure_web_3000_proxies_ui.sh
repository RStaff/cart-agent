#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="$ROOT/web/src/index.js"

node <<'NODE'
const fs = require("fs");

const target = "web/src/index.js";
let code = fs.readFileSync(target, "utf8");

// 1) Ensure import exists
if (!code.includes('attachUiProxy')) {
  // Insert after first import line block (safe-ish)
  code = code.replace(
    /(\nimport .*?\n)/,
    `$1import { attachUiProxy } from "./ui-proxy.mjs";\n`
  );
}

// 2) Ensure attach is AFTER app init
if (!code.includes("attachUiProxy(app)")) {
  code = code.replace(
    /(const\s+app\s*=\s*express\(\)\s*;)/,
    `$1\n\n// ✅ ABANDO_UI_PROXY\nattachUiProxy(app);\n`
  );
}

fs.writeFileSync(target, code, "utf8");
console.log("✅ ensure_web_3000_proxies_ui: applied");
NODE
