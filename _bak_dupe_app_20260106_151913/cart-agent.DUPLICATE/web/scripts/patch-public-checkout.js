const fs = require('fs');
const path = require('path');

// Detect entry
let entry = fs.existsSync('src/index.ts') ? 'src/index.ts'
          : fs.existsSync('src/index.js') ? 'src/index.js'
          : null;
if (!entry) { console.error('✗ Could not find src/index.ts or src/index.js'); process.exit(1); }

// Detect module system
let isESM = false;
try {
  const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
  isESM = pkg.type === 'module';
} catch {}
if (!isESM) {
  // heuristic: file uses import
  const s = fs.readFileSync(entry,'utf8');
  if (/^\s*import\s/m.test(s)) isESM = true;
}

// Write router in correct module format
if (isESM) {
  const rPath = 'src/dev/checkoutPublic.esm.js';
  fs.writeFileSync(rPath, `import express from "express";
import Stripe from "stripe";
const router = express.Router();
router.post("/", async (req, res) => {
  try {
    const allow = String(process.env.ALLOW_PUBLIC_CHECKOUT || "").toLowerCase() === "true";
    if (!allow) return res.status(403).json({ error: "public_checkout_disabled" });
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return res.status(500).json({ error: "stripe_key_missing" });
    const stripe = new Stripe(key);
    let email = req?.body?.email || req?.query?.email;
    if (!email) {
      try { let raw=""; await new Promise(r=>{req.on("data",c=>raw+=c); req.on("end",r);});
            if(raw) email = JSON.parse(raw).email; } catch {}
    }
    email = email || "customer@example.com";
    const bodyPrice = req?.body?.priceId;
    const priceId = (typeof bodyPrice === "string" && bodyPrice.startsWith("price_")) ? bodyPrice : process.env.STRIPE_PRICE_ID;
    if (!priceId) return res.status(400).json({ error: "price_id_missing" });
    const appUrl = process.env.APP_URL || "https://abando.ai";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      success_url: \`\${appUrl}/success?session_id={CHECKOUT_SESSION_ID}\`,
      cancel_url: \`\${appUrl}/billing/cancel\`,
    });
    return res.json({ url: session.url, priceId });
  } catch (err) {
    console.error("[public checkout]", err);
    return res.status(500).json({ error: "checkout_failed" });
  }
});
export default router;
`);
} else {
  const rPath = 'src/dev/checkoutPublic.cjs';
  fs.writeFileSync(rPath, `const express = require("express");
const Stripe = require("stripe");
const router = express.Router();
router.post("/", async (req, res) => {
  try {
    const allow = String(process.env.ALLOW_PUBLIC_CHECKOUT || "").toLowerCase() === "true";
    if (!allow) return res.status(403).json({ error: "public_checkout_disabled" });
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return res.status(500).json({ error: "stripe_key_missing" });
    const stripe = new Stripe(key);
    let email = req?.body?.email || req?.query?.email;
    if (!email) {
      try { let raw=""; await new Promise(r=>{req.on("data",c=>raw+=c); req.on("end",r);});
            if(raw) email = JSON.parse(raw).email; } catch {}
    }
    email = email || "customer@example.com";
    const bodyPrice = req?.body?.priceId;
    const priceId = (typeof bodyPrice === "string" && bodyPrice.startsWith("price_")) ? bodyPrice : process.env.STRIPE_PRICE_ID;
    if (!priceId) return res.status(400).json({ error: "price_id_missing" });
    const appUrl = process.env.APP_URL || "https://abando.ai";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      success_url: \`\${appUrl}/success?session_id={CHECKOUT_SESSION_ID}\`,
      cancel_url: \`\${appUrl}/billing/cancel\`,
    });
    return res.json({ url: session.url, priceId });
  } catch (err) {
    console.error("[public checkout]", err);
    return res.status(500).json({ error: "checkout_failed" });
  }
});
module.exports = router;
`);
}

// Patch entry
let code = fs.readFileSync(entry,'utf8');
const hadJson = /app\.use\(\s*express\.json\(\s*\)\s*\)/.test(code);
const hasLegacy = /app\.(?:post|get)\(\s*["']\/api\/billing\/checkout["']/.test(code);
const hasOurMount = /app\.use\(\s*["']\/api\/billing\/checkout["']\s*,\s*checkoutPublic\s*\)/.test(code);

if (isESM) {
  if (!/from\s+["']\.\/dev\/checkoutPublic\.esm\.js["']/.test(code)) {
    code = `import checkoutPublic from "./dev/checkoutPublic.esm.js";\n` + code;
  }
} else {
  if (!/checkoutPublic\.cjs/.test(code)) {
    code = `const checkoutPublic = require("./dev/checkoutPublic.cjs");\n` + code;
  }
}

if (!hadJson) {
  code = code.replace(
    /(const\s+app\s*=\s*express\s*\(\s*\)\s*;?)/,
    `$1\napp.use(express.json());`
  );
}

if (!hasOurMount) {
  if (hasLegacy) {
    // put ours BEFORE the first legacy handler so we win
    code = code.replace(
      /(app\.(?:post|get)\(\s*["']\/api\/billing\/checkout["'][\s\S]*?;)/,
      `app.use("/api/billing/checkout", checkoutPublic);\n$1`
    );
  } else {
    code = code.replace(
      /(const\s+app\s*=\s*express\s*\(\s*\)\s*;?.*\n)/,
      `$1app.use("/api/billing/checkout", checkoutPublic);\n`
    );
  }
}

fs.writeFileSync(entry, code);
console.log(`✓ patched ${entry}`);
