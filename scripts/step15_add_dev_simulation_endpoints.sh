#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

FILE="web/src/index.js"
cp "$FILE" "$FILE.bak_$(date +%s)" || true

node - <<'NODE'
const fs = require("fs");

const file = "web/src/index.js";
let s = fs.readFileSync(file, "utf8");

if (!s.includes("globalThis.__abandoDevStore")) {
  s = s.replace(
    /const app = express\(\);\n/,
`const app = express();
globalThis.__abandoDevStore = globalThis.__abandoDevStore || {
  byShop: new Map(),
};
`
  );
}

const block = `
// ------------------------------
// DEV SIMULATION ENDPOINTS
// ------------------------------
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

app.post("/api/dev/simulate/abandoned", express.json(), (req, res) => {
  const shop = String(req.query.shop || req.body?.shop || "unknown").trim() || "unknown";
  const store = getShopStore(shop);
  store.lastAbandonedAt = new Date().toISOString();
  store.events.push({ type: "abandoned", at: store.lastAbandonedAt });
  return res.json({ ok: true, shop, lastAbandonedAt: store.lastAbandonedAt });
});

app.post("/api/dev/simulate/rescue", express.json(), (req, res) => {
  const shop = String(req.query.shop || req.body?.shop || "unknown").trim() || "unknown";
  const store = getShopStore(shop);
  store.lastRescueAt = new Date().toISOString();
  const amount = Number(req.body?.recoveredUsd ?? 28.5);
  store.recoveredUsd = (store.recoveredUsd || 0) + (Number.isFinite(amount) ? amount : 0);
  store.events.push({ type: "rescue_sent", at: store.lastRescueAt, recoveredUsd: amount });
  return res.json({ ok: true, shop, lastRescueAt: store.lastRescueAt, recoveredUsdTotal: store.recoveredUsd });
});
`;

if (!s.includes('app.post("/api/dev/simulate/abandoned"')) {
  // Insert after /api/rescue/real if present, else append
  if (s.includes('app.get("/api/rescue/real"')) {
    s = s.replace(/(app\.get\(\"\/api\/rescue\/real\"[\s\S]*?\n\}\);\n)/, `$1\n${block}\n`);
  } else {
    s = s + "\n" + block + "\n";
  }
}

// Patch /api/rescue/real to use the dev store readiness if present
if (s.includes('app.get("/api/rescue/real"') && !s.includes("globalThis.__abandoDevStore")) {
  // already added above; nothing
}

s = s.replace(
  /app\.get\(\"\/api\/rescue\/real\"[\s\S]*?return res\.json\([\s\S]*?\);\n\}\);\n/m,
`app.get("/api/rescue/real", async (req, res) => {
  const shop = String(req.query.shop || "").trim() || "unknown";
  const store = (globalThis.__abandoDevStore?.byShop?.get(shop)) || null;

  const hasEvents = !!(store && store.events && store.events.length);
  const recoveredUsd = store?.recoveredUsd || 0;

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
`
);

fs.writeFileSync(file, s);
console.log("✅ Added dev simulation endpoints + upgraded /api/rescue/real");
NODE

echo "NEXT:"
echo "  restart: lsof -ti tcp:3000 | xargs -r kill -9; lsof -ti tcp:3001 | xargs -r kill -9"
echo "  then:    ./scripts/dev.sh example.myshopify.com"
