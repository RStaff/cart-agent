#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

DB_HELPER="web/src/db/billingState.js"
mkdir -p "$(dirname "$DB_HELPER")"

# Create DB helper (source of truth)
cat > "$DB_HELPER" <<'JS'
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function getBillingState(shopDomain) {
  const shop = String(shopDomain || "").trim().toLowerCase();
  if (!shop) return { plan: "free", active: false, source: "stub" };

  const row = await prisma.billingState.findUnique({
    where: { shopDomain: shop },
  });

  if (!row) return { plan: "free", active: false, source: "stub" };

  return { plan: row.planKey, active: row.active, source: row.source };
}

export function entitlementsForPlan(planKey, active) {
  const plan = String(planKey || "free").toLowerCase();
  const isActive = !!active;

  // If not active, treat as free no matter what.
  if (!isActive) {
    return {
      plan: "free",
      active: false,
      can_auto_rescue: false,
      can_send_messages: false,
      needs_subscription: true,
    };
  }

  // Active plans
  if (plan === "starter") {
    return {
      plan,
      active: true,
      can_auto_rescue: false,
      can_send_messages: true,
      needs_subscription: false,
    };
  }
  if (plan === "growth") {
    return {
      plan,
      active: true,
      can_auto_rescue: true,
      can_send_messages: true,
      needs_subscription: false,
    };
  }
  if (plan === "pro") {
    return {
      plan,
      active: true,
      can_auto_rescue: true,
      can_send_messages: true,
      needs_subscription: false,
    };
  }

  // default
  return {
    plan: "free",
    active: true,
    can_auto_rescue: false,
    can_send_messages: false,
    needs_subscription: false,
  };
}

export async function activateBilling(shopDomain, planKey, source = "stub") {
  const shop = String(shopDomain || "").trim().toLowerCase();
  const plan = String(planKey || "starter").trim().toLowerCase();
  if (!shop) throw new Error("Missing shopDomain");

  await prisma.billingState.upsert({
    where: { shopDomain: shop },
    create: { shopDomain: shop, planKey: plan, active: true, source },
    update: { planKey: plan, active: true, source },
  });

  return { shop, plan, active: true, source };
}
JS

echo "✅ Wrote $DB_HELPER"

# Patch billing.js to use DB helper
BILLING_ROUTE="web/src/routes/billing.js"
if [ ! -f "$BILLING_ROUTE" ]; then
  echo "❌ Missing $BILLING_ROUTE"
  exit 1
fi
cp "$BILLING_ROUTE" "$BILLING_ROUTE.bak_$(date +%s)"

node - <<'NODE'
import fs from "fs";
const file = "web/src/routes/billing.js";
let s = fs.readFileSync(file,"utf8");

if (!s.includes('from "../db/billingState.js"')) {
  s = s.replace(
    /import\s+express\s+from\s+"express";\s*\n/,
    m => m + `import { getBillingState, entitlementsForPlan } from "../db/billingState.js";\n`
  );
}

// Replace local getBillingState() function if present (best effort)
s = s.replace(/function\s+getBillingState\s*\([^)]*\)\s*\{[\s\S]*?\n\}/m, "");

// Ensure status route returns DB-backed state.
// We look for router.get("/status" ... and replace the body.
s = s.replace(/router\.get\(["']\/status["'][\s\S]*?\n\}\);\s*/m, match => {
  return `router.get("/status", async (req, res) => {
  const shop = String(req.query.shop || "").trim().toLowerCase();
  if (!shop) return res.status(400).json({ error: "Missing shop" });

  const b = await getBillingState(shop);
  const ent = entitlementsForPlan(b.plan, b.active);

  return res.json({
    shop,
    plan: ent.plan,
    active: ent.active,
    trial: false,
    can_auto_rescue: ent.can_auto_rescue,
    can_send_messages: ent.can_send_messages,
    needs_subscription: ent.needs_subscription,
    source: b.source,
  });
});\n`;
});

fs.writeFileSync(file,s);
console.log("✅ Patched", file);
NODE

# Patch rescue.js to use DB helper
RESCUE_ROUTE="web/src/routes/rescue.js"
cp "$RESCUE_ROUTE" "$RESCUE_ROUTE.bak_$(date +%s)"

node - <<'NODE'
import fs from "fs";
const file = "web/src/routes/rescue.js";
let s = fs.readFileSync(file,"utf8");

if (!s.includes('from "../db/billingState.js"') && !s.includes('from "./../db/billingState.js"')) {
  s = s.replace(
    /import\s+express\s+from\s+"express";\s*\n/,
    m => m + `import { getBillingState, entitlementsForPlan } from "../db/billingState.js";\n`
  );
}

// Remove placeholder getBillingState() if present
s = s.replace(/function\s+getBillingState\s*\([^)]*\)\s*\{[\s\S]*?\n\}\s*/m, "");

// In preview route, replace billing usage:
// const billing = getBillingState(shop);
s = s.replace(/const\s+billing\s*=\s*getBillingState\(\s*shop\s*\);\s*/g,
  `const b = await getBillingState(shop);\n  const billing = entitlementsForPlan(b.plan, b.active);\n`
);

// In real route similarly:
s = s.replace(/const\s+billing\s*=\s*getBillingState\(\s*shop\s*\);\s*/g,
  `const b = await getBillingState(shop);\n  const billing = entitlementsForPlan(b.plan, b.active);\n`
);

// Ensure handlers are async because we await billing
s = s.replace(/router\.get\("\/preview",\s*\(req,\s*res\)\s*=>\s*\{/,
              'router.get("/preview", async (req, res) => {');
s = s.replace(/router\.get\("\/real",\s*\(req,\s*res\)\s*=>\s*\{/,
              'router.get("/real", async (req, res) => {');

fs.writeFileSync(file,s);
console.log("✅ Patched", file);
NODE

# Add stub confirm endpoint into billing_create.js (since /billing is already mounted)
BILL_CREATE="web/src/routes/billing_create.js"
if [ -f "$BILL_CREATE" ]; then
  cp "$BILL_CREATE" "$BILL_CREATE.bak_$(date +%s)"
  node - <<'NODE'
import fs from "fs";
const file = "web/src/routes/billing_create.js";
let s = fs.readFileSync(file,"utf8");

if (!s.includes('activateBilling')) {
  // Insert import near top (best effort)
  s = s.replace(
    /(import\s+[^;]+;\s*\n)+/m,
    m => m + `import { activateBilling } from "../db/billingState.js";\n`
  );
}

if (!s.includes('"/confirm-stub"')) {
  // Mount a GET /billing/confirm-stub endpoint in whatever router/app this file exports.
  // We assume it exports an Express router as default (common in this repo).
  s += `

/**
 * Stub billing confirmation:
 *  /billing/confirm-stub?shop=example.myshopify.com&plan=starter
 */
router.get("/confirm-stub", async (req, res) => {
  try {
    const shop = String(req.query.shop || "").trim().toLowerCase();
    const plan = String(req.query.plan || "starter").trim().toLowerCase();
    if (!shop) return res.status(400).send("Missing shop");

    await activateBilling(shop, plan, "stub");
    return res.redirect(302, "/embedded");
  } catch (e) {
    return res.status(500).send("Stub confirm failed");
  }
});
`;
}

fs.writeFileSync(file,s);
console.log("✅ Patched", file);
NODE
else
  echo "⚠️ $BILL_CREATE not found; skipping stub confirm injection."
fi

echo ""
echo "✅ Wiring complete."
echo "NEXT: run smoke:"
echo "  ./scripts/smoke_paid_loop.sh example.myshopify.com"
echo "  curl -s 'http://localhost:3000/billing/confirm-stub?shop=example.myshopify.com&plan=starter' -I | head"
echo "  curl -s 'http://localhost:3000/api/billing/status?shop=example.myshopify.com' | jq ."
