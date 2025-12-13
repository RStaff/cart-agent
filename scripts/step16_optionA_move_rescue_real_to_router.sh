#!/usr/bin/env bash
set -euo pipefail

RESCUE="web/src/routes/rescue.js"
INDEX="web/src/index.js"

[ -f "$RESCUE" ] || { echo "❌ Missing $RESCUE"; exit 1; }
[ -f "$INDEX" ]  || { echo "❌ Missing $INDEX"; exit 1; }

ts="$(date +%s)"
cp "$RESCUE" "$RESCUE.bak_${ts}"
cp "$INDEX"  "$INDEX.bak_${ts}"

node <<'NODE'
const fs = require("fs");

const RESCUE = "web/src/routes/rescue.js";
const INDEX  = "web/src/index.js";

function die(msg){ console.error("❌ " + msg); process.exit(1); }

// --- 1) Patch rescue router /real ---
let r = fs.readFileSync(RESCUE, "utf8");

const newRoute = `
router.get("/real", async (req, res) => {
  const shop = String(req.query.shop || "").trim() || "unknown";

  // Shared dev-store lives on globalThis so both index.js simulators and the router can see it.
  const g = globalThis;
  if (!g.__abandoDevStore) g.__abandoDevStore = { byShop: new Map() };
  if (!g.__abandoDevStore.byShop) g.__abandoDevStore.byShop = new Map();

  const byShop = g.__abandoDevStore.byShop;

  const getShopStore = (s) => {
    if (!byShop.has(s)) {
      byShop.set(s, { events: [], recoveredUsd: 0, lastAbandonedAt: null, lastRescueAt: null });
    }
    return byShop.get(s);
  };

  const store = byShop.get(shop) || getShopStore(shop);

  const hasEvents = !!(store?.events?.length);
  const recoveredUsd = Number(store?.recoveredUsd || 0);

  return res.json({
    kind: "real",
    shop,
    ready: hasEvents,
    reason: hasEvents ? "Simulated events present" : "No webhook events yet",
    recovered_usd_total: recoveredUsd,
    last_abandoned_at: store?.lastAbandonedAt || null,
    last_rescue_at: store?.lastRescueAt || null,
    next_step: hasEvents ? "Wire real webhooks + DB next" : "Trigger a test abandoned cart, then a rescue",
    gating: {
      plan: "starter",
      can_auto_rescue: false,
      can_send_messages: true,
      needs_subscription: false,
    },
  });
});
`.trim();

// Replace existing router.get("/real"... ) if present, else insert before export default
const hasReal = /router\.get\(\s*["']\/real["']/.test(r);

if (hasReal) {
  // Replace the entire existing /real handler block (best-effort, non-greedy)
  r = r.replace(
    /router\.get\(\s*["']\/real["'][\s\S]*?\n\}\);\s*\n/g,
    newRoute + "\n\n"
  );
} else {
  // Insert before export default router;
  const exportRe = /export\s+default\s+router\s*;\s*$/m;
  if (!exportRe.test(r)) die("Could not find `export default router;` in rescue.js");
  r = r.replace(exportRe, newRoute + "\n\nexport default router;\n");
}

fs.writeFileSync(RESCUE, r);
console.log("✅ Canonical /api/rescue/real now lives in", RESCUE);

// --- 2) Remove shadowed app.get("/api/rescue/real" ...) from index.js ---
let s = fs.readFileSync(INDEX, "utf8");

const before = s;

// Remove any direct app.get("/api/rescue/real"... ) block (best-effort)
s = s.replace(
  /app\.get\(\s*["']\/api\/rescue\/real["'][\s\S]*?\n\}\);\s*\n/g,
  ""
);

if (s === before) {
  console.log("⚠️ No app.get('/api/rescue/real') block found in index.js (maybe already removed).");
} else {
  fs.writeFileSync(INDEX, s);
  console.log("✅ Removed shadowed /api/rescue/real from", INDEX);
}

NODE

echo "NEXT:"
echo "  restart: lsof -ti tcp:3000 | xargs -r kill -9; lsof -ti tcp:3001 | xargs -r kill -9"
echo "  run:     ./scripts/dev.sh example.myshopify.com"
echo "  test:    curl -s -X POST 'http://localhost:3001/api/dev/simulate/abandoned?shop=example.myshopify.com' | jq ."
echo "           curl -s -X POST 'http://localhost:3001/api/dev/simulate/rescue?shop=example.myshopify.com' -H 'content-type: application/json' -d '{\"recoveredUsd\":28.5}' | jq ."
echo "           curl -s 'http://localhost:3001/api/rescue/real?shop=example.myshopify.com' | jq ."
