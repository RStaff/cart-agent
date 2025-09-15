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

app.set('trust proxy', 1);
// --- Map plan -> Stripe Price ID (starter|pro|scale); fallback to explicit priceId or STRIPE_PRICE_ID ---
// Public + API checkout with plan→price enforcement

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
const jsonUnlessStripe = (req,res,next) =>
  req.originalUrl === "/api/billing/webhook" ? next() : express.json()(req,res,next);
const urlUnlessStripe  = (req,res,next) =>
  req.originalUrl === "/api/billing/webhook" ? next() : express.urlencoded({ extended: true })(req,res,next);
app.use(jsonUnlessStripe);
app.use(urlUnlessStripe);

// Public + API checkout with plan→price enforcement
app.use("/__public-checkout", planToPrice, checkoutPublic);
app.use("/api/billing/checkout", planToPrice, checkoutPublic);

// 405s for wrong methods so responses stay JSON
app.all("/__public-checkout", (req,res,next) => {
  if (req.method === "POST") return next();
  return res.status(405).json({ ok:false, code:"method_not_allowed" });
});
app.all("/api/billing/checkout", (req,res,next) => {
  if (req.method === "POST") return next();
  return res.status(405).json({ ok:false, code:"method_not_allowed" });
});
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
