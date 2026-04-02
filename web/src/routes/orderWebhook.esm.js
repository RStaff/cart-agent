import crypto from "crypto";
import express from "express";
import { prisma } from "../clients/prisma.js";
import { getStaffordosUrl } from "../lib/staffordosUrl.js";
import { persistRecoveryAttributionFromOrder } from "../lib/recoveryAttribution.js";
import fs from "node:fs";
import path from "node:path";

function normalizeShopDomain(raw) {
  if (!raw) return "";
  return String(raw)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0];
}

function verifyShopifyWebhookHmac(req) {
  const hmacHeader = (req.get("X-Shopify-Hmac-Sha256") || "").trim();
  const secret =
    process.env.SHOPIFY_API_SECRET ||
    process.env.SHOPIFY_API_SECRET_KEY ||
    process.env.SHOPIFY_SECRET ||
    "";

  if (!secret || !hmacHeader) return false;

  const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");
  const digest = crypto.createHmac("sha256", secret).update(body).digest("base64");

  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(hmacHeader, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function parseOrderPayload(req) {
  try {
    const raw = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body || "");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function centsFromPrice(raw) {
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? Math.round(numeric * 100) : 0;
}

const CHECKOUT_SIGNAL_CAPTURE_PATH = path.resolve(
  process.cwd(),
  "web",
  "src",
  "data",
  "checkout_signal_capture.json",
);

function readCheckoutSignalCapture() {
  try {
    return JSON.parse(fs.readFileSync(CHECKOUT_SIGNAL_CAPTURE_PATH, "utf8"));
  } catch {
    return [];
  }
}

function deriveAttributionSource({ cart, cartToken }) {
  if (!cart?.id) {
    return "unknown";
  }

  return prisma.emailQueue.findFirst({
    where: {
      cartId: cart.id,
      status: "sent",
    },
    orderBy: { sentAt: "desc" },
    select: { id: true },
  }).then((sentEmail) => {
    if (sentEmail) {
      return "recovery_email";
    }

    const signals = readCheckoutSignalCapture();
    const hasRiskSignal = Array.isArray(signals) && signals.some((event) => {
      return String(event?.cartToken || "") === String(cartToken || "")
        && String(event?.type || "") === "checkout-risk";
    });

    return hasRiskSignal ? "intercept" : "unknown";
  }).catch(() => "unknown");
}

function isSyntheticOrderPayload(payload, reqHeaders = {}) {
  if (reqHeaders.synthetic === true) return true;
  if (payload?.synthetic === true) return true;

  const orderId = String(payload?.id || "");
  const checkoutToken = String(payload?.checkout_token || "");

  return orderId.startsWith("validation-order-")
    || checkoutToken.startsWith("validation-checkout-");
}

async function postRecoveryEvent(payload) {
  const staffordUrl = getStaffordosUrl();

  try {
    const response = await fetch(`${staffordUrl}/abando/recovery-events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(2000),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("[orders-paid] staffordos recovery post failed", {
        status: response.status,
        body,
        shopDomain: payload.shopDomain,
        orderId: payload.orderId,
      });
      return { ok: false, status: response.status };
    }

    const body = await response.json().catch(() => ({}));
    console.log("[orders-paid] staffordos recovery event posted", {
      shopDomain: payload.shopDomain,
      orderId: payload.orderId,
      deduped: Boolean(body?.deduped),
    });

    return { ok: true, body };
  } catch (error) {
    console.error("[orders-paid] staffordos recovery post error", {
      shopDomain: payload.shopDomain,
      orderId: payload.orderId,
      error: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function findCartForRecoveryMatch({
  shopDomain,
  cartToken,
  checkoutToken,
  customerEmail,
}) {
  if (cartToken) {
    const cartByToken = await prisma.cart.findUnique({
      where: { cartId: cartToken },
      select: {
        id: true,
        cartId: true,
        status: true,
        shopId: true,
        userEmail: true,
      },
    });

    if (cartByToken) {
      return cartByToken;
    }
  }

  if (checkoutToken) {
    const cartByCheckoutToken = await prisma.cart.findUnique({
      where: { cartId: checkoutToken },
      select: {
        id: true,
        cartId: true,
        status: true,
        shopId: true,
        userEmail: true,
      },
    });

    if (cartByCheckoutToken) {
      return cartByCheckoutToken;
    }
  }

  if (shopDomain && customerEmail) {
    const fallbackCart = await prisma.cart.findFirst({
      where: {
        userEmail: customerEmail,
        attributedOrderId: null,
        shop: {
          key: shopDomain,
        },
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        cartId: true,
        status: true,
        shopId: true,
        userEmail: true,
      },
    });

    if (fallbackCart) {
      console.log("[orders-webhook] fallback cart match", {
        shopDomain,
        customerEmail,
        cartId: fallbackCart.cartId,
        matchedVia: checkoutToken ? "checkout_or_email_fallback" : "email_fallback",
      });
      return fallbackCart;
    }
  }

  return null;
}

async function processShopifyOrderPayload(payload, reqHeaders = {}) {
  const shopDomain = normalizeShopDomain(
    reqHeaders.shopDomain
    || payload?.shop_domain
    || payload?.domain
  );

  const orderId = payload?.id ? String(payload.id) : "";
  const cartToken = payload?.cart_token ? String(payload.cart_token) : "";
  const checkoutToken = payload?.checkout_token ? String(payload.checkout_token) : "";
  const revenueCents = centsFromPrice(payload?.total_price);
  const currency = typeof payload?.currency === "string" ? payload.currency : null;
  const customerEmail = typeof payload?.email === "string"
    ? payload.email
    : typeof payload?.customer?.email === "string"
      ? payload.customer.email
      : null;
  const recoveredAt = payload?.processed_at || payload?.created_at || new Date().toISOString();
  const synthetic = isSyntheticOrderPayload(payload, reqHeaders);
  const webhookTopic = String(reqHeaders.topic || "orders/paid");
  const recoverySource = String(
    reqHeaders.recoverySource
    || (webhookTopic === "orders/create" ? "shopify_orders_create_webhook_dev" : "shopify_orders_paid_webhook"),
  );

  console.log("[orders-webhook] received", {
    topic: webhookTopic,
    shopDomain,
    orderId,
    cartToken,
    checkoutToken,
    revenueCents,
    currency,
    customerEmail,
    recoveredAt,
    synthetic,
  });

  if (!shopDomain || !orderId) {
    return {
      ok: false,
      status: 400,
      error: "shopDomain and order id are required",
    };
  }

  const cart = await findCartForRecoveryMatch({
    shopDomain,
    cartToken,
    checkoutToken,
    customerEmail,
  });

  if (!cart) {
    console.log("[orders-webhook] no abandoned cart match found", {
      topic: webhookTopic,
      shopDomain,
      orderId,
      cartToken,
      checkoutToken,
      customerEmail,
    });
    return {
      ok: true,
      status: 200,
      matched: false,
    };
  }

  let recoveredCart = cart;
  if (String(cart.status || "").toLowerCase() !== "recovered") {
    recoveredCart = await prisma.cart.update({
      where: { id: cart.id },
      data: { status: "recovered" },
      select: {
        id: true,
        cartId: true,
        status: true,
        shopId: true,
        userEmail: true,
      },
    });

    console.log("[orders-webhook] cart marked recovered", {
      topic: webhookTopic,
      cartId: recoveredCart.cartId,
      shopDomain,
      orderId,
    });
  } else {
    console.log("[orders-webhook] cart already recovered", {
      topic: webhookTopic,
      cartId: cart.cartId,
      shopDomain,
      orderId,
    });
  }

  const attributionSource = await deriveAttributionSource({
    cart: recoveredCart,
    cartToken,
  });

  recoveredCart = await prisma.cart.update({
    where: { id: recoveredCart.id },
    data: {
      attributedOrderId: orderId,
      attributedOrderValueCents: revenueCents,
      attributedShopDomain: shopDomain,
      attributedSource: attributionSource,
      attributedCurrency: currency,
      attributionMatchedAt: new Date(recoveredAt),
      attributionIsSynthetic: synthetic,
    },
    select: {
      id: true,
      cartId: true,
      status: true,
      shopId: true,
      userEmail: true,
      attributedOrderId: true,
      attributedOrderValueCents: true,
      attributedShopDomain: true,
      attributedSource: true,
      attributedCurrency: true,
      attributionMatchedAt: true,
      attributionIsSynthetic: true,
    },
  });

  const recoveryPost = synthetic
    ? { ok: false, skipped: true, reason: "synthetic_validation_order" }
    : await postRecoveryEvent({
        shopDomain,
        orderId,
        cartToken,
        checkoutId: checkoutToken || null,
        cartId: cartToken,
        revenueCents,
        cartValueCents: revenueCents,
        recoveredRevenueCents: revenueCents,
        currency,
        recoveredAt,
        detectedAt: recoveredAt,
        customerEmail,
        status: "recovered",
        channel: "shopify",
        source: recoverySource,
      });

  await persistRecoveryAttributionFromOrder(prisma, {
    shop: shopDomain,
    checkout_id: cartToken || recoveredCart.cartId || "",
    checkout_session_id: checkoutToken || "",
    customer_email: customerEmail || recoveredCart.userEmail || "",
    order_id: orderId,
    order_name: typeof payload?.name === "string" ? payload.name : "",
    order_created_at: recoveredAt,
    order_total_price_cents: revenueCents,
    currency,
    source_of_proof: synthetic ? "synthetic_validation_order" : "verified_shopify_order",
    synthetic,
  }).catch((error) => {
    console.error("[orders-webhook] recovery attribution persist failed", {
      topic: webhookTopic,
      shopDomain,
      orderId,
      error: error instanceof Error ? error.message : String(error),
    });
  });

  return {
    ok: true,
    status: 200,
    matched: true,
    cartId: recoveredCart.cartId,
    cartStatus: recoveredCart.status,
    attribution: {
      orderId: recoveredCart.attributedOrderId,
      orderValueCents: recoveredCart.attributedOrderValueCents,
      cartToken: recoveredCart.cartId,
      shopDomain: recoveredCart.attributedShopDomain,
      source: recoveredCart.attributedSource || "unknown",
      matchedAt: recoveredCart.attributionMatchedAt,
      isSynthetic: recoveredCart.attributionIsSynthetic,
      currency: recoveredCart.attributedCurrency,
    },
    recoveryPost,
    simulatedPayload: {
      shopDomain,
      orderId,
      cartToken,
      checkoutToken,
      revenueCents,
      currency,
      customerEmail,
      recoveredAt,
    },
  };
}

async function processOrdersPaidPayload(payload, reqHeaders = {}) {
  return processShopifyOrderPayload(payload, {
    ...reqHeaders,
    topic: "orders/paid",
    recoverySource: "shopify_orders_paid_webhook",
  });
}

async function processOrdersCreatePayload(payload, reqHeaders = {}) {
  return processShopifyOrderPayload(payload, {
    ...reqHeaders,
    topic: "orders/create",
    recoverySource: "shopify_orders_create_webhook_dev",
  });
}

function installOrderWebhook(app) {
  app.post("/api/webhooks/orders/paid", express.raw({ type: "*/*", limit: "256kb" }), async (req, res) => {
    if (!verifyShopifyWebhookHmac(req)) {
      console.warn("[orders-paid] invalid webhook hmac");
      return res.status(401).send("Unauthorized");
    }

    const payload = parseOrderPayload(req);
    const result = await processOrdersPaidPayload(payload, {
      shopDomain: req.get("X-Shopify-Shop-Domain"),
    });

    if (!result.ok) {
      return res.status(result.status).json({
        ok: false,
        error: result.error,
      });
    }

    return res.status(result.status).json({
      ok: true,
      matched: result.matched,
      cartId: result.cartId,
      status: result.cartStatus,
    });
  });

  app.post("/api/webhooks/orders/create", express.raw({ type: "*/*", limit: "256kb" }), async (req, res) => {
    if (!verifyShopifyWebhookHmac(req)) {
      console.warn("[orders-create] invalid webhook hmac");
      return res.status(401).send("Unauthorized");
    }

    const payload = parseOrderPayload(req);
    const result = await processOrdersCreatePayload(payload, {
      shopDomain: req.get("X-Shopify-Shop-Domain"),
    });

    if (!result.ok) {
      return res.status(result.status).json({
        ok: false,
        error: result.error,
      });
    }

    return res.status(result.status).json({
      ok: true,
      matched: result.matched,
      cartId: result.cartId,
      status: result.cartStatus,
      source: "shopify_orders_create_webhook_dev",
    });
  });
}

export { installOrderWebhook, processOrdersCreatePayload, processOrdersPaidPayload };
