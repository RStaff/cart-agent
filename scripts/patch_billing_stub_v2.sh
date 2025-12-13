#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

FILE="web/src/routes/billing_create.js"
cp "$FILE" "$FILE.bak_stubv2_$(date +%s)"

node - <<'NODE'
const fs = require("fs");
const file = "web/src/routes/billing_create.js";
let s = fs.readFileSync(file, "utf8");

// Remove any existing confirm-stub block (we will re-add cleanly)
s = s.replace(
  /\/\*\*[\s\S]*?Stub billing confirmation:[\s\S]*?router\.get\("\/confirm-stub"[\s\S]*?\n\}\);\s*/gm,
  ""
);

// Patch handleStubBilling() by replacing the whole function body reliably
// Find "async function handleStubBilling" and replace until the closing "}" of that function.
const start = s.indexOf("async function handleStubBilling");
if (start < 0) {
  console.error("❌ Could not find handleStubBilling()");
  process.exit(1);
}

const braceOpen = s.indexOf("{", start);
if (braceOpen < 0) process.exit(1);

// naive brace matching for the function block
let i = braceOpen, depth = 0;
for (; i < s.length; i++) {
  if (s[i] === "{") depth++;
  if (s[i] === "}") depth--;
  if (depth === 0) break;
}
if (depth !== 0) {
  console.error("❌ Could not parse handleStubBilling() braces");
  process.exit(1);
}
const end = i + 1;

const newStubFn = `
async function handleStubBilling(req, res) {
  const shop = String(req.query.shop || req.body?.shop || "").trim().toLowerCase();
  if (!shop || !shop.endsWith(".myshopify.com")) {
    return res.status(400).json({
      ok: false,
      mode: "stub",
      error: "Missing or invalid ?shop=your-store.myshopify.com",
    });
  }

  const { planKey } = req.body || {};
  const { key: effectiveKey } = resolvePlan(planKey);

  // same-origin, includes shop + plan
  const confirmationUrl =
    \`/billing/confirm-stub?shop=\${encodeURIComponent(shop)}&plan=\${encodeURIComponent(effectiveKey)}\`;

  return res.json({
    ok: true,
    mode: "stub",
    stub: true,
    planKey: effectiveKey,
    confirmationUrl,
    debug: {
      received: planKey ?? null,
      shop,
    },
  });
}
`.trim();

s = s.slice(0, start) + newStubFn + s.slice(end);

// Insert confirm-stub route before export default
const exportLine = "export default router;";
const exportIdx = s.indexOf(exportLine);
if (exportIdx < 0) {
  console.error("❌ Could not find 'export default router;'");
  process.exit(1);
}

const confirmBlock = `
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
    return res.redirect(302, \`/embedded?shop=\${encodeURIComponent(shop)}\`);
  } catch (e) {
    return res.status(500).send("Stub confirm failed");
  }
});

`.trim() + "\n\n";

s = s.slice(0, exportIdx) + confirmBlock + s.slice(exportIdx);

fs.writeFileSync(file, s);

// Assertions
const fixed = fs.readFileSync(file, "utf8");
if ((fixed.match(/router\.get\("\/confirm-stub"/g) || []).length !== 1) {
  console.error("❌ confirm-stub route count is not 1");
  process.exit(1);
}
if (!fixed.includes("/billing/confirm-stub?shop=")) {
  console.error("❌ confirmationUrl is not shop-aware");
  process.exit(1);
}
const idxConfirm = fixed.indexOf('router.get("/confirm-stub"');
const idxExport  = fixed.indexOf("export default router;");
if (!(idxConfirm >= 0 && idxConfirm < idxExport)) {
  console.error("❌ confirm-stub is not before export default");
  process.exit(1);
}
console.log("✅ Patched billing_create.js (stub shop-aware + confirm route before export)");
NODE
