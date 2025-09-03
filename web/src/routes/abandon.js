import express, { Router } from "express";
import { PrismaClient } from "@prisma/client";
import pino from "pino";

const log = pino();
const prisma = new PrismaClient();

export const abandonRouter = Router();

// Ensure JSON body parsing even if the parent app forgot to add it
abandonRouter.use(express.json({ limit: "1mb" }));

/**
 * Resolve optional shop context:
 * - req.shop.key (Shopify middleware)
 * - header: X-Shop-Key
 * - body:   shopKey
 */
async function resolveShopContext(req) {
  const fromReq = req?.shop?.key;
  const fromHeader = req.get("x-shop-key");
  const fromBody = req.body?.shopKey;
  const shopKey = (fromReq || fromHeader || fromBody || "").trim();

  if (!shopKey) return { shopId: null, shopKey: null };

  const shop = await prisma.shop.upsert({
    where: { key: shopKey },
    create: { key: shopKey },
    update: {},
  });
  return { shopId: shop.id, shopKey: shop.key };
}

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((it) => {
    const sku = typeof it?.sku === "string" ? it.sku : String(it?.sku ?? "");
    const q = Number(it?.qty ?? 0);
    const qty = Number.isFinite(q) && q > 0 ? q : 1;
    const rest = { ...it };
    delete rest.sku;
    delete rest.qty;
    return { sku, qty, ...rest };
  });
}

/** POST /api/carts/ingest  */
abandonRouter.post("/ingest", async (req, res) => {
  try {
    const { cartId, userEmail, items } = req.body || {};
    if (!cartId || !userEmail) {
      return res.status(400).json({ error: "cartId and userEmail required" });
    }

    const { shopId, shopKey } = await resolveShopContext(req);
    const normalizedItems = normalizeItems(items);

    const saved = await prisma.cart.upsert({
      where: { cartId },
      update: { userEmail, items: normalizedItems, ...(shopId ? { shopId } : {}) },
      create: {
        cartId,
        userEmail,
        items: normalizedItems,
        status: "abandoned",
        ...(shopId ? { shopId } : {}),
      },
    });

    log.info({ cartId, shopKey, shopId }, "[cart] saved");
    return res.json({ ok: true, cart: saved });
  } catch (err) {
    log.error({ err }, "failed to ingest cart");
    const details = process.env.NODE_ENV !== "production" ? String(err?.message || err) : undefined;
    return res.status(500).json({ error: "internal", details });
  }
});

/** GET /api/carts  (?shopKey=... | ?shopId=...) */
abandonRouter.get("/", async (req, res) => {
  try {
    const { shopKey, shopId: qShopId } = req.query || {};
    let shopId = qShopId || null;

    if (!shopId && typeof shopKey === "string" && shopKey.trim()) {
      const shop = await prisma.shop.findUnique({ where: { key: shopKey.trim() } });
      if (shop) shopId = shop.id;
    }

    const carts = await prisma.cart.findMany({
      where: shopId ? { shopId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return res.json(carts);
  } catch (err) {
    log.error({ err }, "failed to list carts");
    const details = process.env.NODE_ENV !== "production" ? String(err?.message || err) : undefined;
    return res.status(500).json({ error: "internal", details });
  }
});

/** GET /api/carts/:cartId */
abandonRouter.get("/:cartId", async (req, res) => {
  try {
    const { cartId } = req.params;
    const cart = await prisma.cart.findUnique({ where: { cartId } });
    if (!cart) return res.status(404).json({ error: "not found" });
    return res.json(cart);
  } catch (err) {
    log.error({ err }, "failed to fetch cart");
    const details = process.env.NODE_ENV !== "production" ? String(err?.message || err) : undefined;
    return res.status(500).json({ error: "internal", details });
  }
});
