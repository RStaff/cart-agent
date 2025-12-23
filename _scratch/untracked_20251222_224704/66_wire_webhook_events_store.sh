#!/usr/bin/env bash
set -euo pipefail

LIB="web/src/lib/webhook_events.js"
RESCUE="web/src/routes/rescue.js"
INDEX="web/src/index.js"

test -f "$INDEX" || { echo "❌ Missing $INDEX"; exit 1; }
test -f "$RESCUE" || { echo "❌ Missing $RESCUE"; exit 1; }

cp "$INDEX"  "$INDEX.bak_$(date +%Y%m%d_%H%M%S)"
cp "$RESCUE" "$RESCUE.bak_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$(dirname "$LIB")"

# 1) Overwrite the event store with a known-good global in-memory store (dev-safe)
cat <<'JS' > "$LIB"
/**
 * In-memory webhook event store (DEV / local)
 * NOTE: For prod you'll persist to DB.
 */
function _store() {
  globalThis.__abandoWebhookEvents ??= [];
  return globalThis.__abandoWebhookEvents;
}

export function recordWebhookEvent(evt) {
  const e = {
    ts: Date.now(),
    shop: evt?.shop || null,
    topic: evt?.topic || null,
    bytes: Number(evt?.bytes || 0),
  };
  _store().push(e);
  // keep last 200
  if (_store().length > 200) _store().splice(0, _store().length - 200);
  return e;
}

export function hasWebhookEventsForShop(shop) {
  return _store().some(e => e.shop === shop);
}

export function lastWebhookEventForShop(shop) {
  const list = _store().filter(e => e.shop === shop);
  return list.length ? list[list.length - 1] : null;
}
JS

# 2) Ensure index.js imports recordWebhookEvent (ESM)
node <<'NODE'
import fs from "fs";

const file = "web/src/index.js";
let s = fs.readFileSync(file, "utf8");

if (!s.includes('from "./lib/webhook_events.js"')) {
  // insert after express import if possible, else near top
  if (s.includes('import express')) {
    s = s.replace(
      /import\s+express[^;]*;\n/,
      (m) => m + 'import { recordWebhookEvent } from "./lib/webhook_events.js";\n'
    );
  } else {
    s = 'import { recordWebhookEvent } from "./lib/webhook_events.js";\n' + s;
  }
}

fs.writeFileSync(file, s);
console.log("✅ Ensured recordWebhookEvent import in", file);
NODE

# 3) Patch rescue.js gating to use hasWebhookEventsForShop()
node <<'NODE'
import fs from "fs";

const file = "web/src/routes/rescue.js";
let s = fs.readFileSync(file, "utf8");

// Ensure import
if (!s.includes('from "../lib/webhook_events.js"')) {
  // try to insert after other imports
  if (s.match(/^import .*;\s*$/m)) {
    s = s.replace(
      /(^import .*;\s*$)/m,
      '$1\nimport { hasWebhookEventsForShop, lastWebhookEventForShop } from "../lib/webhook_events.js";'
    );
  } else {
    s = 'import { hasWebhookEventsForShop, lastWebhookEventForShop } from "../lib/webhook_events.js";\n' + s;
  }
}

// Replace the "hasEvents" computation if present, else just inject a hasEvents var near handler
// We target the exact reason string you grepped: "No webhook events yet"
if (s.includes('"No webhook events yet"') || s.includes("'No webhook events yet'")) {
  // crude but effective: ensure hasEvents is computed from our store
  s = s.replace(
    /const\s+hasEvents\s*=\s*[^;]*;/,
    'const hasEvents = hasWebhookEventsForShop(shop);'
  );

  // also try to add lastEvent if useful
  if (!s.includes("lastWebhookEventForShop(")) {
    s = s.replace(
      /const\s+hasEvents\s*=\s*hasWebhookEventsForShop\(shop\);\n/,
      'const hasEvents = hasWebhookEventsForShop(shop);\n  const lastEvent = lastWebhookEventForShop(shop);\n'
    );
  }
}

fs.writeFileSync(file, s);
console.log("✅ Patched rescue gating to read webhook events store:", file);
NODE

echo "Sanity:"
node --check web/src/index.js
node --check web/src/lib/webhook_events.js
node --check web/src/routes/rescue.js
echo "✅ ESM syntax OK"
