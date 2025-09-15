import billingOps from "./routes/billing-ops.esm.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import planToPrice from "./middleware/planToPrice.esm.js";
import checkoutPublic from "./dev/checkoutPublic.esm.js";

import express from "express";
import cors from "cors";
import { meRouter } from "./routes/me.js";
import { billingRouter, stripeWebhook } from "./routes/billing.js";
import { attachUser } from "./middleware/attachUser.js";
import { usageGate } from "./middleware/usageGate.js";
import { devAuth } from "./middleware/devAuth.js";

const app = express();



// --- plan→price guard that never skips the route ---
function mapPlanSafe(req,res,next){
  try {
    const plan = String((req.body && req.body.plan) || '').toLowerCase();
    const prices = {
      starter: process.env.STRIPE_PRICE_STARTER,
      pro:     process.env.STRIPE_PRICE_PRO,
      scale:   process.env.STRIPE_PRICE_SCALE,
    };
    if (!['starter','pro','scale'].includes(plan)) {
      return res.status(400).json({ ok:false, code:'invalid_plan', plan });
    }
    const priceId = prices[plan];
    if (!priceId) {
      return res.status(400).json({ ok:false, code:'price_not_configured', plan });
    }
    res.locals.plan = plan;
    res.locals.priceId = priceId;
    // also mirror into body for downstream handlers that read from body
    try { req.body = req.body || {}; req.body.priceId = priceId; } catch (_){}
    return next();
  } catch (e) {
    console.error('[mapPlanSafe] error', e);
    return res.status(500).json({ ok:false, code:'internal_error' });
  }
}
process.on('unhandledRejection', e => { console.error('[unhandledRejection]', e); });
process.on('uncaughtException',  e => { console.error('[uncaughtException]',  e); });
app.set('trust proxy', true);

/* begin: global rate limit */
const realIp = (req) => req.headers["cf-connecting-ip"] || req.ip;

const limiter = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: true,   // adds RateLimit-* headers
  legacyHeaders: true,
  keyGenerator: realIp,
  skip: (req) => req.originalUrl === "/api/billing/webhook", // don't rate-limit Stripe webhooks

});

app.use(limiter);
/* end: global rate limit */
// --- Map plan -> Stripe Price ID (starter|pro|scale); fallback to explicit priceId or STRIPE_PRICE_ID ---

// Public checkout: rate limited + JSON-only handler
const checkoutLimiter = rateLimit({ windowMs: 60_000, max: 20, standardHeaders: true, legacyHeaders: false });

// Public + API checkout with plan→price enforcement (POST only)

// Public + API checkout with plan→price enforcement

app.use("/api/billing/ops", billingOps);

app.get("/__public-checkout/_status", (req, res) => {
  res.json({
    ok: true,
    public: String(process.env.ALLOW_PUBLIC_CHECKOUT || ""),
    prices: {
      starter: Boolean((process.env.STRIPE_PRICE_STARTER || "").trim()),
      pro:     Boolean((process.env.STRIPE_PRICE_PRO || "").trim()),
      scale:   Boolean((process.env.STRIPE_PRICE_SCALE || "").trim())
    }
  });
});

app.use(cors());

// === Public + API checkout (POST only) ===============================

// 405 JSON guard for wrong methods (no HTML errors)
for (const route of ["/__public-checkout", "/api/billing/checkout"]) {
  app.all(route, (req,res,next) => {
    if (req.method === "POST") return next();
    res.set("Allow","POST");
    return res.status(405).json({ ok:false, code:"method_not_allowed", route });
  });
}

const jsonUnlessStripe = (req,res,next) =>
  req.originalUrl === "/api/billing/webhook" ? next() : express.json()(req,res,next);
const urlUnlessStripe  = (req,res,next) =>
  req.originalUrl === "/api/billing/webhook" ? next() : express.urlencoded({ extended: true })(req,res,next);
app.use(jsonUnlessStripe);
app.use(urlUnlessStripe);

if (app.get("checkoutMounted")) {
  console.warn("[startup] checkout routes already mounted; skipping duplicate");
} else {
  app.set("checkoutMounted", true);

  }
// === CHECKOUT INLINE BEGIN ===
function handleCheckout(req,res,next){
  if (process.env.CHECKOUT_DRY_RUN === '1') {
    console.log('[checkout] DRY_RUN on, skipping Stripe for', req.body?.plan);
    return res.json({ ok:true, url:'https://example.com/fake-checkout', priceId: (res.locals && res.locals.priceId) || (req.body && req.body.priceId) || null, dryRun:true });
  }
  console.log('[checkout] entering handleCheckout', { plan:req.body?.plan, email:req.body?.email });
  Promise.resolve().then(()=>checkoutPublic(req,res,next)).catch(next);
}
const _paths = ["/__public-checkout","/api/billing/checkout"];
for (const p of _paths) {
  const already = (app._router?.stack||[]).some(l=>l.route?.path===p);
  if (already) continue;

  app.all(p, express.json(), (req,res,next)=>{ console.log('[checkout]', req.method, p); next(); }, planToPrice, (req,res,next)=>{
    if (req.method !== "POST") {
      res.set("Allow","POST");
      return res.status(405).json({ ok:false, code:"method_not_allowed", route:p });
    }
    try {
      return handleCheckout(req,res,next);
    } catch (e) {
      console.error('[checkout] sync error', e);
      return next(e);
    }
  });
}
console.log("[startup] mounted inline checkout handlers for", _paths.join(", "));
// === CHECKOUT INLINE END ===

app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.post("/api/billing/webhook", express.raw({ type: "application/json" }), stripeWebhook);
app.use(devAuth);

// Dev-only auth compat shim — makes common guards pass when using DEV_AUTH_TOKEN
app.use((req, _res, next) => {
  const required = process.env.DEV_AUTH_TOKEN;
  const hdr = req.headers.authorization || "";
  const ok = required && hdr.startsWith("Bearer ") && hdr.slice(7).trim() === required;
  if (ok) {
    if (typeof req.isAuthenticated !== "function") req.isAuthenticated = () => true;
    req.session = req.session || {};
    if (req.user?.id) req.session.userId = req.user.id;
  }
  next();
});

app.use(attachUser);

app.get("/healthz", (_req, res) => res.type("text/plain").send("ok"));
app.get("/hello", (_req, res) => res.json({ msg: "Hello from Cart Agent!" }));

app.use("/api/me", meRouter);
app.use("/api/billing", billingRouter);

app.post("/api/abando/run", usageGate({ kind: "abandoned_cart_run", cost: 1 }), async (_req, res) => {
  res.json({ ok: true, message: "Ran the agent ✨" });
});

// Dev probe: whoami (works only when DEV_AUTH_TOKEN is provided)
app.get("/api/dev/whoami", (req, res) => {
  if (!process.env.DEV_AUTH_TOKEN) return res.status(404).end();
  res.json({ user: req.user || null });
});

/** Dev-only: confirms this file was patched. */
app.get("/api/dev/middleware-order", (_req, res) => {
  res.json({ ok: true, checks: ["express.json", "devAuth"] });
});

/** Dev-only: env & auth sanity (no secrets leaked, only presence booleans). */
app.get("/api/dev/diag", (req, res) => {
  const hasDev = !!process.env.DEV_AUTH_TOKEN;
  const hasStripeKey = !!process.env.STRIPE_SECRET_KEY;
  const hasPrice = !!process.env.STRIPE_PRICE_ID;
  const who = req.user || null;
  const authed = typeof req.isAuthenticated === "function" ? req.isAuthenticated() : false;
  res.json({
    ok: true,
    env: { hasDev, hasStripeKey, hasPrice },
    auth: { user: who, isAuthenticated: authed }
  });
});

export default app;

/** Dev-only: echo request body to debug parsers */
app.post("/api/dev/echo-body", (req,res)=>{
  res.json({ headers: req.headers, body: req.body || null });
});

// /* json error handler */
app.use((err, req, res, _next) => {
  const code = err?.status || 500;
  const msg  = err?.message || "internal_error";
  res.status(code).json({ ok:false, code, message: msg });
});

app.get("/__diag/ip", (req, res) => {
  res.json({
    ip: req.ip,
    ips: req.ips || [],
    cfConnectingIp: req.headers["cf-connecting-ip"] || null,
    xForwardedFor: req.headers["x-forwarded-for"] || null,
    trustProxy: app.get("trust proxy"),
  });
});

app.get("/__diag/routes", (_req,res) => {
  const out = [];
  const src = app._router && app._router.stack ? app._router.stack : [];
  for (const l of src) {
    if (l.route && l.route.path) {
      out.push({ path: l.route.path, methods: Object.keys(l.route.methods||{}).filter(Boolean) });
    } else if (l.name === 'router' && l.handle && l.handle.stack) {
      for (const r of l.handle.stack) {
        if (r.route && r.route.path) {
          out.push({ path: r.route.path, methods: Object.keys(r.route.methods||{}).filter(Boolean) });
        }
      }
    }
  }
  res.json({ ok:true, routes: out });
});

// __JSON_NOT_FOUND__
app.use((req,res) => {
  res.status(404).json({ ok:false, code:"route_not_found", method:req.method, url:req.originalUrl, matched: req._matchedIn || null });
});

// __JSON_ERROR_HANDLER__
app.use((err,_req,res,_next) => {
  console.error("[error]", err);
  res.status(500).json({ ok:false, code:"internal_error" });
});
