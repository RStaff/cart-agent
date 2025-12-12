#!/usr/bin/env bash
set -euo pipefail

TARGET="web/src/index.js"

node <<'NODE'
const fs = require("fs");

let code = fs.readFileSync("web/src/index.js", "utf8");

// Remove ALL previous attachUiProxy calls
code = code.replace(/attachUiProxy\\(app\\);\\n?/g, "");

// Ensure import exists
if (!code.includes('attachUiProxy')) {
  code = code.replace(
    /import express.*?;\\n/,
    match => match + 'import { attachUiProxy } from "./ui-proxy.mjs";\n'
  );
}

// Inject IMMEDIATELY after app creation
code = code.replace(
  /(const\\s+app\\s*=\\s*express\\(\\)\\s*;)/,
  `$1\n\n// 🔒 UI PROXY MUST BE FIRST\nattachUiProxy(app);\n`
);

fs.writeFileSync("web/src/index.js", code, "utf8");
console.log("✅ UI proxy forced to FIRST middleware");
NODE
