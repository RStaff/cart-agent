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
app.use("/api/billing", express.json(), billingPublicRouter);
app.use(express.static(join(__dirname,"public"), { redirect: false }));
app.get("/pricing",    (_req,res)=>res.sendFile(join(__dirname,"public","pricing","index.html")));
app.get("/onboarding", (_req,res)=>res.sendFile(join(__dirname,"public","onboarding","index.html")));
app.get("/demo",       (_req,res)=>res.sendFile(join(__dirname,"public","demo","index.html"))); 

// Root route: plain text hinting available endpoints
app.get("/", (_req, res) => res.sendFile(join(__dirname, "public", "index.html")));

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
