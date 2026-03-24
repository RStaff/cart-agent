#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..", "..");
process.chdir(repoRoot);

const DELIVERIES_PATH = ".tmp/deliveries.json";

function nowIso() {
  return new Date().toISOString();
}

async function readDeliveries() {
  try {
    const raw = await readFile(DELIVERIES_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function saveDeliveries(deliveries) {
  await mkdir(".tmp", { recursive: true });
  await writeFile(DELIVERIES_PATH, `${JSON.stringify(deliveries, null, 2)}\n`, "utf8");
  return deliveries;
}

function parseLeadId(argv) {
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--leadId") {
      return String(argv[index + 1] || "").trim();
    }
  }
  return "";
}

export async function completeDelivery(leadId) {
  if (!leadId) {
    throw new Error("Missing required --leadId");
  }

  const deliveries = await readDeliveries();
  const delivery = deliveries.find((item) => item.leadId === leadId);
  if (!delivery) {
    throw new Error(`delivery_not_found:${leadId}`);
  }

  delivery.status = "completed";
  delivery.notes = Array.isArray(delivery.notes) ? delivery.notes : [];
  delivery.notes.push({
    text: "Delivery marked completed.",
    createdAt: nowIso(),
  });

  await saveDeliveries(deliveries);

  console.table([
    {
      deliveryId: delivery.deliveryId,
      leadId: delivery.leadId,
      status: delivery.status,
    },
  ]);

  console.log(`\nYour Shopify dev setup is now fixed.

If anything comes up again, just reply here and I’ll help you out.`);
  return delivery;
}

async function main() {
  const leadId = parseLeadId(process.argv);
  await completeDelivery(leadId);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error("[delivery-complete] fatal:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
