import { sendRecoveryEmail } from "./lib/mailer.js";
import "./_dotenv.js";
import "dotenv/config";
console.log("[boot] DATABASE_URL:", process.env.DATABASE_URL);
import express from "express";
import { PrismaClient } from "@prisma/client";
import { composeRecovery } from "./lib/composeRecoveryMessage.js";

const prisma = new PrismaClient();
const app = express();

// Parse JSON
app.use(express.json());

/** Abandoned-Cart webhook receiver */
app.post("/api/abandoned-cart", async (req, res) => {
  console.log("[abandoned-cart] got body:", JSON.stringify(req.body));

  try {
    const { checkoutId, email, lineItems, totalPrice } = req.body;

    // Persist the cart
    const record = await prisma.abandonedCart.create({
      data: {
        checkoutId: String(checkoutId || ""),
        email: String(email || ""),
        lineItems: lineItems ?? [],
        totalPrice: Number(totalPrice || 0),
      },
    });
    console.log("[abandoned-cart] saved:", record);
    try {
      const msg = await composeRecovery({
        name: record.email.split("@")[0] || "friend",
        items: (record.lineItems || []).map(li => li.title),
        total: record.totalPrice || 0
      });
      console.log("✉️  Recovery message:\n", msg);
      const subj = (typeof msg === "object" && msg.subject) ? msg.subject : ("Complete your order");
      const body = (typeof msg === "object" && msg.body) ? msg.body : (typeof msg === "string" ? msg : "Finish checking out—your items are waiting.");
      const { previewUrl } = await withRetry(() => sendRecoveryEmail({ to: record.email, subject: subj, text: body }));
      console.log("📬 Email preview:", previewUrl || "(none)");
    } catch (e) {
      console.error("Post-save compose/send failed:", e);
    }
    try {
      const msg = await composeRecovery({
        name: record.email.split("@")[0] || "friend",
        items: (record.lineItems || []).map(li => li.title),
        total: record.totalPrice || 0
      });
      console.log("✉️  Recovery message:\n", msg);
      const subj = (typeof msg === "object" && msg.subject) ? msg.subject : ("Complete your order");
      const body = (typeof msg === "object" && msg.body) ? msg.body : (typeof msg === "string" ? msg : "Finish checking out—your items are waiting.");
      const { previewUrl } = await withRetry(() => sendRecoveryEmail({ to: record.email, subject: subj, text: body }));
      console.log("📬 Email preview:", previewUrl || "(none)");
    } catch (e) {
      console.error("Post-save compose/send failed:", e);
    }
  (async () => {
    try {
      const msg = await composeRecovery({
        name: record.email,
        items: (record.lineItems || []).map(i => i.title),
        total: record.totalPrice,
      });
      console.log("✉️  Recovery message:\n Subject:", msg.subject, "\n Body:", msg.body);
      const delivery = await withRetry(() => sendRecoveryEmail({ to: record.email, subject: msg.subject, body: msg.body }));
      console.log("📬 Email queued:", delivery);
    } catch (e) {
      console.error("Post-save compose/send failed:", e);
    }
  })();

    // Generate a recovery message (non-blocking for Shopify, but we await here to see logs)
    try {
      const recoveryMessage = await composeRecovery({
        name: (email || "").split("@")[0],
        items: (lineItems || []).map((li) => li?.title).filter(Boolean),
        total: Number(totalPrice || 0),
      });
      console.log("✉️ Recovery message:\n", recoveryMessage);
    } catch (aiErr) {
      console.error("AI compose error:", aiErr?.message || aiErr);
    }

    return res.status(201).json(record);
  } catch (e) {
    console.error("❌ [abandoned-cart] error saving:", e?.message || e);
    if (e?.stack) console.error(e.stack);
    return res.status(500).send("Internal Server Error");
  }
});

// Export for Shopify CLI
export default app;

// If run directly (for local curl tests), listen on a local port.
const runDirect =
  process.argv[1] && (process.argv[1].endsWith("/web/index.js") || process.argv[1].endsWith("\\web\\index.js"));
if (runDirect) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`[local] webhook receiver listening at http://localhost:${PORT}`);
  });
}

// --- Lightweight retry helper (3 tries, 500ms backoff) ---
async function withRetry(fn, attempts = 3, baseMs = 500) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); } catch (e) {
      lastErr = e;
      const wait = baseMs * Math.pow(2, i);
      console.warn(`[retry] attempt ${i+1} failed: ${e.message}. Waiting ${wait}ms…`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
  throw lastErr;
}


// Simple metrics endpoint (clean)
app.get("/api/metrics", async (_req, res) => {
  try {
    const total = await prisma.abandonedCart.count();
    const sevenDaysAgo = new Date(Date.now() - 7*24*60*60*1000);
    const last7 = await prisma.abandonedCart.count({
      where: { createdAt: { gte: sevenDaysAgo } }
    });
    res.json({ total, last7Days: last7 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Recent carts for dashboard
app.get("/api/carts/recent", async (_req, res) => {
  try {
    const rows = await prisma.abandonedCart.findMany({
      orderBy: { createdAt: "desc" },
      take: 50
    });
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
// --- Health check ---
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});
// --- Recent carts for dashboard ---
app.get("/api/carts/recent", async (_req, res) => {
  try {
    const rows = await prisma.abandonedCart.findMany({
      orderBy: { createdAt: "desc" },
      take: 50
    });
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
