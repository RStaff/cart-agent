#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
IDX="web/src/index.js"
LIB="web/src/lib/webhook_events.js"

test -f "$IDX" || { echo "❌ Missing $IDX"; exit 1; }

TS="$(date +%Y%m%d_%H%M%S)"
cp "$IDX" "$IDX.bak_$TS"
[ -f "$LIB" ] && cp "$LIB" "$LIB.bak_$TS" || true

# 1) Write webhook_events.js as ESM (no require/module.exports)
mkdir -p "$(dirname "$LIB")"
cat > "$LIB" <<'EOF'
/**
 * ESM webhook event recorder (in-memory)
 * Used only for dev gating (unblocks /api/rescue/real once we see any webhook hit)
 */
const MAX = 50;

if (!globalThis.__ABANDO_WEBHOOK_EVENTS__) {
  globalThis.__ABANDO_WEBHOOK_EVENTS__ = [];
}

export function recordWebhookEvent(evt) {
  const arr = globalThis.__ABANDO_WEBHOOK_EVENTS__;
  arr.push({ ...evt, at: Date.now() });
  while (arr.length > MAX) arr.shift();
}

export function hasWebhookEvents() {
  return (globalThis.__ABANDO_WEBHOOK_EVENTS__ || []).length > 0;
}

export function listWebhookEvents() {
  return globalThis.__ABANDO_WEBHOOK_EVENTS__ || [];
}
EOF

# 2) Patch index.js: remove the injected require(...) and replace with ESM import
node - <<'NODE'
const fs = require("fs");

const file = "web/src/index.js";
let s = fs.readFileSync(file, "utf8");

// Remove the bad line if present:
s = s.replace(/^.*recordWebhookEvent.*require\("\.\/lib\/webhook_events"\).*?\n/m, "");

// Ensure we import recordWebhookEvent in ESM form near the top.
// We'll insert it after the last existing import line, or at start if none.
const importLine = `import { recordWebhookEvent } from "./lib/webhook_events.js";\n`;
if (!s.includes(importLine.trim())) {
  const lines = s.split("\n");
  let lastImport = -1;
  for (let i = 0; i < Math.min(lines.length, 60); i++) {
    if (/^\s*import\s+/.test(lines[i])) lastImport = i;
  }
  if (lastImport >= 0) {
    lines.splice(lastImport + 1, 0, importLine.trimEnd());
  } else {
    lines.unshift(importLine.trimEnd());
  }
  s = lines.join("\n");
}

// Ensure webhook handler calls recordWebhookEvent(...) (noop if you already do)
if (!s.includes("recordWebhookEvent(") && s.includes('app.post("/api/webhooks"')) {
  s = s.replace(
    /console\.log\(\s*"\[webhooks\]\s*received".*?\);\s*\n/s,
    'console.log("[webhooks] received", { bytes: req.body?.length || 0, topic, shop, has_hmac: Boolean(hmac), headerKeys });\n    recordWebhookEvent({ topic: topic || req.query?.topic, shop: shop || req.query?.shop, bytes: req.body?.length || 0 });\n'
  );
}

fs.writeFileSync(file, s);
console.log("✅ Patched ESM import in", file);
NODE

echo "✅ Wrote ESM lib: $LIB"
echo
echo "Sanity checks:"
node --check web/src/index.js
node --check web/src/lib/webhook_events.js
echo "✅ ESM syntax OK"
