#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..", "..");
const offersPath = resolve(repoRoot, ".tmp/payment_offers.json");

export async function getLatestPaymentLink() {
  try {
    const raw = await readFile(offersPath, "utf8");
    const offers = JSON.parse(raw);
    if (!Array.isArray(offers)) return null;

    const latest = offers
      .filter(
        (offer) =>
          offer &&
          offer.status === "payment_ready" &&
          typeof offer.paymentUrl === "string" &&
          offer.paymentUrl.startsWith("https://"),
      )
      .sort((left, right) => {
        const leftTime = Date.parse(left?.createdAt || "") || 0;
        const rightTime = Date.parse(right?.createdAt || "") || 0;
        return rightTime - leftTime;
      })[0];

    return latest?.paymentUrl || null;
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function main() {
  const paymentUrl = await getLatestPaymentLink();
  if (paymentUrl) {
    console.log(paymentUrl);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error("[latest-payment-link] fatal:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
