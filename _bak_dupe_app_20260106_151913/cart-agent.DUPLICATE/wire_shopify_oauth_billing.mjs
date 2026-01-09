import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';

const ROOT = process.cwd();
const SRC  = path.join(ROOT,'web','src');
const PUB  = path.join(SRC,'public');
const INDEX= path.join(SRC,'index.js');
const DATA_DIR = path.join(SRC,'data');
const SHOPS_FP = path.join(DATA_DIR,'shops.json');
const DASH     = path.join(PUB,'dashboard','index.html');

const R = p => fs.existsSync(p) ? fs.readFileSync(p,'utf8') : '';
const W = (p,s)=>{ fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p,s); console.log('✏️  wrote', p.replace(ROOT+'/','')); };

function ensureShopsFile(){
  if (!fs.existsSync(SHOPS_FP)) {
    W(SHOPS_FP, JSON.stringify({ shops:{} }, null, 2));
  }
}

function patchIndex(){
  let s = R(INDEX);
  if (!s) throw new Error('web/src/index.js not found');

  if (!/\/shopify\/install/.test(s)) {
    const add = `

// === Shopify OAuth + Billing (dev scaffold) ==========================
import express from "express";
import fetch from "node-fetch";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const APP_URL = process.env.APP_URL || "https://abando.ai"; // set in Render
const SHOPIFY_API_KEY    = process.env.SHOPIFY_API_KEY    || "";
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || "";
const SHOPIFY_SCOPES     = process.env.SHOPIFY_SCOPES     || "read_checkouts,read_orders,write_checkouts,read_script_tags,write_script_tags";
const API_VERSION = process.env.SHOPIFY_API_VERSION || "2024-07"; // adjust as needed

const SHOPS_FILE = path.join(__dirname, "data", "shops.json");
function loadShops(){ try{ return JSON.parse(fs.readFileSync(SHOPS_FILE,"utf8")); } catch { return {shops:{}}; } }
function saveShops(obj){ fs.mkdirSync(path.dirname(SHOPS_FILE), {recursive:true}); fs.writeFileSync(SHOPS_FILE, JSON.stringify(obj,null,2)); }
function setShopToken(shop, token){
  const db = loadShops(); db.shops[shop] = db.shops[shop] || {};
  db.shops[shop].access_token = token; db.shops[shop].updated_at = Date.now(); saveShops(db);
}
function getShopToken(shop){
  const db = loadShops(); return db.shops?.[shop]?.access_token || null;
}

function signParams(params){
  const message = Object.keys(params).sort().map(k => \`\${k}=\${params[k]}\`).join("&");
  return crypto.createHmac("sha256", SHOPIFY_API_SECRET).update(message).digest("hex");
}

// Kick off OAuth
app.get("/shopify/install", (req,res)=>{
  const shop = String(req.query.shop||"").toLowerCase();
  if (!shop.endsWith(".myshopify.com")) return res.status(400).send("Missing/invalid ?shop");
  const state = crypto.randomBytes(16).toString("hex");
  res.cookie("shopify_state", state, {httpOnly:true, sameSite:"lax", secure:true});
  const redirect_uri = encodeURIComponent(\`\${APP_URL}/shopify/callback\`);
  const url = \`https://\${shop}/admin/oauth/authorize?client_id=\${SHOPIFY_API_KEY}&scope=\${encodeURIComponent(SHOPIFY_SCOPES)}&redirect_uri=\${redirect_uri}&state=\${state}&grant_options[]=per-user\`;
  console.log("[shopify] install →", url);
  res.redirect(url);
});

// OAuth callback
app.get("/shopify/callback", async (req,res)=>{
  try{
    const { shop, code, state, timestamp, hmac } = req.query || {};
    if (!shop || !code || !hmac) return res.status(400).send("Bad params");
    if (String(req.cookies?.shopify_state) !== String(state)) return res.status(400).send("State mismatch");

    // Verify HMAC
    const params = {...req.query}; delete params["hmac"];
    const computed = signParams(params);
    if (computed !== hmac) return res.status(400).send("HMAC check failed");

    // Exchange code for token
    const r = await fetch(\`https://\${shop}/admin/oauth/access_token\`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ client_id: SHOPIFY_API_KEY, client_secret: SHOPIFY_API_SECRET, code })
    });
    const j = await r.json();
    const token = j?.access_token;
    if (!token) return res.status(400).send("No access token");

    setShopToken(String(shop), String(token));
    console.log("[shopify] token stored for", shop);

    // Optional: jump to billing
    return res.redirect(\`/shopify/billing/start?shop=\${encodeURIComponent(String(shop))}\`);
  }catch(e){
    console.error("[shopify] callback error", e);
    res.status(500).send("OAuth error");
  }
});

// Start Billing (test subscription)
app.get("/shopify/billing/start", async (req,res)=>{
  try{
    const shop = String(req.query.shop||"");
    const token = getShopToken(shop);
    if (!token) return res.redirect(\`/shopify/install?shop=\${encodeURIComponent(shop)}\`);

    const mutation = \`
      mutation appSubscriptionCreate($name: String!, $returnUrl: URL!, $test: Boolean!, $lineItems: [AppSubscriptionLineItemInput!]!) {
        appSubscriptionCreate(name: $name, returnUrl: $returnUrl, test: $test, lineItems: $lineItems) {
          userErrors { field message }
          confirmationUrl
          appSubscription { id }
        }
      }
    \`;
    const body = {
      query: mutation,
      variables: {
        name: "Abando Basic",
        returnUrl: \`\${APP_URL}/shopify/billing/return?shop=\${shop}\`,
        test: true, // set false for production
        lineItems: [{
          plan: { appRecurringPricingDetails: { price: { amount: 19.00, currencyCode: "USD" } } }
        }]
      }
    };
    const r = await fetch(\`https://\${shop}/admin/api/\${API_VERSION}/graphql.json\`, {
      method:"POST",
      headers:{
        "X-Shopify-Access-Token": token,
        "Content-Type":"application/json"
      },
      body: JSON.stringify(body)
    });
    const j = await r.json();
    const url = j?.data?.appSubscriptionCreate?.confirmationUrl;
    if (!url) {
      console.error("[shopify] billing errors", JSON.stringify(j));
      return res.status(400).send("Billing setup failed");
    }
    res.redirect(url);
  }catch(e){
    console.error("[shopify] billing start error", e);
    res.status(500).send("Billing start error");
  }
});

// Return URL after merchant approves billing
app.get("/shopify/billing/return", (req,res)=>{
  const shop = String(req.query.shop||"");
  res.send(\`<html><body style="font-family:system-ui;background:#0b142a;color:#e5e7eb;padding:24px">
  <h2>Billing active</h2>
  <p>Thanks! Your subscription for <b>\${shop}</b> is active. You can close this tab.</p>
  <p><a href="/dashboard" style="color:#93c5fd">Back to dashboard</a></p>
  </body></html>\`);
});

// Helper: simple install link (for testing)
app.get("/shopify/dev-install", (req,res)=>{
  res.send(\`<html><body style="font-family:system-ui">
  <form action="/shopify/install" method="get">
    <input name="shop" placeholder="your-store.myshopify.com" style="padding:.5rem" />
    <button style="padding:.5rem .8rem">Install</button>
  </form></body></html>\`);
});
// === End Shopify OAuth + Billing ====================================
`;
    s = s.replace(/(app\.use\([^)]*static[^)]*\)\);)/, `$1\n${add}`);
    // If the regex didn’t catch (order differs), append:
    if (!/Shopify OAuth \+ Billing/.test(s)) s += add;
    W(INDEX,s);
  } else {
    console.log('• Shopify OAuth/Billing block already present');
  }
}

function patchDashboard(){
  let h = R(DASH); if (!h) return;
  if (!/data-install-shopify/.test(h)) {
    // Add a tiny Install banner near top
    h = h.replace(/<section class="section">/, `
<section class="section"><div class="container">
  <div class="card" id="shopify-install-banner" style="display:none;align-items:center;justify-content:space-between;gap:.75rem">
    <div><strong>Install Abando in your Shopify store</strong><div class="muted">A few clicks to connect via OAuth.</div></div>
    <a class="btn btn-primary" data-install-shopify href="#">Install via Shopify</a>
  </div>
</div></section>
<section class="section">`);
    W(DASH,h);
  }

  // Add small client script to expose the button when no token (dev heuristic)
  const MAIN = path.join(PUB,'assets','main.js');
  let js = R(MAIN);
  const marker = '/* === shopify install banner === */';
  if (js && !js.includes(marker)) {
    js += `
${marker}
(function(){
  const btn = document.querySelector('[data-install-shopify]');
  if (!btn) return;
  const params = new URLSearchParams(location.search);
  const shop = params.get('shop');
  if (!shop) return; // only show when a shop is specified
  const card = document.getElementById('shopify-install-banner'); if (card) card.style.display='flex';
  btn.addEventListener('click', (e)=>{ e.preventDefault(); location.href = '/shopify/install?shop='+encodeURIComponent(shop); });
})();
`;
    W(MAIN, js);
  }
}

(function run(){
  ensureShopsFile();
  patchIndex();
  patchDashboard();
  console.log('✅ Shopify OAuth + Billing (dev) wired. Set env: APP_URL, SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_SCOPES, SHOPIFY_API_VERSION');
})();
