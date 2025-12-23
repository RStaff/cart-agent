#!/usr/bin/env bash
set -euo pipefail

SHOP="${1:-cart-agent-dev.myshopify.com}"

(cd web && SHOP="$SHOP" node --input-type=module <<'NODE'
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const shop = process.env.SHOP;

const row = await prisma.abandoWebhookEvent.findFirst({
  where: { shop },
  orderBy: { receivedAt: "desc" },
  select: { id:true, shop:true, topic:true, bytes:true, hmacOk:true, receivedAt:true, headers:true },
});

if (!row) {
  console.log("❌ No DB row found for shop=" + shop);
  await prisma.$disconnect();
  process.exit(0);
}

const hdr = row.headers || {};
const hasShopifyTopic = Boolean(hdr["x-shopify-topic"]);
const hasShopifyShop  = Boolean(hdr["x-shopify-shop-domain"]);
const hasShopifyHmac  = Boolean(hdr["x-shopify-hmac-sha256"]);

console.log({
  id: row.id,
  shop: row.shop,
  topic: row.topic,
  bytes: row.bytes,
  hmacOk: row.hmacOk,
  receivedAt: row.receivedAt,
  headerEvidence: {
    has_x_shopify_topic: hasShopifyTopic,
    has_x_shopify_shop_domain: hasShopifyShop,
    has_x_shopify_hmac_sha256: hasShopifyHmac
  }
});

await prisma.$disconnect();
NODE
)
