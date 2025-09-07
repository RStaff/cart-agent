import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import cors from "cors";
import express from "express";
import ops from "./routes/ops.js";
import { abandonRouter } from "./routes/abandon.js";
import { prisma } from "./db.js";

const app = express();
app.use(cors({
  origin: [/^https?:\/\/localhost(:[0-9]+)?$/, /^https?:\/\/.*\.abando\.ai$/],
  methods: ["POST"],
  allowedHeaders: ["Content-Type"],
}));
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Mount ops + carts routes
app.use(ops);
app.use("/api", abandonRouter);

// Extra liveness (dup of ops)
app.get("/healthz", (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || "development", time: new Date().toISOString() });
});

// Inline readiness — guaranteed present
app.get("/ops/ready", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (err) {
    res.status(503).json({ ok: false, error: "db_unavailable", details: String(err?.message || err) });
  }
});

app.listen(PORT, () => {
  console.log(JSON.stringify({
    level: 30,
    msg: "[web] server listening",
    port: Number(PORT),
    env: process.env.NODE_ENV || "development"
  }));
});

import { registerPreviewRoutes } from "./routes/preview.js";
registerPreviewRoutes(app);
