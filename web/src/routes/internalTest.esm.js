import express from "express";
import { internalOnly } from "../middleware/internalOnly.js";
import { prisma } from "../clients/prisma.js";
import { processCheckoutRiskPayload, normalizeShopDomain } from "./checkoutSignals.esm.js";
import { processOrdersPaidPayload } from "./orderWebhook.esm.js";
import { getInviteById, inviteInspectionSummary } from "./invites.esm.js";

function buildSyntheticItems(itemCount, cartValueCents) {
  const safeCount = Math.max(1, Number(itemCount || 1));
  const safeValue = Math.max(0, Number(cartValueCents || 0));
  const unitValueCents = safeCount > 0 ? Math.max(1, Math.floor(safeValue / safeCount)) : safeValue;

  return Array.from({ length: safeCount }, (_unused, index) => ({
    sku: `TEST-SKU-${index + 1}`,
    qty: 1,
    price: (unitValueCents / 100).toFixed(2),
  }));
}

async function upsertSyntheticAbandonedCart({
  shopDomain,
  cartToken,
  cartValueCents,
  itemCount,
  createdAt,
  userEmail,
}) {
  const normalizedShopDomain = normalizeShopDomain(shopDomain);
  const safeCartToken = typeof cartToken === "string" && cartToken.trim()
    ? cartToken.trim()
    : `test-cart-${Date.now()}`;
  const safeCartValueCents = Math.max(0, Number(cartValueCents ?? 0));
  const safeItemCount = Math.max(1, Number(itemCount ?? 1));
  const safeCreatedAt = createdAt ? new Date(createdAt) : new Date();

  if (!normalizedShopDomain) {
    throw new Error("shopDomain is required");
  }

  const shop = await prisma.shop.upsert({
    where: { key: normalizedShopDomain },
    create: {
      key: normalizedShopDomain,
      name: normalizedShopDomain.replace(/\.myshopify\.com$/, ""),
      provider: "shopify",
      emailFrom: process.env.DEFAULT_FROM || "sales@abando.ai",
    },
    update: {},
    select: { id: true, key: true },
  });

  const cart = await prisma.cart.upsert({
    where: { cartId: safeCartToken },
    create: {
      cartId: safeCartToken,
      userEmail: userEmail || "proof-buyer@example.com",
      items: buildSyntheticItems(safeItemCount, safeCartValueCents),
      status: "abandoned",
      createdAt: safeCreatedAt,
      shopId: shop.id,
    },
    update: {
      userEmail: userEmail || "proof-buyer@example.com",
      items: buildSyntheticItems(safeItemCount, safeCartValueCents),
      status: "abandoned",
      shopId: shop.id,
    },
    select: { cartId: true, status: true, shopId: true },
  });

  return {
    shop,
    cart,
  };
}

async function readDashboardMetrics(shopDomain) {
  const normalizedShopDomain = normalizeShopDomain(shopDomain);
  if (!normalizedShopDomain) {
    return {
      cartsTotal: 0,
      cartsRecovered: 0,
      emailsSent: 0,
    };
  }

  const shop = await prisma.shop.findUnique({
    where: { key: normalizedShopDomain },
    select: { id: true },
  });

  if (!shop?.id) {
    return {
      cartsTotal: 0,
      cartsRecovered: 0,
      emailsSent: 0,
    };
  }

  const [cartsTotal, cartsRecovered, emailsSent] = await Promise.all([
    prisma.cart.count({
      where: { shopId: shop.id },
    }),
    prisma.cart.count({
      where: {
        shopId: shop.id,
        status: "recovered",
      },
    }),
    prisma.emailQueue.count({
      where: {
        shopId: shop.id,
        status: "sent",
      },
    }),
  ]);

  return {
    cartsTotal,
    cartsRecovered,
    emailsSent,
  };
}

function installInternalTestRoutes(app) {
  const router = express.Router();
  router.use(internalOnly);

  router.post("/create-cart", async (req, res) => {
    const shopDomain = normalizeShopDomain(req.body?.shopDomain);

    if (!shopDomain) {
      return res.status(400).json({ ok: false, error: "shopDomain is required" });
    }

    const { shop, cart } = await upsertSyntheticAbandonedCart({
      shopDomain,
      cartToken: req.body?.cartToken,
      cartValueCents: req.body?.cartValueCents ?? req.body?.cartValue,
      itemCount: req.body?.itemCount,
      createdAt: req.body?.createdAt,
      userEmail: req.body?.userEmail,
    });

    return res.status(200).json({
      ok: true,
      cartToken: cart.cartId,
      shopDomain: shop.key,
      status: cart.status,
    });
  });

  router.post("/trigger-signal", async (req, res) => {
    const shopDomain = normalizeShopDomain(req.body?.shopDomain);
    const cartToken = typeof req.body?.cartToken === "string" ? req.body.cartToken.trim() : "";
    const reason = typeof req.body?.reason === "string" && req.body.reason.trim()
      ? req.body.reason.trim()
      : "idle_45s";

    const result = await processCheckoutRiskPayload({
      shopDomain,
      cartToken,
      reason,
      path: `/checkouts/${cartToken || "unknown-cart"}/information`,
      ts: new Date().toISOString(),
    }, {
      ip: "127.0.0.1",
      userAgent: "internal-test",
      origin: "internal-test",
    });

    if (!result.ok) {
      return res.status(result.status).json({ ok: false, errors: result.errors });
    }

    return res.status(200).json({
      ok: true,
      eventId: result.eventId,
      decision: result.decision,
      ruleId: result.ruleId,
      reason: result.reason,
      recoveryJobId: result.recoveryJobId,
    });
  });

  router.post("/simulate-order", async (req, res) => {
    const shopDomain = normalizeShopDomain(req.body?.shopDomain);
    const cartToken = typeof req.body?.cartToken === "string" ? req.body.cartToken.trim() : "";
    const revenueCents = Math.max(0, Number(req.body?.revenueCents ?? 0));

    const result = await processOrdersPaidPayload({
      id: req.body?.orderId || `test-order-${Date.now()}`,
      cart_token: cartToken,
      checkout_token: req.body?.checkoutToken || `test-checkout-${Date.now()}`,
      total_price: (revenueCents / 100).toFixed(2),
      currency: req.body?.currency || "USD",
      email: req.body?.customerEmail || "proof-buyer@example.com",
      created_at: new Date().toISOString(),
      processed_at: new Date().toISOString(),
      synthetic: true,
    }, {
      shopDomain,
      synthetic: true,
    });

    if (!result.ok) {
      return res.status(result.status).json({ ok: false, error: result.error });
    }

    return res.status(200).json({
      ok: true,
      matched: result.matched,
      cartId: result.cartId,
      status: result.cartStatus,
      simulatedPayload: result.simulatedPayload,
      recoveryPosted: result.recoveryPost?.ok || false,
    });
  });

  router.get("/invite/:inviteId", async (req, res) => {
    const invite = await getInviteById(req.params.inviteId);

    if (!invite) {
      return res.status(404).json({ ok: false, error: "invite_not_found" });
    }

    return res.status(200).json({
      ok: true,
      invite: inviteInspectionSummary(invite),
    });
  });

  app.use("/internal/test", router);
}

export { installInternalTestRoutes, upsertSyntheticAbandonedCart, readDashboardMetrics };
