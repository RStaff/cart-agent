import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function newKey() {
  return crypto.randomBytes(24).toString("base64url"); // short, URL-safe
}

async function main() {
  const name = process.env.SEED_SHOP_NAME || "Demo Store";
  const emailFrom = process.env.SEED_EMAIL_FROM || "sales@example.com";
  const apiKey = newKey();

  const shop = await prisma.shop.create({
    data: { name, provider: "generic", apiKey, emailFrom },
  });

  console.log("✔ Created shop:");
  console.log(JSON.stringify({ id: shop.id, name: shop.name, apiKey: shop.apiKey, emailFrom: shop.emailFrom }, null, 2));
}

main().finally(() => prisma.$disconnect());
