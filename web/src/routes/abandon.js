import express from "express";
import { prisma } from "../db.js";
import { queueAbandonEmail } from "../lib/queue-email.js";

const abandonRouter = express.Router();

/**
 * POST /api/carts/ingest
 * - Accepts { cartId, userEmail, items[], shopKey? } in body
 * - Or provides shopKey via 'x-shop-key' header
 * - Upserts Shop (if shopKey present) and Cart
 * - Queues an email (best-effort) for the cart
 */
abandonRouter.post("/carts/ingest", async (req, res) => {
  const hdrShopKey = req.get("x-shop-key")?.trim();
  const bodyShopKey = req.body?.shopKey?.trim();
  const shopKey = hdrShopKey || bodyShopKey || null;

  const cartId = req.body?.cartId;
  const userEmail = req.body?.userEmail;
  const items = req.body?.items ?? [];

  if (!cartId || !userEmail) {
    return res.status(400).json({ ok: false, error: "invalid_request", details: "cartId and userEmail are required" });
  }

  try {
    // If we have a shopKey, ensure a Shop exists (idempotent upsert by key)
    let shop = null;
    if (shopKey) {
      const provider = shopKey.includes(".myshopify.com") ? "shopify" : "generic";
      shop = await prisma.shop.upsert({
        where: { key: shopKey },
        create: {
          key: shopKey,
          name: provider === "shopify" ? "Demo Shopify Store" : "Demo Store",
          provider,
          apiKey: "seeded-api-key",
          emailFrom: "sales@example.com",
        },
        update: {},
      });
    }

    // Upsert the cart
    const cart = await prisma.cart.upsert({
      where: { cartId },
      create: {
        cartId,
        userEmail,
        items,
        status: "abandoned",
        shopId: shop?.id ?? null,
      },
      update: {
        userEmail,
        items,
        status: "abandoned",
        shopId: shop?.id ?? null,
      },
    });

    // Best-effort: queue an email. Never fail the API if queueing fails.
    try {
      await queueAbandonEmail({ cart, shop });
    } catch (e) {
      console.error("[email-queue] failed", e);
    }

    return res.json({ ok: true, cart });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "internal", details: String(err?.message || err) });
  }
});

/**
 * GET /api/carts
 * Optional: ?shopKey=...
 */
abandonRouter.get("/carts", async (req, res) => {
  const shopKey = req.query.shopKey?.toString().trim();
  try {
    if (shopKey) {
      const shop = await prisma.shop.findUnique({ where: { key: shopKey } });
      if (!shop) return res.json([]);
      const carts = await prisma.cart.findMany({
        where: { shopId: shop.id },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return res.json(carts);
    }
    const carts = await prisma.cart.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return res.json(carts);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "internal", details: String(err?.message || err) });
  }
});

/** GET /api/carts/:cartId */
abandonRouter.get("/carts/:cartId", async (req, res) => {
  const cartId = req.params.cartId;
  try {
    const cart = await prisma.cart.findUnique({ where: { cartId } });
    if (!cart) return res.status(404).json({ ok: false, error: "not_found" });
    return res.json(cart);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "internal", details: String(err?.message || err) });
  }
});

/**
 * (Handy inspector) GET /api/emails?status=queued&limit=10
 * Lets you confirm email queue rows are being created.
 */
abandonRouter.get("/emails", async (req, res) => {
  const status = (req.query.status?.toString() || "queued");
  const limit = Math.min(parseInt(req.query.limit?.toString() || "10", 10) || 10, 100);
  try {
    const emails = await prisma.emailQueue.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    res.json(emails);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "internal", details: String(err?.message || err) });
  }
});

export { abandonRouter }; export default abandonRouter;

// POST /api/emails/:id/requeue   -> set status=queued, runAt=now, attempts unchanged
abandonRouter.post("/emails/:id/requeue", async (req, res) => {
  const id = req.params.id;
  try {
    const updated = await prisma.emailQueue.update({
      where: { id },
      data: { status: "queued", runAt: new Date() },
    });
    res.json({ ok: true, email: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "internal", details: String(err?.message || err) });
  }
});
