#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

FILE="web/src/index.js"
cp "$FILE" "$FILE.bak_$(date +%s)" || true

node - <<'NODE'
const fs = require("fs");

const file = "web/src/index.js";
let s = fs.readFileSync(file, "utf8");

// Ensure dev store exists (in case it didn't inject cleanly)
if (!s.includes("globalThis.__abandoDevStore")) {
  s = s.replace(
    /const app = express\(\);\n/,
`const app = express();
globalThis.__abandoDevStore = globalThis.__abandoDevStore || { byShop: new Map() };
`
  );
}

// Ensure helper exists (or add it once)
if (!s.includes("function getShopStore(")) {
  s += `

function getShopStore(shop) {
  const key = String(shop || "unknown").trim() || "unknown";
  const m = globalThis.__abandoDevStore.byShop;
  if (!m.has(key)) {
    m.set(key, {
      lastAbandonedAt: null,
      lastRescueAt: null,
      recoveredUsd: 0,
      events: [],
    });
  }
  return m.get(key);
}
`;
}

// New /api/rescue/real handler (dev-store aware)
const newRoute = `
app.get("/api/rescue/real", async (req, res) => {
  const shop = String(req.query.shop || "").trim() || "unknown";
  const store =
    (globalThis.__abandoDevStore?.byShop?.get(shop)) || getShopStore(shop);

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
`;

// Remove any existing /api/rescue/real route block (best-effort, safe)
const before = s;
s = s.replace(
  /app\.get\(\s*["']\/api\/rescue\/real["'][\s\S]*?\n\}\);\s*\n/g,
  ""
);

// Append our canonical route near the end (after other routes)
s += "\n" + newRoute + "\n";

// If nothing changed, still write (idempotent) but log
fs.writeFileSync(file, s);
console.log("✅ Forced /api/rescue/real to dev-store aware handler in", file);
NODE

echo "NEXT:"
echo "  restart: lsof -ti tcp:3000 | xargs -r kill -9; lsof -ti tcp:3001 | xargs -r kill -9"
echo "  then:    ./scripts/dev.sh example.myshopify.com"
echo "  verify:  curl -s 'http://localhost:3001/api/rescue/real?shop=example.myshopify.com' | jq ."
