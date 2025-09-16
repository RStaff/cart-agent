import express from "express";
import cors from "cors";
import { meRouter } from "./routes/me.js";
import { billingRouter, stripeWebhook } from "./routes/billing.js";
import { attachUser } from "./middleware/attachUser.js";
import { usageGate } from "./middleware/usageGate.js";
import { devAuth } from "./middleware/devAuth.js";

const app = express();

// [public-checkout] public Stripe checkout endpoints
import("./checkout-public.js")
  .then(m => (m && m.default ? m.default(app) : null))
  .catch(e => console.error("[public-checkout] skipped:", (e && e.message) || e));

// [pricing-page] mounted
import("./pricing-page.js")
  .then(m => {
    const handler = (m && (m.default || m.pricingPage));
    if (typeof handler === "function") {
      app.get("/pricing", handler);
      console.log("[pricing] /pricing page mounted");
    }
  })
  .catch(e => console.error("[pricing] skip:", e && e.message || e));


// [force-first] public checkout installed — GET=405 guard; POST delegates; cannot 404
if (!app.locals) app.locals = {};
if (!app.locals.__forceFirstPublic) {
  app.locals.__forceFirstPublic = true;
  app.use(async (req, res, next) => {
    const p = req.path || req.originalUrl || "";
    if (!p || (p !== "/__public-checkout" && !p.startsWith("/__public-checkout/"))) return next();

    if (req.method !== "POST" && p === "/__public-checkout") {
      res.set("Allow","POST");
      return res.status(405).json({ ok:false, code:"method_not_allowed", route:"/__public-checkout" });
    }

    if (req.method === "POST" && p === "/__public-checkout") {
      try {
        if (!req.body || typeof req.body !== "object") {
          let raw = ""; req.on("data", c => raw += c);
          return req.on("end", () => {
            try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
            import("./real-checkout.mjs")
              .then(m => (typeof m.handlePublicCheckout === "function")
                ? m.handlePublicCheckout(req, res)
                : res.status(500).json({ ok:false, code:"checkout_handler_missing" }))
              .catch(e => res.status(500).json({ ok:false, code:"checkout_import_error", message:String(e && e.message || e) }));
          });
        }
        import("./real-checkout.mjs")
          .then(m => (typeof m.handlePublicCheckout === "function")
            ? m.handlePublicCheckout(req, res)
            : res.status(500).json({ ok:false, code:"checkout_handler_missing" }))
          .catch(e => res.status(500).json({ ok:false, code:"checkout_import_error", message:String(e && e.message || e) }));
      } catch (e) {
        return res.status(500).json({ ok:false, code:"checkout_error", message:String(e && e.message || e) });
      }
    }

    return next();
  });
  console.log("[force-first] public checkout installed (cannot 404)");
}


// Root route: plain text hinting available endpoints
app.get('/api', (req,res)=>{ res.type('text/plain').send('Cart Agent API. Try /hello and /healthz'); });

app.post("/api/billing/webhook", express.raw({ type: "application/json" }), stripeWebhook);
app.use(cors());
app.use(express.json());
app.use(devAuth);
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

// [public-pages] attach lightweight buy/success pages without breaking anything
import("./routes/publicPages.esm.js")
  .then(m => (m && typeof m.installPublicPages === "function") ? m.installPublicPages(app) : null)
  .catch(e => console.error("[public-pages] skipped:", (e && e.message) || e));

// [stripe-webhook] attach minimal Stripe webhook endpoint
import("./routes/stripeWebhook.esm.js")
  .then(m => (m && typeof m.installStripeWebhook === "function") ? m.installStripeWebhook(app) : null)
  .catch(e => console.error("[stripe-webhook] skipped:", (e && e.message) || e));

// [landing] attach high-converting landing page at "/"
import("./routes/landing.esm.js")
  .then(m => (m && typeof m.installLanding === "function") ? m.installLanding(app) : null)
  .catch(e => console.error("[landing] skipped:", (e && e.message) || e));

// [demo-widget] floating demo embed for homepage
import("./routes/demoWidget.esm.js")
  .then(m => (m && typeof m.installDemo === "function") ? m.installDemo(app) : null)
  .catch(e => console.error("[demo-widget] skipped:", (e && e.message) || e));

// [success-pages] Stripe success/cancel/onboarding routes
import("./routes/success.esm.js")
  .then(m => (m && typeof m.installSuccess === "function") ? m.installSuccess(app) : null)
  .catch(e => console.error("[success-pages] skipped:", (e && e.message) || e));

// [snippet] public embeddable script + install page
import("./routes/snippet.esm.js")
  .then(m => (m && typeof m.installSnippet === "function") ? m.installSnippet(app) : null)
  .catch(e => console.error("[snippet] skipped:", (e && e.message) || e));

// [shopify-install] one-click ScriptTag injector for Shopify
import("./routes/installShopify.esm.js")
  .then(m => (m && typeof m.installShopify === "function") ? m.installShopify(app) : null)
  .catch(e => console.error("[shopify-install] skipped:", (e && e.message) || e));
