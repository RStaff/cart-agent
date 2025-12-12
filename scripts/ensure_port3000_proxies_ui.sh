#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="$ROOT/web/src/index.js"

echo "🔧 Ensuring http-proxy-middleware is installed in web/ ..."
pushd "$ROOT/web" >/dev/null
npm i http-proxy-middleware --save >/dev/null
popd >/dev/null

echo "🧩 Patching: $TARGET"
node <<'NODE' "$TARGET"
const fs = require("fs");

const target = process.argv[1];
let code = fs.readFileSync(target, "utf8");

// 1) Remove any prior Abando proxy blocks (so script is re-runnable)
code = code.replace(/\n\/\/ ✅ ABANDO_UI_PROXY[\s\S]*?\n(?=\n)/g, "");

// 2) Ensure import exists
if (!code.includes('from "http-proxy-middleware"')) {
  // Insert after the last import line
  const importRe = /^import .*?;\s*$/gm;
  let lastMatch;
  while (true) {
    const m = importRe.exec(code);
    if (!m) break;
    lastMatch = { index: m.index, len: m[0].length };
  }
  if (!lastMatch) throw new Error("Could not find any ES module imports to attach proxy import to.");

  const insertAt = lastMatch.index + lastMatch.len;
  code = code.slice(0, insertAt) +
    `\nimport { createProxyMiddleware } from "http-proxy-middleware";` +
    code.slice(insertAt);
}

// 3) Insert proxy block immediately after app initialization
const appInitRe = /(const\s+app\s*=\s*express\(\)\s*;?)/;
const m = code.match(appInitRe);
if (!m) throw new Error("Could not find `const app = express()` in index.js to insert routes after.");

const insertBlock =
`\n\n// ✅ ABANDO_UI_PROXY
// Serve the Next.js UI (running on :3001) THROUGH the Shopify backend origin (:3000)
// so embedded iframes + auth stay same-origin in dev.
app.get("/", (_req, res) => res.redirect(307, "/demo/playground"));

// Proxy UI routes
app.use("/demo", createProxyMiddleware({
  target: "http://localhost:3001",
  changeOrigin: true,
  ws: true,
  logLevel: "warn",
}));

app.use("/embedded", createProxyMiddleware({
  target: "http://localhost:3001",
  changeOrigin: true,
  ws: true,
  logLevel: "warn",
}));
`;

code = code.replace(appInitRe, `$1${insertBlock}`);

fs.writeFileSync(target, code, "utf8");
console.log("✅ Patch applied successfully.");
NODE

echo "✅ Done."
echo "Next: start the stack with the updated dev runner."
