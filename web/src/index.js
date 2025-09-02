import express from "express";
import pino from "pino";

const log = pino();
const app = express();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const isRender = !!process.env.RENDER; // Render sets RENDER=true
const envBanner = isRender ? "Render" : (process.env.NODE_ENV || "local");

// basic liveness check for Render
app.get("/healthz", (_req, res) => {
  res.status(200).json({ ok: true, env: envBanner, time: new Date().toISOString() });
});

// optional: quick env indicator for your dashboard
app.get("/_env", (_req, res) => {
  res.status(200).json({
    env: envBanner,
    node: process.version,
    pid: process.pid,
    databaseUrlSet: Boolean(process.env.DATABASE_URL),
  });
});

// TODO: mount your real routes here:
// import { router as api } from "./routes.js"; app.use("/api", api);

app.listen(PORT, () => {
  log.info({ port: PORT, env: envBanner }, "[web] server listening");
});

// graceful shutdown
process.on("SIGTERM", () => { log.info("SIGTERM received"); process.exit(0); });
process.on("SIGINT", () => { log.info("SIGINT received"); process.exit(0); });
