#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
WEB_INDEX="web/src/index.js"
ROUTES_DIR="web/src/routes"

if [ ! -f "$WEB_INDEX" ]; then
  echo "❌ Expected $WEB_INDEX not found."
  echo "   Run: ls -la web/src | head"
  exit 1
fi

mkdir -p "$ROUTES_DIR"

cat > "$ROUTES_DIR/_shop_context.js" <<'JS'
/**
 * Minimal shop context extraction for gating + metrics.
 * Upgrade later to enforce signed Shopify sessions.
 */
export function getShopFromReq(req) {
  // Preferred: explicit header from your proxy or auth middleware
  const h = req.get("x-shopify-shop-domain") || req.get("x-shop-domain");
  if (h) return String(h).trim();

  // Fallback: query param
  const q = req.query && (req.query.shop || req.query.shopDomain);
  if (q) return String(q).trim();

  // Fallback: referer parsing (last resort)
  const ref = req.get("referer") || "";
  const m = ref.match(/[?&]shop=([^&]+)/);
  if (m) return decodeURIComponent(m[1]);

  return null;
}
JS

cat > "$ROUTES_DIR/billing.js" <<'JS'
import express from "express";
import { getShopFromReq } from "./_shop_context.js";

const router = express.Router();

/**
 * Source-of-truth billing state.
 * Replace this with DB lookup (Shop table) when ready.
 */
function getBillingState(shop) {
  // TODO: load from DB
  return {
    plan: "free",              // free|starter|growth|pro
    active: false,             // subscription active
    trial: false,              // optional
    can_auto_rescue: false,
    can_send_messages: false,
  };
}

router.get("/status", (req, res) => {
  const shop = getShopFromReq(req);
  if (!shop) return res.status(400).json({ error: "Missing shop context" });

  const b = getBillingState(shop);
  return res.json({
    shop,
    plan: b.plan,
    active: b.active,
    trial: b.trial,
    can_auto_rescue: b.can_auto_rescue,
    can_send_messages: b.can_send_messages,
    needs_subscription: !b.active,
  });
});

export default router;
JS

cat > "$ROUTES_DIR/rescue.js" <<'JS'
import express from "express";
import { getShopFromReq } from "./_shop_context.js";

const router = express.Router();

// --- Replace these with DB-backed implementations ---
function getCurrencyForShop(shop) {
  return "USD";
}

function computeTypicalOrderSize(shop) {
  // TODO: compute from recent orders (Shopify Admin API) or DB snapshots.
  // Deterministic fallback so preview is stable (not random).
  return 72.50;
}

function computeEstimatedRecoverableToday(shop, typicalOrderSize) {
  // TODO: base on cart volumes once webhooks are wired.
  // For now: stable preview estimate (never presented as "real").
  return Math.round((typicalOrderSize * 0.53) * 100) / 100; // 53% of AOV, stable
}

function getBillingState(shop) {
  // TODO: load from DB
  return {
    plan: "free",
    active: false,
    can_auto_rescue: false,
    can_send_messages: false,
  };
}

function getRealRescueMetrics(shop) {
  // TODO: pull from Abando events table (abandoned, rescued, revenue)
  // Return null until the pipeline is live.
  return null;
}
// ---------------------------------------------------

router.get("/preview", (req, res) => {
  const shop = getShopFromReq(req);
  if (!shop) return res.status(400).json({ error: "Missing shop context" });

  const currency = getCurrencyForShop(shop);
  const typical = computeTypicalOrderSize(shop);
  const est = computeEstimatedRecoverableToday(shop, typical);
  const billing = getBillingState(shop);

  return res.json({
    kind: "preview",
    shop,
    currency,
    typical_order_size: typical,
    estimated_recoverable_today: est,
    confidence: "low",
    disclosure: "Preview estimate. Real recovery begins after setup + first rescue.",
    gating: {
      plan: billing.plan,
      can_auto_rescue: billing.can_auto_rescue,
      can_send_messages: billing.can_send_messages,
      needs_subscription: !billing.active,
    },
  });
});

router.get("/real", (req, res) => {
  const shop = getShopFromReq(req);
  if (!shop) return res.status(400).json({ error: "Missing shop context" });

  const billing = getBillingState(shop);
  const metrics = getRealRescueMetrics(shop);

  if (!metrics) {
    return res.json({
      kind: "real",
      shop,
      ready: false,
      reason: "No webhook events yet",
      next_step: "Trigger a test abandoned cart, then a rescue",
      gating: {
        plan: billing.plan,
        can_auto_rescue: billing.can_auto_rescue,
        can_send_messages: billing.can_send_messages,
        needs_subscription: !billing.active,
      },
    });
  }

  return res.json({
    kind: "real",
    shop,
    ready: true,
    window_days: metrics.window_days,
    currency: metrics.currency,
    abandoned_carts: metrics.abandoned_carts,
    rescues: metrics.rescues,
    recovered_revenue: metrics.recovered_revenue,
    gating: {
      plan: billing.plan,
      can_auto_rescue: billing.can_auto_rescue,
      can_send_messages: billing.can_send_messages,
      needs_subscription: !billing.active,
    },
  });
});

export default router;
JS

# Patch web/src/index.js to mount these routers (idempotent)
node <<'NODE'
import fs from "fs";

const file = "web/src/index.js";
let s = fs.readFileSync(file, "utf8");

function ensureImport(name, path) {
  if (!s.includes(`from "${path}"`) && !s.includes(`from '${path}'`)) {
    s = s.replace(
      /(const\s+app\s*=\s*express\(\)\s*;|const\s+app\s*=\s*express\(\)\s*)/m,
      `import ${name} from "${path}";\n$1`
    );
  }
}

ensureImport("billingRouter", "./routes/billing.js");
ensureImport("rescueRouter", "./routes/rescue.js");

if (!s.includes(`app.use("/api/billing"`)) {
  s = s.replace(/(app\.use\([^\n]*\);\s*)/m, `$1\napp.use("/api/billing", billingRouter);\n`);
}
if (!s.includes(`app.use("/api/rescue"`)) {
  s = s.replace(/(app\.use\([^\n]*\);\s*)/m, `$1\napp.use("/api/rescue", rescueRouter);\n`);
}

fs.writeFileSync(file, s);
console.log("✅ Patched", file);
NODE

echo "✅ Routes created:"
echo " - $ROUTES_DIR/billing.js"
echo " - $ROUTES_DIR/rescue.js"
echo " - $ROUTES_DIR/_shop_context.js"

echo ""
echo "Next: run a smoke test:"
echo "  node -v"
echo "  npm -v"
echo "  (start your web server) then:"
echo '  curl -s "http://localhost:3000/api/billing/status?shop=example.myshopify.com" | jq .'
echo '  curl -s "http://localhost:3000/api/rescue/preview?shop=example.myshopify.com" | jq .'
echo '  curl -s "http://localhost:3000/api/rescue/real?shop=example.myshopify.com" | jq .'
