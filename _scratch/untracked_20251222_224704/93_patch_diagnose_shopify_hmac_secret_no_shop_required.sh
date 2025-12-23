#!/usr/bin/env bash
set -euo pipefail

OUT="scripts/90_diagnose_shopify_hmac_secret.sh"

cat <<'SH' > "$OUT"
#!/usr/bin/env bash
set -euo pipefail

# Optional: pass shop domain; if omitted we'll auto-pick latest real webhook.
SHOP_ARG="${1:-}"

cd web

node <<'NODE'
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const shopArg = (process.env.SHOP_ARG || "").trim() || null;

// Candidate secrets (safe output: length + fingerprint only)
const secrets = {
  SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET || null,
  SHOPIFY_API_SECRET_KEY: process.env.SHOPIFY_API_SECRET_KEY || null,
  SHOPIFY_APP_SECRET: process.env.SHOPIFY_APP_SECRET || null,
  SHOPIFY_SECRET: process.env.SHOPIFY_SECRET || null,
};

console.log("🔐 Shopify HMAC Secret Diagnostics (safe)");
console.log("======================================");

for (const [k, v] of Object.entries(secrets)) {
  if (v) {
    const fp = crypto.createHash("sha256").update(v).digest("hex").slice(0, 12);
    console.log(`✔ ${k}: length=${v.length}, fp=${fp}`);
  } else {
    console.log(`✖ ${k}: not set`);
  }
}

// Build where clause: must look like a real Shopify delivery
const baseWhere = {
  bytes: { gt: 1000 },
  headers: { path: ["x-shopify-hmac-sha256"], not: null },
};

const where = shopArg ? { ...baseWhere, shop: shopArg } : baseWhere;

const row = await prisma.abandoWebhookEvent.findFirst({
  where,
  orderBy: { receivedAt: "desc" },
  select: { id:true, shop:true, topic:true, bytes:true, receivedAt:true, headers:true, rawBody:true },
});

if (!row) {
  console.log("\n❌ No qualifying real Shopify webhook found.");
  if (shopArg) console.log("   (Tried filtering by shop=" + shopArg + ")");
  console.log("   Tip: trigger again via tunnel, then re-run this script.");
  await prisma.$disconnect();
  process.exit(0);
}

const raw = Buffer.from(row.rawBody || "");
const headerHmac = String(row.headers?.["x-shopify-hmac-sha256"] || "").trim();

console.log("\n📦 Using webhook event:");
console.log({
  id: row.id,
  shop: row.shop,
  topic: row.topic,
  bytes: row.bytes,
  receivedAt: row.receivedAt,
  has_hmac_header: Boolean(headerHmac),
  hmacHeaderFp: headerHmac
    ? crypto.createHash("sha256").update(headerHmac).digest("hex").slice(0, 12)
    : null,
});

if (!headerHmac) {
  console.log("\n❌ Selected row has no HMAC header (unexpected).");
  await prisma.$disconnect();
  process.exit(0);
}

// Verify each secret against payload
console.log("\n🧪 Verifying secrets against this payload:");
let any = false;

for (const [k, v] of Object.entries(secrets)) {
  if (!v) continue;

  const digest = crypto.createHmac("sha256", v).update(raw).digest("base64");

  const a = Buffer.from(digest, "base64");
  const b = Buffer.from(headerHmac, "base64");
  const ok = (a.length === b.length) && crypto.timingSafeEqual(a, b);

  console.log(`- ${k}: match=${ok}`);
  if (ok) any = true;
}

if (!any) {
  console.log("\n🚨 RESULT: No secret matched.");
  console.log("Most likely: your local .env secret is NOT the Shopify app API secret key.");
  console.log("Action: copy the app's API secret key from your Shopify Partner dashboard into SHOPIFY_API_SECRET (or whichever var your code uses).");
} else {
  console.log("\n✅ RESULT: At least one secret matched. Use that variable as the canonical secret.");
}

await prisma.$disconnect();
NODE
SH

chmod +x "$OUT"
echo "✅ Rewrote: $OUT (auto-picks latest real webhook if no shop passed)"
