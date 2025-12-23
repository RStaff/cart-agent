#!/usr/bin/env bash
set -euo pipefail

FILE="web/src/index.js"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }

cp "$FILE" "$FILE.bak_$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup created"

node <<'NODE'
import fs from "fs";

const file = "web/src/index.js";
let s = fs.readFileSync(file, "utf8");

// 1) Remove the old named import (and any variants)
s = s.replace(/^\s*import\s*\{\s*registerWebhooksRoute\s*\}\s*from\s*["']\.\/routes\/webhooks\.js["'];\s*\n/gm, "");
s = s.replace(/^\s*import\s*\{\s*registerWebhooksRoute\s*\}\s*from\s*["']\.\/routes\/webhooks["'];\s*\n/gm, "");

// 2) Remove any call site of registerWebhooksRoute(app) or similar
s = s.replace(/^\s*registerWebhooksRoute\s*\(\s*app\s*\)\s*;?\s*\n/gm, "");

// 3) Ensure default import exists
if (!s.includes('import webhooksRouter from "./routes/webhooks.js";')) {
  // Insert after the first import block (best-effort)
  const m = s.match(/^(import[^\n]*\n)+/m);
  if (m) {
    s = s.replace(m[0], m[0] + 'import webhooksRouter from "./routes/webhooks.js";\n');
  } else {
    s = 'import webhooksRouter from "./routes/webhooks.js";\n' + s;
  }
}

// 4) Ensure mount exists once
if (!s.includes('app.use("/api/webhooks", webhooksRouter)')) {
  const re = /(const\s+app\s*=\s*express\(\)\s*;\s*\n)/;
  if (!re.test(s)) {
    console.error("❌ Could not find: const app = express();");
    process.exit(2);
  }
  s = s.replace(re, `$1\n// [ABANDO] Webhooks router (clean mount)\napp.use("/api/webhooks", webhooksRouter);\n\n`);
}

// 5) De-dup accidental multiple mounts
const lines = s.split("\n");
let seen = 0;
const out = [];
for (const line of lines) {
  if (line.includes('app.use("/api/webhooks", webhooksRouter)')) {
    seen += 1;
    if (seen > 1) continue;
  }
  out.push(line);
}
s = out.join("\n");

fs.writeFileSync(file, s);
console.log("✅ Fixed index.js webhooks wiring");
NODE

echo "🔍 Sanity:"
node --check web/src/index.js
echo "✅ index.js parses"

echo "🔍 Confirm no registerWebhooksRoute left:"
grep -n "registerWebhooksRoute" web/src/index.js || true

echo "🔍 Confirm mount line:"
grep -n 'app.use("/api/webhooks", webhooksRouter)' web/src/index.js || true
