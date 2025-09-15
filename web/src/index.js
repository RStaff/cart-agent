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
// === CHECKOUT ROUTER BEGIN ===
if (!app.get("checkoutMounted")) {
  app.set("checkoutMounted", true);
  const checkout = express.Router();

  // Route-local JSON parsing (bulletproof even if globals change)
  checkout.use(express.json());

  // Public checkout POST (two entry points share the same handler)
  checkout.post("/__public-checkout",    planToPrice, (req,res,next)=>Promise.resolve().then(()=>checkoutPublic(req,res,next)).catch(next));
  checkout.post("/api/billing/checkout", planToPrice, (req,res,next)=>Promise.resolve().then(()=>checkoutPublic(req,res,next)).catch(next));

  // 405 JSON (no HTML) for wrong methods
  for (const route of ["/__public-checkout", "/api/billing/checkout"]) {
    checkout.all(route, (req,res,next) => {
      if (req.method === "POST") return next();
      res.set("Allow", "POST");
      return res.status(405).json({ ok:false, code:"method_not_allowed", route });
    });
  }

  // trace marker: lets us see if this router handled the request
  checkout.use((req,_res,next)=>{ req._matchedIn='checkoutRouter'; next(); });

  app.use(checkout);
  console.log("[startup] mounted checkout routes via dedicated router");
}
// === CHECKOUT ROUTER END ===

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
