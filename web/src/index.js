import checkoutPublic from "./dev/checkoutPublic.esm.js";

import express from "express";
import cors from "cors";
import { meRouter } from "./routes/me.js";
import { billingRouter, stripeWebhook } from "./routes/billing.js";
import { attachUser } from "./middleware/attachUser.js";
import { usageGate } from "./middleware/usageGate.js";
import { devAuth } from "./middleware/devAuth.js";
import { router as devCheckoutBypass } from "./dev/checkoutBypass.dev.js";

const app = express();
app.use("/api/billing/checkout", checkoutPublic);
app.use("/__public-checkout", checkoutPublic);

app.get("/__public-checkout/_status", (req,res)=>res.json({ok:true, public:String(process.env.ALLOW_PUBLIC_CHECKOUT||""), price: process.env.STRIPE_PRICE_ID ? "set":"missing"}));

// Root route: plain text hinting available endpoints
app.get('/', (req,res)=>{ res.type('text/plain').send('Cart Agent API. Try /hello and /healthz'); });

app.post("/api/billing/webhook", express.raw({ type: "application/json" }), stripeWebhook);
app.use(cors());
app.use(express.json());
app.use(devAuth);
app.use(devCheckoutBypass);

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
export default app;

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