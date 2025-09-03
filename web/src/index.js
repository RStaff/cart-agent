import express from "express";
import ops from "./routes/ops.js";
import abandonRouter from "./routes/abandon.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Mount ops + carts routes
app.use(ops);
app.use("/api/carts", abandonRouter);

// Health check (already exists in /ops, but duplicate is fine)
app.get("/healthz", (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || "development", time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[web] server listening on port ${PORT}`);
});
