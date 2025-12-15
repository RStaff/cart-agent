#!/usr/bin/env bash
set -euo pipefail

ENTRY_FILE="$(cat .backup/abando_backend/ENTRYPOINT_PATH 2>/dev/null || true)"
if [ -z "${ENTRY_FILE}" ] || [ ! -f "${ENTRY_FILE}" ]; then
  echo "❌ Entry file not found. Run scripts/10_abando_backend_snapshot_and_detect.sh first."
  exit 1
fi

STAMP="$(date +%s)"
mkdir -p .backup/abando_backend
cp -p "${ENTRY_FILE}" ".backup/abando_backend/$(echo "$ENTRY_FILE" | tr '/' '__').bak_${STAMP}"
echo "🗂️ Backup: .backup/abando_backend/$(echo "$ENTRY_FILE" | tr '/' '__').bak_${STAMP}"

# Ensure module directory exists
mkdir -p web/src/abando

# 1) entitlement module
cat << 'EOR' > web/src/abando/entitlement.js
/**
 * Abando Entitlement (billing gate)
 * BILLING_MODE:
 *   - "stub": always entitled (for dev / review)
 *   - "shopify": TODO: verify active subscription via Shopify billing
 *
 * This is the hook point for "real software" gating.
 */

function getBillingMode() {
  return (process.env.BILLING_MODE || process.env.NEXT_PUBLIC_BILLING_MODE || "stub").toLowerCase();
}

function computeEntitlement(req) {
  const mode = getBillingMode();

  // Hard override (emergency)
  if (process.env.ABANDO_FORCE_ENTITLED === "1") {
    return { entitled: true, mode, reason: "ABANDO_FORCE_ENTITLED=1" };
  }

  // STUB mode: always entitled
  if (mode === "stub") {
    return { entitled: true, mode, reason: "BILLING_MODE=stub" };
  }

  // SHOPIFY mode: placeholder hook
  // You will replace this with: check shop session -> billing subscription -> entitled
  // For now: default false unless explicitly signaled (dev only)
  const header = (req.headers["x-abando-entitled"] || "").toString();
  const entitled = header === "1";

  return {
    entitled,
    mode,
    reason: entitled ? "x-abando-entitled=1 (temporary dev hook)" : "Not entitled (shopify mode placeholder)",
  };
}

function entitlementRoutes(app) {
  app.get("/api/abando/entitlement", (req, res) => {
    const e = computeEntitlement(req);
    res.json({ ok: true, ...e });
  });
}

module.exports = {
  getBillingMode,
  computeEntitlement,
  entitlementRoutes,
};
EOR

# 2) metrics module
cat << 'EOR' > web/src/abando/metrics.js
/**
 * Abando Metrics
 * This is the value-signal endpoint your frontend /status page will consume.
 * For now it returns env-based placeholders + entitlement info.
 * Later: wire to DB (Prisma models) and real recovered revenue.
 */

const { computeEntitlement, getBillingMode } = require("./entitlement");

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str(v, fallback = "") {
  const s = (v ?? "").toString().trim();
  return s.length ? s : fallback;
}

function metricsRoutes(app) {
  app.get("/api/abando/metrics", (req, res) => {
    const e = computeEntitlement(req);

    // Placeholder values (wire to real data next)
    const recoveredRevenue = str(process.env.ABANDO_DEMO_RECOVERED_REVENUE, "0");
    const recoveredOrders  = num(process.env.ABANDO_DEMO_RECOVERED_ORDERS, 0);
    const cartsDetected    = num(process.env.ABANDO_DEMO_CARTS_DETECTED, 0);

    res.json({
      ok: true,
      ts: new Date().toISOString(),
      billingMode: getBillingMode(),
      entitled: e.entitled,
      entitlementReason: e.reason,

      // Value signals (placeholder)
      recoveredRevenue,
      recoveredOrders,
      cartsDetected,

      // Helpful env hints
      app: "cart-agent",
      shop: str(process.env.SHOPIFY_SHOP, "UNKNOWN"),
    });
  });
}

module.exports = { metricsRoutes };
EOR

echo "✅ Wrote web/src/abando/entitlement.js"
echo "✅ Wrote web/src/abando/metrics.js"

# 3) Patch entrypoint to mount routes
node <<'EON'
const fs = require("fs");

const entryPath = fs.readFileSync(".backup/abando_backend/ENTRYPOINT_PATH","utf8").trim();
let src = fs.readFileSync(entryPath, "utf8");

const MARKER = "ABANDO_METRICS_AND_ENTITLEMENT_MOUNTED";
if (src.includes(MARKER)) {
  console.log("✅ Entry already patched (marker found). No changes.");
  process.exit(0);
}

// We need to mount routes after app is created.
// Best-effort heuristics:
// - Find "const app = express()" or "let app = express()"
// - Insert require + mount right after that line
const lines = src.split("\n");
let idxApp = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("express()") && lines[i].includes("app")) { idxApp = i; break; }
}
if (idxApp === -1) {
  console.error("❌ Could not find an 'app = express()' line to patch safely in " + entryPath);
  process.exit(1);
}

const inject = [
  "",
  `// ${MARKER}`,
  `const { entitlementRoutes } = require("./abando/entitlement");`,
  `const { metricsRoutes } = require("./abando/metrics");`,
  `entitlementRoutes(app);`,
  `metricsRoutes(app);`,
].join("\n");

// Determine relative import base:
// If entrypoint is web/src/index.js, then "./abando/..." is correct.
// If entrypoint is server.js at repo root, then we need "web/src/abando/..."
if (!entryPath.startsWith("web/src/")) {
  // rewrite requires to point to web/src
  const inject2 = inject
    .replace('./abando/entitlement', './web/src/abando/entitlement')
    .replace('./abando/metrics', './web/src/abando/metrics');
  lines.splice(idxApp + 1, 0, inject2);
} else {
  lines.splice(idxApp + 1, 0, inject);
}

fs.writeFileSync(entryPath, lines.join("\n"), "utf8");
console.log("✅ Patched entrypoint:", entryPath);
EON

echo "✅ Backend now serves /api/abando/metrics and /api/abando/entitlement"
