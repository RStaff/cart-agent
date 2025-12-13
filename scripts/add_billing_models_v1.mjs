#!/usr/bin/env node
import fs from "fs";

const FILE = "web/prisma/schema.prisma";

if (!fs.existsSync(FILE)) {
  console.error("❌ Could not find", FILE);
  process.exit(1);
}

let src = fs.readFileSync(FILE, "utf8");

// If models already exist, bail out safely
if (src.includes("model ShopifyPlan") || src.includes("model ShopifySubscription")) {
  console.log("ℹ️ Billing models already present; leaving schema.prisma untouched.");
  process.exit(0);
}

// --- Models to append at the end of schema.prisma ---
const MODELS = `

/// Billing plans for the Abando Shopify app
model ShopifyPlan {
  id            Int      @id @default(autoincrement())
  /// E.g. "BASIC", "GROWTH", "PRO"
  key           String   @unique
  /// Display name, e.g. "Abando Basic"
  name          String
  /// Price in cents per billing interval (e.g. 2999 for $29.99)
  priceCents    Int
  /// Currency code, e.g. "USD"
  currency      String   @default("USD")
  /// Shopify billing interval, e.g. "EVERY_30_DAYS"
  interval      String   @default("EVERY_30_DAYS")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  subscriptions ShopifySubscription[]
}

/// An active (or cancelled) Shopify billing subscription for a shop
model ShopifySubscription {
  id              Int      @id @default(autoincrement())
  /// my-shop.myshopify.com
  shopDomain      String
  /// Shopify's recurring_application_charge ID or subscription ID
  shopifyChargeId String   @unique

  plan    ShopifyPlan @relation(fields: [planId], references: [id])
  planId  Int

  /// "active", "pending", "cancelled", etc.
  status         String
  trialEndsAt    DateTime?
  activatedAt    DateTime?
  cancelledAt    DateTime?

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
`;

const backupPath = FILE + ".before_billing_models_" + Date.now() + ".prisma";
fs.writeFileSync(backupPath, src, "utf8");

fs.writeFileSync(FILE, src + MODELS, "utf8");

console.log("💾 Backup saved to:", backupPath);
console.log("✅ Appended ShopifyPlan + ShopifySubscription models to schema.prisma.");
