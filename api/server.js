import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// POST /api/generate-copy
app.post("/api/generate-copy", (req, res) => {
  const { cartId, items = [], totalComputed = 0 } = req.body || {};
  const subject = `Recover your cart ${cartId ? `(${cartId})` : ""}`.trim();
  const body = `Hey! Looks like you left something in your cart. 
Come back for 10% off and finish checkout.`;

  const itemsNormalized = Array.isArray(items)
    ? items.map(it => ({
        title: it?.title ?? "Item",
        quantity: Number(it?.quantity ?? 1),
        unitPrice: Number(it?.unitPrice ?? 0)
      }))
    : [];

  const total = Number(totalComputed || itemsNormalized.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0));

  return res.json({
    subject,
    body,
    totalComputed: total,
    itemsNormalized
  });
});

// GET /api/analytics
app.get("/api/analytics", (_req, res) => {
  return res.json({
    recoveryRate: 8.5,
    sentEmails: 5,
    recoveredRevenue: 8.4
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
