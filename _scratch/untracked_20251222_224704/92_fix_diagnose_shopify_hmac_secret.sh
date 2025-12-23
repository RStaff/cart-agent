#!/usr/bin/env bash
set -euo pipefail

OUT="scripts/90_diagnose_shopify_hmac_secret.sh"

cat <<'SH' > "$OUT"
#!/usr/bin/env bash
set -euo pipefail

SHOP="${1:-shop.myshopify.com}"

# Prisma client lives in the web workspace
cd web

node <<'NODE'
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const SHOP = process.env.SHOP || null;

const prisma = new PrismaClient();

// Candidate secrets (we only print length + fingerprint)
const secrets = {
  SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET || null,
  SHOPIFY_API_SECRET_KEY: process.env.SHOPIFY_API_SECRET_KEY || null,
  SHOPIFY_APP_SECRET: process.env.SHOPIFY_APP_SECRET || null,
  SHOPIFY_SECRET: process.env.SHOPIFY_SECRET || null,
};

console.log("🔐 Shopify Secret Diagnostics (safe)");
console.log("=================================");

for (const [k, v] of Object.entries(secrets)) {
  if (v) {
    const fp = crypto.createHash("sha256").update(v).digest("hex").slice(0, 12);
    console.log(`✔ ${k}: length=${v.length}, fp=${fp}`);
  } else {
    console.log(`✖ ${k}: not set`);
  }
}

// Pull latest REAL Shopify webhook (big payload + has HMAC header)
const row = await prisma.abandoWebhookEvent.findFirst({
  where: {
    shop: SHOP,
    bytes: { gt: 1000 },
    headers: { path: ["x-shopify-hmac-sha256"], not: null }
  },
  orderBy: { receivedAt: "desc" },
  select: { id:true, shop:true, bytes:true, receivedAt:true, headers:true, rawBody:true },
});

if (!row) {
  console.log("\n❌ No real Shopify webhook found in DB yet for shop=" + SHOP);
  await prisma.$disconnect();
  process.exit(0);
}

const raw = Buffer.from(row.rawBody || "");
const headerHmac = String(row.headers?.["x-shopify-hmac-sha256"] || "").trim();

console.log("\n📦 Latest real webhook:");
console.log({
  id: row.id,
  shop: row.shop,
  bytes: row.bytes,
  receivedAt: row.receivedAt,
  has_hmac_header: Boolean(headerHmac),
  hmacHeaderFp: headerHmac
    ? crypto.createHash("sha256").update(headerHmac).digest("hex").slice(0, 12)
    : null,
});

console.log("\n🧪 Verifying against secrets:");
for (const [k, v] of Object.entries(secrets)) {
  if (!v) continue;
  const digest = crypto.createHmac("sha256", v).update(raw).digest("base64");

  // timingSafeEqual requires equal length buffers
  const a = Buffer.from(digest, "base64");
  const b = Buffer.from(headerHmac, "base64");
  const ok = (a.length === b.length) && crypto.timingSafeEqual(a, b);

  console.log(`- ${k}: match=${ok}`);
}

await prisma.$disconnect();
NODE
SH

chmod +x "$OUT"
echo "✅ Rewrote: $OUT (runs inside ./web so @prisma/client resolves)"
