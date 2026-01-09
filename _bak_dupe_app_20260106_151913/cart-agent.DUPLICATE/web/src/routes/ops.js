import express from "express";
import { prisma } from "../db.js";

const router = express.Router();

/** Liveness */
router.get("/healthz", (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || "development", time: new Date().toISOString() });
});

/** Env peek (safe) */
router.get("/_env", (req, res) => {
  res.json({
    env: process.env.NODE_ENV || "development",
    node: process.version,
    pid: process.pid,
    databaseUrlSet: Boolean(process.env.DATABASE_URL),
  });
});

/** Readiness: verify DB */
router.get("/ops/ready", async (req, res) => {
  try {
    // cheap query—works on Postgres
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (err) {
    res.status(503).json({ ok: false, error: "db_unavailable", details: String(err?.message || err) });
  }
});

export default router;
