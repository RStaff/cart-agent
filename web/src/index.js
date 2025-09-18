import express from "express";
import { billingPublicRouter } from "./routes/billing_public.js";
import cors from "cors";
import { meRouter } from "./routes/me.js";
import { billingRouter, stripeWebhook } from "./routes/billing.js";
import { attachUser } from "./middleware/attachUser.js";
import { usageGate } from "./middleware/usageGate.js";
import { devAuth } from "./middleware/devAuth.js";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

/** PUBLIC checkout (no auth) */
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
app.use(express.static(join(__dirname,"public"), { redirect: false }));


 

// Root route: plain text hinting available endpoints


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

app.get("/", (_req,res)=>res.sendFile(join(__dirname,"public","index.html")));
app.get("/pricing", (_req,res)=>res.sendFile(join(__dirname,"public","pricing","index.html")));
app.get("/onboarding", (_req,res)=>res.sendFile(join(__dirname,"public","onboarding","index.html")));
app.get("/demo", (_req,res)=>res.sendFile(join(__dirname,"public","demo","index.html")));





app.get("/demo", (_req, res) => res.sendFile(join(__dirname, "public", "demo", "index.html")));
app.get("/demo/", (_req, res) => res.sendFile(join(__dirname, "public", "demo", "index.html")));
app.get("/demo/image", (_req, res) => res.sendFile(join(__dirname, "public", "demo", "playground", "index.html")));
app.get("/demo/image/", (_req, res) => res.sendFile(join(__dirname, "public", "demo", "playground", "index.html")));
app.get("/demo/playground", (_req, res) => res.sendFile(join(__dirname, "public", "demo", "playground", "index.html")));
app.get("/demo/playground/", (_req, res) => res.sendFile(join(__dirname, "public", "demo", "playground", "index.html")));
app.get("/demo/light", (_req, res) => res.redirect(301, "/demo/image"));
app.get("/demo/light/", (_req, res) => res.redirect(301, "/demo/image"));
// [playground mount v2] semicolon-safe, ES5-friendly
;(function(){
  import("./routes/playground.esm.js")
    .then(function(m){
      if (m && typeof m.installPlayground === "function") {
        if (!globalThis.__ABANDO_PLAYGROUND_INSTALLED__) {
          globalThis.__ABANDO_PLAYGROUND_INSTALLED__ = true;
          m.installPlayground(app);
        }
      } else {
        console.error("[playground] no installer");
      }
    })
    .catch(function(e){
      console.error("[playground] failed to import:", (e && e.message) || e);
    });
})();








app.get("/demo", (_req, res) => res.redirect(301, "/demo/playground"));
app.get("/demo/", (_req, res) => res.redirect(301, "/demo/playground"));
app.get("/demo/playground", (_req, res) => res.sendFile(join(__dirname, "public", "demo", "playground", "index.html")));
app.get("/dashboard", (_req, res) => res.sendFile(join(__dirname, "public", "dashboard", "index.html")));
app.get("/support", (_req, res) => res.sendFile(join(__dirname, "public", "support", "index.html")));
app.get("/legal/terms", (_req, res) => res.sendFile(join(__dirname, "public", "legal", "terms", "index.html")));
app.get("/legal/privacy", (_req, res) => res.sendFile(join(__dirname, "public", "legal", "privacy", "index.html")));
app.get("/legal/dpa", (_req, res) => res.sendFile(join(__dirname, "public", "legal", "dpa", "index.html")));



app.get("/demo", (_req, res) => res.sendFile(join(__dirname, "public", "demo", "playground", "index.html")));
app.get("/demo/playground", (_req, res) => res.sendFile(join(__dirname, "public", "demo", "playground", "index.html")));
app.get("/demo/playground/", (_req, res) => res.sendFile(join(__dirname, "public", "demo", "playground", "index.html")));
app.get("/demo/image", (_req, res) => res.redirect(301, "/demo/playground"));
app.get("/demo/image/*", (_req, res) => res.redirect(301, "/demo/playground"));

