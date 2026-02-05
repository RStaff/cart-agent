import express from "express";
import cors from "cors";

const app = express();

// --- Abando deploy fingerprint (v1) ---
app.get("/api/version", (_req, res) => {
  res.json({
    ok: true,
    service: "cart-agent-api",
    git: "f93cf92",
    built_at_utc: "2026-02-05T00:56:13.096Z"
  });
});

// --- Abando embedded check (v1) ---
app.get("/api/embedded-check", (req, res) => {
  const hasBearer = Boolean(req.get("authorization") || "").includes("Bearer ");
  res.json({ ok: true, hasBearer, ts: Date.now() });
});
// --- end fingerprint + embedded-check ---
app.use(cors());
app.use(express.json());

app.get("/api/analytics", (req, res) => {
  res.json({ recoveryRate: 8.5, sentEmails: 5, recoveredRevenue: 8.4 });
});

app.post("/api/generate-copy", (req, res) => {
  res.json({
    subject: "Mock Recovery Copy",
    body: "Hey! Looks like you left something in your cart. Come back for 10% off!",
    totalComputed: 42.5,
    itemsNormalized: [{ title: "Mock Product", quantity: 1, unitPrice: 42.5 }]
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
