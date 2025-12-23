// web/src/index.js — clean ESM server with Shopify OAuth + DB save
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { randomBytes, createHmac } from "node:crypto";
import { PrismaClient, Prisma } from "@prisma/client";

import { createProxyMiddleware } from "http-proxy-middleware";
const __dirname = dirname(fileURLToPath(import.meta.url));
import billingRouter from "./routes/billing.js";
import rescueRouter from "./routes/rescue.js";
const app = express();

// ABANDO_METRICS_AND_ENTITLEMENT_MOUNTED
const { entitlementRoutes } = require("./abando/entitlement");
const { metricsRoutes } = require("./abando/metrics");
entitlementRoutes(app);
metricsRoutes(app);
globalThis.__abandoDevStore = globalThis.__abandoDevStore || {
  byShop: new Map(),
};

// === ABANDO_UI_PROXY_START ===
// Proxy Next UI (3001) through Express (3000) for /demo/* and /embedded*
const { attachUiProxy } = await import("./ui-proxy.mjs");
attachUiProxy(app);
// === ABANDO_UI_PROXY_END ===


// Convenience route (people will type /playground)
app.get("/playground", (_req, res) => res.redirect(307, "/demo/playground"));



// ---- UI PROXY (MUST COME FIRST) ----

// ---- END UI PROXY ----

// Serve the Next.js UI (running on :3001) THROUGH the Shopify backend origin (:3000)
// so embedded iframes + auth stay same-origin in dev.
app.get("/", (_req, res) => res.redirect(307, "/demo/playground"));

// Proxy UI routes
app.use("/demo", createProxyMiddleware({
  target: "http://localhost:3001",
  changeOrigin: true,
  ws: true,
  logLevel: "warn",
}));

app.use("/embedded", createProxyMiddleware({
  target: "http://localhost:3001",
  changeOrigin: true,
  ws: true,
  logLevel: "warn",
}));

app.use(cookieParser());


app.use("/api/rescue", rescueRouter);
app.use("/api/billing", billingRouter);
app.use("/billing", (await import("./routes/billing_create.js")).default);
app.use(cors());
app.use(express.json());

// Static + simple pages
app.use(express.static(join(__dirname, "public")));
app.get("/", (_req,res)=>res.sendFile(join(__dirname,"public","index.html")));
app.get("/pricing", (_req,res)=>res.sendFile(join(__dirname,"public","pricing","index.html")));
app.get("/onboarding", (_req,res)=>res.sendFile(join(__dirname,"public","onboarding","index.html")));

// Health/hello
app.get("/healthz", (_req, res) => res.type("text/plain").send("ok"));
app.get("/hello", (_req, res) => res.json({ msg: "Hello from Cart Agent!" }));

// Prisma
const prisma = new PrismaClient();

// Env
const APP_URL            = process.env.APP_URL || "https://abando.ai";
const SHOPIFY_API_KEY    = process.env.SHOPIFY_API_KEY    || "";
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || "";
const SHOPIFY_SCOPES     = process.env.SHOPIFY_SCOPES
  || "read_checkouts,read_orders,write_checkouts,read_script_tags,write_script_tags";

// Helpers
function normalizeShopDomain(raw) {
  return String(raw || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
}
function signParams(params) {
  const keys = Object.keys(params).filter(k => k !== "hmac").sort();
  const message = keys.map(k => `${k}=${params[k]}`).join("&");
  return createHmac("sha256", SHOPIFY_API_SECRET).update(message).digest("hex");
}
async function saveShopToDB(domain, accessToken, scopes) {
  const now = new Date();
  const id  = Math.random().toString(36).slice(2);
  const name = domain, key = domain, prov = "shopify";
  await prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO "Shop"
        ("id","key","createdAt","updatedAt","name","provider","domain","accessToken","scopes","installedAt")
      VALUES
        (${id}, ${key}, ${now}, ${now}, ${name}, ${prov}, ${domain}, ${accessToken ?? ""}, ${scopes ?? ""}, ${now})
      ON CONFLICT (lower("domain")) DO UPDATE SET
        "name"        = EXCLUDED."name",
        "provider"    = EXCLUDED."provider",
        "domain"      = EXCLUDED."domain",
        "accessToken" = EXCLUDED."accessToken",
        "scopes"      = EXCLUDED."scopes",
        "installedAt" = EXCLUDED."installedAt",
        "updatedAt"   = NOW();
    `
  );
}

// Shopify routes
app.get("/shopify/install", (req, res) => {
  const shop = normalizeShopDomain(req.query.shop);
  if (!shop || !shop.endsWith(".myshopify.com")) return res.status(400).send("Missing/invalid ?shop=your-store.myshopify.com");
  const state = randomBytes(16).toString("hex");
  res.cookie("shopify_state", state, { httpOnly: true, sameSite: "lax", secure: true, path: "/" });
  const redirect_uri = encodeURIComponent(`${APP_URL}/shopify/callback`);
  const authorizeUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${encodeURIComponent(SHOPIFY_SCOPES)}&redirect_uri=${redirect_uri}&state=${state}&grant_options[]=per-user`;
  console.log("[shopify] authorize →", authorizeUrl);
  return res.redirect(authorizeUrl);
});

app.get("/shopify/callback", async (req, res) => {
  try {
    const shop = normalizeShopDomain(req.query.shop);
    const code = String(req.query.code || "");
    const state = String(req.query.state || "");
    const hmac = String(req.query.hmac || "");
    const timestamp = String(req.query.timestamp || "");

    if (!shop || !shop.endsWith(".myshopify.com")) return res.status(400).send("Invalid shop");
    if (!code || !state || !hmac || !timestamp)   return res.status(400).send("Missing OAuth params");
    if (String(req.cookies?.shopify_state) !== state) return res.status(400).send("State mismatch");

    const expected = signParams({ code, shop, state, timestamp });
    if (expected !== hmac) return res.status(400).send("HMAC verification failed");

    const tokenResp = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ client_id: SHOPIFY_API_KEY, client_secret: SHOPIFY_API_SECRET, code })
    });
    if (!tokenResp.ok) {
      const txt = await tokenResp.text();
      console.error("[shopify] token exchange failed", tokenResp.status, txt);
      return res.status(500).send("Token exchange failed");
    }
    const { access_token, scope } = await tokenResp.json();
    await saveShopToDB(shop, access_token, scope);
    console.log("[shopify] token stored for", shop);
    return res.redirect(`/shopify/billing/start?shop=${encodeURIComponent(shop)}`);
  } catch (e) {
    console.error("[shopify] callback error", e);
    return res.status(500).send("OAuth callback error");
  }
});

app.get("/shopify/billing/start", (req, res) => {
  const shop = normalizeShopDomain(req.query.shop);
  if (!shop || !shop.endsWith(".myshopify.com")) return res.status(400).send("Invalid shop");
  return res.redirect(`/shopify/billing/return?shop=${encodeURIComponent(shop)}`);
});
app.get("/shopify/billing/return", (_req, res) => res.redirect("/onboarding"));

// Start
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, () => console.log(`[server] listening on :${PORT}`));
export default app;

// Public Stripe checkout (no auth)
app.post("/api/billing/checkout", async (req, res) => {
  try {
    const Stripe = (await import("stripe")).default;
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const priceStarter = process.env.STRIPE_PRICE_STARTER;
    const pricePro = process.env.STRIPE_PRICE_PRO;
    if (!stripeKey) return res.status(500).json({ error: "stripe_not_configured" });

    const plan = (req.body && req.body.plan) || "starter";
    const price = plan === "pro" ? (pricePro || "") : (priceStarter || "");
    if (!price) return res.status(500).json({ error: "price_not_configured" });

    const stripe = new Stripe(stripeKey);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      success_url: "https://abando.ai/onboarding/",
      cancel_url: "https://abando.ai/pricing/",
    });
    return res.json({ url: session.url });
  } catch (e) {
    console.error("[public checkout] error:", e);
    return res.status(500).json({ error: "checkout_failed" });
  }
});
app.get("/demo/playground", (_req, res) =>
  res.sendFile(join(__dirname, "public", "demo", "playground", "index.html")));
app.get("/dashboard", (_req, res) =>
  res.sendFile(join(__dirname, "public", "dashboard", "index.html")));
app.get("/support", (_req, res) =>
  res.sendFile(join(__dirname, "public", "support", "index.html")));

// ---- AI demo message generation ----
function buildPrompt(p) {
  const {
    productName = "your item",
    price = "",
    tone = "Friendly",
    channel = "Email",
    offer = "",
    cta = "Complete your order",
    template = "Custom flow",
  } = p || {};

  const priceStr = price ? `$${Number(price).toFixed(2)}` : "";
  const offerStr = offer ? ` Offer: ${offer}.` : "";
  return `You are an AI shopping assistant writing a ${channel} message in a ${tone.toLowerCase()} tone.
Template: ${template}.
Write a concise, conversion-focused message (80-140 words) that helps the shopper finish checkout.

Product: ${productName} ${priceStr}
${offerStr}
CTA: ${cta}

Return ONLY the message body, no greetings like "Hi" unless natural, no markdown.`;
}

// Fallback message if no model is configured
function fallbackMessage(p) {
  const { productName = "your item", cta = "Complete your order", offer = "" } = p || {};
  const offerLine = offer ? ` We’ve added an exclusive ${offer} just for you.` : "";
  return `Quick reminder — your ${productName} is still in your cart. I can answer any questions and help you finish up.${offerLine} When you’re ready, tap the link below to pick up where you left off.\n\n${cta} →`;
}

async function generateWithOpenAI(prompt, params) {
  const key = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
  if (!key) return { message: fallbackMessage(params), usedAI:false };

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    })
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    console.error("[ai] openai error", resp.status, text);
    return { message: fallbackMessage(params), usedAI:false };
  }
  const data = await resp.json();
  const message = data?.choices?.[0]?.message?.content?.trim() || fallbackMessage(params);
  return { message, usedAI:true };
}

async function handleGenerate(req, res) {
  try {
    const p = req.body || {};
    const prompt = buildPrompt(p);
    const { message, usedAI } = await generateWithOpenAI(prompt, p);
    const subject = (p.channel || "Email").toLowerCase().includes("email")
      ? `Your ${p.productName || "item"} is still in your cart`
      : `Finish your order`;
    return res.json({ ok: true, subject, message, usedAI });
  } catch (e) {
    console.error("[demo] generate error", e);
    return res.status(500).json({ ok:false, error: "generate_failed" });
  }
}

// Accept both paths the UI might call
app.post("/api/demo/generate", handleGenerate);
app.post("/api/generate", handleGenerate);

// --- AI healthcheck route ---
import fetch from "node-fetch"; // ensure node-fetch is installed in your deps

app.get("/api/ai/health", async (req, res) => {
  try {
    const resp = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    });
    if (!resp.ok) throw new Error(`OpenAI responded ${resp.status}`);
    const data = await resp.json();
    res.json({ ok: true, model: process.env.OPENAI_MODEL || "unset", models: data.data.slice(0,3) });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});


/**
 * REAL rescue metrics (stub for now)
 * Returns a stable 200 so the UI can link it.
 */
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




