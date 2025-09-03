import express from "express";
import pino from "pino";
import { abandonRouter } from "./routes/abandon.js"; // direct import so routes mount

const log = pino();
const app = express();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const isRender = !!process.env.RENDER;
const envBanner = isRender ? "Render" : (process.env.NODE_ENV || "local");

// core middleware
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

// health
app.get("/healthz", (_req, res) => {
  res.status(200).json({ ok: true, env: envBanner, time: new Date().toISOString() });
});

// env peek
app.get("/_env", (_req, res) => {
  res.status(200).json({
    env: envBanner,
    node: process.version,
    pid: process.pid,
    databaseUrlSet: Boolean(process.env.DATABASE_URL),
  });
});

// simple landing
app.get("/", (_req, res) => {
  const pay = process.env.PAY_LINK || "#";
  res.type("html").send(`<!doctype html><html><head><meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Cart Agent</title>
  <style>
    :root{--fg:#111;--bg:#fff;--btn:#000;--btnfg:#fff}
    *{box-sizing:border-box} body{margin:40px;font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:var(--fg);background:var(--bg)}
    a.button{display:inline-block;padding:12px 16px;background:var(--btn);color:var(--btnfg);text-decoration:none;border-radius:10px}
    .muted{color:#666}
    code{padding:2px 6px;background:#f3f3f3;border-radius:6px}
  </style>
  </head>
  <body>
    <h1>Cart Agent</h1>
    <p>Automated abandoned-cart outreach with AI product imagery.</p>
    <p><a class="button" href="${pay}" target="_blank" rel="noopener">Start Now</a></p>
    <p class="muted">Quick links: <a href="/healthz">/healthz</a> • <a href="/_env">/_env</a></p>
    <p class="muted">Server: <code>${envBanner}</code> • Node <code>${process.version}</code></p>
  </body></html>`);
});

// mount carts API
app.use("/api/carts", abandonRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Not Found", path: req.originalUrl });
});

// 500
app.use((err, _req, res, _next) => {
  log.error({ err }, "unhandled error");
  res.status(500).json({ error: "Internal Server Error" });
});

// start
app.listen(PORT, () => {
  log.info({ port: PORT, env: envBanner }, "[web] server listening");
});

// shutdown
process.on("SIGTERM", () => { log.info("SIGTERM received"); process.exit(0); });
process.on("SIGINT",  () => { log.info("SIGINT received");  process.exit(0); });
