// _hardening.js — security/perf + health + graceful
module.exports.installHardening = function(app) {
  try {
    const compression = require("compression");
    const helmet = require("helmet");
    const rateLimit = require("express-rate-limit");
    const cors = require("cors");
    app.set("trust proxy", 1);
    app.use(compression());
    app.use(helmet({ contentSecurityPolicy: false }));
    const allow = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map(s=>s.trim()).filter(Boolean)
      : "*";
    app.use(cors({ origin: allow }));
    app.use(rateLimit({ windowMs: 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false }));
    app.get("/healthz", (_req,res)=>res.status(200).json({ok:true}));
    app.get("/readyz", (_req,res)=>res.status(200).json({ready:true}));
    const REQUIRED = (process.env.REQUIRED_ENV_VARS || "").split(",").map(s=>s.trim()).filter(Boolean);
    app.get("/api/env-check", (_req,res)=>{
      const missing = REQUIRED.filter(k => !(k in process.env) || String(process.env[k])==="");
      res.json({ ok: missing.length===0, missing });
    });
    process.on("SIGTERM", ()=>{ try { app.emit("beforeShutdown"); } catch{} process.exit(0); });
  } catch (e) {
    console.warn("[hardening] non-fatal:", e && e.message || e);
  }
};
