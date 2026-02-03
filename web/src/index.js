// web/src/index.js — clean ESM server with Shopify OAuth + DB save
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { randomBytes, createHmac } from "node:crypto";
import { PrismaClient, Prisma } from "@prisma/client";
import applyAbandoDevProxy from "./abandoDevProxy.js";
import crypto from "crypto";

function verifyShopifyWebhookHmac(req) {
  const hmacHeader = req.get("X-Shopify-Hmac-Sha256") || "";
  const secret =
    process.env.SHOPIFY_API_SECRET ||
    process.env.SHOPIFY_API_SECRET_KEY ||
    process.env.SHOPIFY_SECRET ||
    "";

  if (!secret || !hmacHeader) return false;

  const body = req.body;
  if (!Buffer.isBuffer(body)) return false;

  const digest = crypto.createHmac("sha256", secret).update(body).digest("base64");

  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(hmacHeader, "utf8");
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}


const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// --- Abando Embedded Checks probe (minimal, intentional) ---
app.get("/api/embedded-check", (req, res) => {
  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    const auth = req.get("authorization") || "";
    const hasBearer = /^Bearers+S+/.test(auth);

    console.log("[abando] /api/embedded-check", { hasBearer, ua: req.get("user-agent") });

    res.status(200).json({
      ok: true,
      hasBearer,
      ts: Date.now(),
    });
  } catch (e) {
    console.error("[abando] /api/embedded-check error", e);
    res.status(500).json({ ok: false });
  }
});
// --- end probe ---



/* ABANDO_GDPR_WEBHOOK_ROUTE */
/**
 * Shopify GDPR webhooks:
 * - 405 for non-POST (GET/HEAD probes)
 * - 401 for missing/invalid HMAC on POST
 * - 200 only for valid POST
 */
app.all("/api/webhooks/gdpr", (req, res, next) => {
  res.set("X-Abando-GDPR-Guard", "1"); // prove THIS handler is active
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
  return next();
});

app.post("/api/webhooks/gdpr", express.raw({ type: "*/*" }), (req, res) => {
  try {
    const secret =
      process.env.SHOPIFY_API_SECRET ||
      process.env.SHOPIFY_API_SECRET_KEY ||
      process.env.SHOPIFY_SECRET ||
      "";

    const hmacHeader = (req.get("X-Shopify-Hmac-Sha256") || "").trim();
    if (!secret || !hmacHeader) return res.status(401).send("Unauthorized");

    const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");
    const digest = crypto.createHmac("sha256", secret).update(body).digest("base64");

    const a = Buffer.from(digest, "utf8");
    const b = Buffer.from(hmacHeader, "utf8");
    if (a.length != b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(401).send("Unauthorized");
    }

    return res.status(200).send("ok");
  } catch (_e) {
    return res.status(401).send("Unauthorized");
  }
});
/* END_ABANDO_GDPR_WEBHOOK_ROUTE */


applyAbandoDevProxy(app);



// --- Embedded entrypoint alias (Shopify Application URL) ---
app.get("/app", (req,res)=> res.redirect(307, "/embedded"));
app.get("/app\/", (req,res)=> res.redirect(307, "/embedded"));
app.get("/app\/.*", (req,res)=> res.redirect(307, "/embedded"));

app.use(cookieParser());
app.use(cors());
app.use(express.json());

// --- Abando deploy fingerprint (v1) ---
app.get("/api/version", (_req, res) => {
  res.json({
    ok: true,
    service: "cart-agent",
    git: "416588f",
    built_at_utc: "2026-02-03T20:43:55.754795Z"
  });
});
// --- end fingerprint ---


// --- Abando V1 request logging ---
// Marker: ABANDO_LOG_V1
// Toggle: ABANDO_LOG_V1=0 disables. Default ON.
// Optional: ABANDO_LOG_SKIP_REGEX overrides skip filter.
app.use((req, res, next) => {
  try {
    const enabled = process.env.ABANDO_LOG_V1 !== "0";
    if (!enabled) return next();

    const skipRe = process.env.ABANDO_LOG_SKIP_REGEX
      ? new RegExp(process.env.ABANDO_LOG_SKIP_REGEX)
      : /^(?:\/_next\b|\/favicon\.ico$|\/robots\.txt$|\/__nextjs|\/sockjs-node\b|.*\.(?:map|png|jpg|jpeg|gif|svg|ico|css|js)$)/i;

    const url = req.originalUrl || req.url || "";
    if (skipRe.test(url)) return next();

    const start = process.hrtime.bigint();

    const inboundRid = req.headers["x-request-id"];
    const rid =
      (Array.isArray(inboundRid) ? inboundRid[0] : inboundRid) ||
      `abando-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    res.setHeader("x-request-id", rid);

    const host = req.headers.host || "";
    const xfHost = req.headers["x-forwarded-host"] || "";
    const xfFor = req.headers["x-forwarded-for"] || "";
    const referer = req.headers.referer || "";
    const ua = req.headers["user-agent"] || "";
    const secFetchDest = req.headers["sec-fetch-dest"] || "";

    const isTunnel =
      String(host).includes("trycloudflare.com") ||
      String(xfHost).includes("trycloudflare.com");

    const q = req.query || {};
    const shop = q.shop || "";
    const embedded = q.embedded || "";

    const auth = req.headers.authorization || "";
    const hasBearer = typeof auth === "string" && auth.toLowerCase().startsWith("bearer ");
    const cookieHeader = req.headers.cookie || "";
    const hasSessionCookie =
      typeof cookieHeader === "string" && /(session|shopify|_secure)/i.test(cookieHeader);

    res.on("finish", () => {
      try {
        const end = process.hrtime.bigint();
        const ms = Number(end - start) / 1e6;

        const line = {
          tag: "abando.v1",
          rid,
          t: new Date().toISOString(),
          method: req.method,
          path: url,
          status: res.statusCode,
          ms: Math.round(ms * 10) / 10,

          host,
          xfHost: Array.isArray(xfHost) ? xfHost[0] : xfHost,
          xfFor: Array.isArray(xfFor) ? xfFor[0] : xfFor,
          referer,
          secFetchDest,
          isTunnel,

          shop,
          embedded,
          hasBearer,
          hasSessionCookie,

          ua: typeof ua === "string" ? ua.slice(0, 140) : ""
        };

        console.log(JSON.stringify(line));
      } catch (e) {
        console.log("[abando.v1] log error", String(e));
      }
    });

    return next();
  } catch (e) {
    console.log("[abando.v1] middleware error", String(e));
    return next();
  }
});


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
