#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

FILE="web/src/routes/billing_create.js"
cp "$FILE" "$FILE.bak_$(date +%s)"

node - <<'NODE'
const fs = require("fs");

const file = "web/src/routes/billing_create.js";
let s = fs.readFileSync(file, "utf8");

// 1) Fix stub confirmationUrl to include shop+plan and be relative (same-origin)
s = s.replace(
  /const confirmationUrl\s*=\s*\n\s*`https:\/\/abando\.dev\/billing\/confirm-stub\?plan=\$\{encodeURIComponent$begin:math:text$effectiveKey$end:math:text$\}`;/m,
  [
    `const shop = String(req.query.shop || req.body?.shop || "").trim().toLowerCase();`,
    `  if (!shop || !shop.endsWith(".myshopify.com")) {`,
    `    return res.status(400).json({`,
    `      ok: false,`,
    `      mode: "stub",`,
    `      error: "Missing or invalid ?shop=your-store.myshopify.com",`,
    `    });`,
    `  }`,
    ``,
    `  const confirmationUrl =`,
    `    \`/billing/confirm-stub?shop=\${encodeURIComponent(shop)}&plan=\${encodeURIComponent(effectiveKey)}\`;`
  ].join("\n")
);

// 2) Ensure confirm-stub route exists exactly once and is BEFORE export default
// Remove any existing confirm-stub block (we'll re-insert cleanly)
s = s.replace(
  /\/\*\*[\s\S]*?Stub billing confirmation:[\s\S]*?router\.get\("\/confirm-stub"[\s\S]*?\n\}\);\s*/m,
  ""
);

// Find export default router; and insert confirm route right before it
const exportLine = "export default router;";
if (!s.includes(exportLine)) {
  console.error("❌ Could not find 'export default router;' in billing_create.js");
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

`;

s = s.replace(exportLine, confirmBlock + exportLine);

// Write back
fs.writeFileSync(file, s);

// Assertions
const fixed = fs.readFileSync(file, "utf8");
if (!fixed.includes('router.get("/confirm-stub"')) {
  console.error("❌ confirm-stub route not found after patch");
  process.exit(1);
}
const idxConfirm = fixed.indexOf('router.get("/confirm-stub"');
const idxExport  = fixed.indexOf("export default router;");
if (!(idxConfirm >= 0 && idxExport >= 0 && idxConfirm < idxExport)) {
  console.error("❌ confirm-stub route is not before export default router;");
  process.exit(1);
}
if (!fixed.includes("/billing/confirm-stub?shop=")) {
  console.error("❌ stub confirmationUrl was not patched to include shop");
  process.exit(1);
}
console.log("✅ Patched billing_create.js: stub confirmationUrl + confirm-stub route placement");
NODE

echo "✅ Done. Now restart your dev server and re-run smoke."
