#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

STAMP="$(date +%Y%m%d_%H%M%S)"
cp "$FILE" "$FILE.bak_${STAMP}"
echo "✅ Backup: $FILE.bak_${STAMP}"

node <<'NODE'
const fs = require("fs");

const file = "web/src/index.js";
let s = fs.readFileSync(file, "utf8");

// 1) Remove any existing inline webhook route block to avoid duplicates.
//    We delete: app.post("/api/webhooks", ... );  (greedy-safe across newlines)
s = s.replace(
  /\n?app\.post\(\s*["']\/api\/webhooks["'][\s\S]*?\n\}\);\s*\n?/m,
  "\n"
);

// 2) Ensure ESM imports exist (idempotent)
function ensureImport(code, importLine) {
  if (code.includes(importLine)) return code;
  // Insert after last import line, or at top
  const importMatches = [...code.matchAll(/^\s*import .*?;\s*$/gm)];
  if (importMatches.length) {
    const last = importMatches[importMatches.length - 1];
    const idx = last.index + last[0].length;
    return code.slice(0, idx) + "\n" + importLine + code.slice(idx);
  }
  return importLine + "\n" + code;
}

s = ensureImport(s, 'import { registerWebhooksRoute } from "./routes/webhooks.js";');
s = ensureImport(s, 'import { recordWebhookEvent } from "./lib/webhook_events.js";');

// 3) Add the registration call right after `const app = express();`
if (!s.includes("registerWebhooksRoute(app")) {
  const re = /(const\s+app\s*=\s*express\(\)\s*;\s*)/;
  if (!re.test(s)) {
    console.error("❌ Could not find `const app = express();` in web/src/index.js");
    process.exit(2);
  }
  s = s.replace(re, `$1\n\n// [ABANDO] Webhooks route (real verification lives in routes/webhooks.js)\nregisterWebhooksRoute(app, { recordWebhookEvent });\n`);
}

// 4) Write back
fs.writeFileSync(file, s, "utf8");
console.log("✅ Patched:", file);
NODE

echo
echo "🔍 Sanity (imports + register call):"
grep -nE 'registerWebhooksRoute\\(|routes/webhooks\\.js|lib/webhook_events\\.js|/api/webhooks' "$FILE" || true

echo
echo "🧪 ESM syntax check:"
node --check "$FILE"
echo "✅ node --check OK"

echo
echo "NEXT:"
echo "  1) lsof -ti tcp:3000 | xargs -r kill -9; lsof -ti tcp:3001 | xargs -r kill -9"
echo "  2) ./scripts/dev.sh cart-agent-dev.myshopify.com"
echo "  3) curl -i -X POST 'http://localhost:3000/api/webhooks?shop=cart-agent-dev.myshopify.com&topic=checkouts/update' -H 'Content-Type: application/json' -d '{\"ping\":true}'"
echo "  4) tail -n 120 .dev_express.log"
