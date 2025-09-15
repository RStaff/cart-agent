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
// [auto] ESM inline public checkout (order-proof)
(async () => {
  try {
    const mod = await import("./checkout-inline.mjs");
    const getHelpers = () => ({ mapPlanSafe, checkoutDryRun, checkoutPublic, ensureResponse, checkoutError });
    mod.default(app, express, getHelpers);
  } catch (err) {
    console.error("[checkout] ESM inline mount failed:", err && err.message);
  }
})();
// [auto] inline public checkout (order-proof)
try {
  const mountInline = require("./checkout-inline");
  const getHelpers = () => ({ mapPlanSafe, checkoutDryRun, checkoutPublic, ensureResponse, checkoutError });
  mountInline(app, express, getHelpers);
} catch (err) {
  console.error("[checkout] failed to mount inline public route:", err && err.message);
}
// [auto] deferred public checkout mount
try {
  const deferred = require("./checkout-deferred");
  // Supply a getter so we don't require helpers before they exist
  const getHelpers = () => ({ mapPlanSafe, checkoutDryRun, checkoutPublic, ensureResponse, checkoutError });
  deferred(app, express, getHelpers);
} catch (err) {
  console.error("[checkout] failed to schedule deferred public mount:", err && err.message);
}
// [auto] mount public checkout
try {
  const mountPublicCheckout = require("./checkout-public");
  const helpers = { mapPlanSafe, checkoutDryRun, checkoutPublic, ensureResponse, checkoutError };
  mountPublicCheckout(app, express, helpers);
} catch (err) {
  console.error("[checkout] failed to mount public route:", err && err.message);
}
// [auto] mount public checkout (do not remove)
try {
  const mountPublicCheckout = require("./checkout-public");
  // Pull helpers from existing scope
  const helpers = { mapPlanSafe, checkoutDryRun, checkoutPublic, ensureResponse, checkoutError };
  mountPublicCheckout(app, express, helpers);
} catch (err) {
  console.error("[checkout] failed to mount public route:", err && err.message);
}

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
  

// === CART-AGENT CHECKOUT V4.2 BEGIN ===
(function cartAgentCheckout(){
  try {
    if (app.get("cartAgentCheckoutV42Mounted")) {
      console.log("[checkout] V4.2 already mounted; skipping");
      return;
    }

    const expressJson = (typeof express !== "undefined" && express && typeof express.json === "function")
      ? express.json()
      : null;

    const paths = ["/__public-checkout","/api/billing/checkout"];

    function mapPlanSafe(req,res,next){
      try {
        const plan = (req.body && typeof req.body.plan === "string")
          ? req.body.trim ? req.body.trim().toLowerCase() : String(req.body).toLowerCase()
          : (typeof req.body?.plan === "string" ? req.body.plan.trim().toLowerCase() : "");
        const envMap = {
          starter: process.env.STRIPE_PRICE_STARTER || "",
          pro:     process.env.STRIPE_PRICE_PRO     || "",
          scale:   process.env.STRIPE_PRICE_SCALE   || ""
        };
        const pid = envMap[plan] || "";
        if (!pid) {
          if (!res.headersSent) {
            return res.status(400).json({
              ok:false, code:"price_not_configured",
              message:`No Stripe price configured for '${plan || "unknown"}'`,
              plan
            });
          }
          return;
        }
        req.priceId = pid;
        next();
      } catch (e) {
        console.error("[checkout][mapPlanSafe]", e);
        if (!res.headersSent) res.status(500).json({ ok:false, code:"internal_error" });
      }
    }

    function methodGate(routePath){
      return (req,res,next)=>{
        if (req.method !== "POST") {
          res.set("Allow","POST");
          if (!res.headersSent) {
            return res.status(405).json({ ok:false, code:"method_not_allowed", route:routePath });
          }
          return;
        }
        next();
      };
    }

    async function invokeCheckout(req,res,next){
      try {
        await checkoutPublic(req,res,next);
      } catch (err) {
        return next(err);
      }
      if (!res.headersSent) return next(); // fall through to ensureResponse only if nothing was sent
    }

    function ensureResponse(req,res,_next){
      if (res.headersSent) return; // no-op if already handled
      if (process.env.CHECKOUT_FORCE_JSON === "1") {
        return res.status(200).json({
          ok:true, dryRun:true,
          plan: req.body?.plan ?? null,
          priceId: req.priceId,
          via: "fallback"
        });
      }
      return res.status(500).json({ ok:false, code:"checkout_no_response" });
    }

    function checkoutDryRun(req,res){
      res.set('X-Checkout-Mode','dry-run');
      if (!res.headersSent) {
        return res.status(200).json({
          ok:true, dryRun:true,
          plan: req.body?.plan ?? null,
          priceId: req.priceId,
          via: "shortcircuit"
        });
      }
    }

    // Mount our routes (placed BEFORE any 404 tail by source insertion)
    for (const p of paths) {
      if (process.env.CHECKOUT_FORCE_JSON === "1") {
        if (expressJson) app.post(p, expressJson, mapPlanSafe, checkoutDryRun);
        else             app.post(p,            mapPlanSafe, checkoutDryRun);
      }
      if (expressJson) app.all(p, expressJson, mapPlanSafe, methodGate(p), invokeCheckout, ensureResponse);
      else             app.all(p,              mapPlanSafe, methodGate(p), invokeCheckout, ensureResponse);
    }

    // Error handler LOCAL to these routes (respond only if we haven't already)
    app.use((err,req,res,next)=>{
      const u = req?.path || "";
      const ours = (u === "/__public-checkout" || u === "/api/billing/checkout");
      if (!ours || res.headersSent) return next(err);
      return res.status(500).json({ ok:false, code:"checkout_error", message: err?.message ?? "error" });
    });

    // Status probe
    app.get("/__public-checkout/_status", (_req,res)=>{
      res.json({
        ok: true,
        public: "true",
        prices: {
          starter: !!process.env.STRIPE_PRICE_STARTER,
          pro:     !!process.env.STRIPE_PRICE_PRO,
          scale:   !!process.env.STRIPE_PRICE_SCALE
        }
      });
    });

    app.set("cartAgentCheckoutV42Mounted", true);
    console.log("[checkout] V4.2 mounted for", paths.join(", "));
  } catch (e) {
    console.error("[checkout] V4.2 failed:", e);
  }
})();
// === CART-AGENT CHECKOUT V4.2 END ===

res.status(404).json({ ok:false, code:"route_not_found", method:req.method, url:req.originalUrl, matched: req._matchedIn || null });
});

// __JSON_ERROR_HANDLER__
app.use((err,_req,res,_next) => {
  console.error("[error]", err);
  res.status(500).json({ ok:false, code:"internal_error" });
});

// __JSON_NOT_FOUND_TAIL__
app.use((req,res) => {
  const u = req.originalUrl || req.url || "";
  if (u.startsWith("/__public-checkout") || u.startsWith("/api/billing/checkout")) {
    return res.status(500).json({ ok:false, code:"miswired_checkout_route" });
  }
  return res.status(404).json({
    ok:false,
    code:"route_not_found",
    method:req.method,
    url:req.originalUrl,
    matched: req._matchedIn || null
  });
});

// __JSON_ERROR_TAIL__
app.use((err,_req,res,_next) => {
  try { console.error("[error]", err && (err.stack || err)); } catch {}
  if (!res.headersSent) res.status(500).json({ ok:false, code:"internal_error" });
});
