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



/* === AI rewrite proxy (OpenAI) === */
app.post("/api/ai/rewrite", express.json(), async (req,res) => {
  try {
    const { prompt, base, persona } = req.body || {};
    const personaStyle = persona === 'kevin'   ? "concise, high-energy, humorous (Kevin Hart vibe)."
                      : persona === 'beyonce' ? "empowering, elegant, confident (Beyoncé vibe)."
                      : persona === 'taylor'  ? "friendly, witty, warm (Taylor Swift vibe)."
                      : "on-brand, helpful, conversion-focused.";
    const sys = "You are a cart recovery copywriter. Keep messages brief, plain, and conversion-focused. Avoid over-promising. One clear CTA. Keep it brand-safe and non-infringing.";
    const user = `Rewrite this cart-recovery message in a ${personaStyle} tone. Do not claim to be the celebrity or imply endorsement.\n\n${base}\n\nExtra guidance: ${prompt || "make it punchy, friendly, and high-converting"}`;
    const key = process.env.OPENAI_API_KEY;
    if (!key) return res.status(200).json({ text: base, note: "OPENAI_API_KEY missing: returning base" }); // non-breaking fallback
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method:"POST",
      headers:{ "Authorization":"Bearer "+key, "Content-Type":"application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.65,
        messages: [{role:"system", content:sys},{role:"user", content:user}]
      })
    });
    const j = await r.json();
    const text = j?.choices?.[0]?.message?.content?.trim();
    res.status(200).json({ text: text || base });
  } catch (e) {
    res.status(200).json({ text: (req.body?.base || ''), note: "rewrite error: "+String(e) });
  }
});



/* === best-effort DB warmup with retry === */
async function waitForDB(max=12, delayMs=2500){
  try{
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    for (let i=1;i<=max;i++){
      try { await prisma.$queryRaw`SELECT 1`; console.log("[db] ready on attempt", i); break; }
      catch(e){ console.warn("[db] not ready (attempt", i, "of", max+"):", String(e)); if (i===max) { console.warn("[db] continuing without DB"); } await new Promise(r=>setTimeout(r,delayMs)); }
    }
    await prisma.$disconnect().catch(()=>{});
  } catch { console.log("[db] prisma not present; skipping warmup"); }
}
waitForDB().catch(()=>{});


/* === demo stats endpoint === */
app.get("/api/stats/demo", (req,res)=>{
  const seedStr = (req.query.seed || "abando") + ":" + new Date().toISOString().slice(0,10);
  let h=2166136261>>>0;
  for (let i=0;i<seedStr.length;i++){ h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619); }
  function rand(){ h += 0x6D2B79F5; let t=Math.imul(h^h>>>15,1|h); t^=t+Math.imul(t^t>>>7,61|t); return ((t^t>>>14)>>>0)/4294967296; }
  const days=7, rev=[], ord=[], ctr=[];
  for(let i=0;i<days;i++){ rev.push(Math.round(900 + rand()*900)); ord.push(Math.max(1, Math.round(8 + rand()*10))); ctr.push(+ (3 + rand()*2).toFixed(1)); }
  const totals={ revenue: rev.reduce((a,b)=>a+b,0), orders: ord.reduce((a,b)=>a+b,0), ctr: ctr[ctr.length-1] };
  res.json({ days, rev, ord, ctr, totals, demo:true });
});
