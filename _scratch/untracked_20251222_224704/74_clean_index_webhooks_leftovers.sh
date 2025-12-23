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

// 1) Remove any leftover registerWebhooksRoute import lines (if any)
s = s.replace(/^\s*import\s*\{\s*registerWebhooksRoute\s*\}\s*from\s*["']\.\/routes\/webhooks\.js["'];\s*\n/gm, "");
s = s.replace(/^\s*import\s*\{\s*registerWebhooksRoute\s*\}\s*from\s*["']\.\/routes\/webhooks["'];\s*\n/gm, "");

// 2) Remove any call site registerWebhooksRoute(...)
s = s.replace(/^\s*registerWebhooksRoute\s*\(.*\)\s*;?\s*\n/gm, "");

// 3) Remove the now-dead comment block that immediately surrounded it (safe/targeted)
s = s.replace(/^\s*\/\/\s*\[ABANDO\]\s*Webhooks route.*\n/gm, "");
s = s.replace(/^\s*\/\/\s*\[ABANDO\]\s*Shopify webhooks endpoint.*\n/gm, "");
s = s.replace(/^\s*\/\/\s*IMPORTANT: use raw body.*\n/gm, "");

// 4) Ensure recordWebhookEvent import exists ONCE and is placed with other imports
// Remove any existing occurrence anywhere:
s = s.replace(/^\s*import\s*\{\s*recordWebhookEvent\s*\}\s*from\s*["']\.\/lib\/webhook_events\.js["'];\s*\n/gm, "");

// Insert it right after the webhooksRouter import if present, else after first import line
if (s.includes('import webhooksRouter from "./routes/webhooks.js";')) {
  s = s.replace(
    /import webhooksRouter from "\.\/routes\/webhooks\.js";\s*\n/,
    'import webhooksRouter from "./routes/webhooks.js";\nimport { recordWebhookEvent } from "./lib/webhook_events.js";\n'
  );
} else {
  // insert after first import statement
  const firstImport = s.match(/^\s*import[^\n]*\n/m);
  if (firstImport) {
    s = s.replace(firstImport[0], firstImport[0] + 'import { recordWebhookEvent } from "./lib/webhook_events.js";\n');
  } else {
    s = 'import { recordWebhookEvent } from "./lib/webhook_events.js";\n' + s;
  }
}

// 5) Ensure router mount exists once (and only once)
if (!s.includes('app.use("/api/webhooks", webhooksRouter);')) {
  const re = /(const\s+app\s*=\s*express\(\)\s*;\s*\n)/;
  if (!re.test(s)) {
    console.error("❌ Could not find: const app = express();");
    process.exit(2);
  }
  s = s.replace(re, `$1\n// [ABANDO] Webhooks router (clean mount)\napp.use("/api/webhooks", webhooksRouter);\n\n`);
}

// de-dup accidental multiple mounts
const lines = s.split("\n");
let seenMount = 0;
const out = [];
for (const line of lines) {
  if (line.includes('app.use("/api/webhooks", webhooksRouter)')) {
    seenMount += 1;
    if (seenMount > 1) continue;
  }
  out.push(line);
}
s = out.join("\n");

// 6) Light cleanup of huge blank runs
s = s.replace(/\n{6,}/g, "\n\n\n");

fs.writeFileSync(file, s);
console.log("✅ Cleaned webhooks leftovers + fixed import order:", file);
NODE

echo "🔍 Sanity:"
node --check web/src/index.js
echo "✅ index.js parses"

echo "🔍 Confirm registerWebhooksRoute is gone:"
grep -n "registerWebhooksRoute" web/src/index.js || true

echo "🔍 Confirm recordWebhookEvent import is near the top:"
grep -n 'import { recordWebhookEvent } from "./lib/webhook_events.js";' web/src/index.js || true

echo "🔍 Confirm mount exists:"
grep -n 'app.use("/api/webhooks", webhooksRouter);' web/src/index.js || true
