import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import cors from "cors";
import express from "express";
const PORT = process.env.PORT || 3000;
import ops from "./routes/ops.js";
import { abandonRouter } from "./routes/abandon.js";
import { prisma } from "./db.js";

import previewRoutes from "./routes/preview.js";

import previewPage from "./routes/previewPage.js";

const app = express();
app.use(express.static(new URL("../public", import.meta.url).pathname));

app.use(cors({
  origin: [
    /^https?:\/\/localhost(:\d+)?$/,
    /^https?:\/\/.*\.abando\.ai$/
  ],
  methods: ["GET","POST","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
  credentials: false,
}));


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

app.use("/", previewPage);
app.use("/api", previewRoutes);
app.listen(PORT, () => {
  console.log(JSON.stringify({
    level: 30,
    msg: "[web] server listening",
    port: Number(PORT),
    env: process.env.NODE_ENV || "development"
  }));
});

export default app;
