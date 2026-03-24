#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { loadLeads } from "./pipeline_manager.mjs";

const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..", "..");
process.chdir(repoRoot);

const OFFERS_PATH = ".tmp/payment_offers.json";
const OUTPUT_PATH = ".tmp/payment_ready.json";
const ELIGIBLE_STATUSES = new Set(["contacted", "replied", "qualified"]);

async function readJson(path) {
  try {
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export async function exportPaymentReady() {
  const [offers, leads] = await Promise.all([readJson(OFFERS_PATH), loadLeads()]);
  const leadById = new Map(leads.map((lead) => [lead.id, lead]));

  const records = offers
    .map((offer) => {
      const lead = leadById.get(offer.leadId);
      return {
        leadId: offer.leadId,
        leadName: offer.leadName,
        pipelineStatus: lead?.status || "unknown",
        offerTitle: offer.offerTitle,
        priceUsd: offer.priceUsd,
        shortScope: offer.shortScope,
        paymentUrl: offer.paymentUrl,
        status: offer.status,
        createdAt: offer.createdAt,
      };
    })
    .filter(
      (record) =>
        record.status === "payment_ready" &&
        ELIGIBLE_STATUSES.has(record.pipelineStatus) &&
        typeof record.paymentUrl === "string" &&
        record.paymentUrl.startsWith("https://"),
    )
    .sort((left, right) => {
      const leftTime = Date.parse(left.createdAt || "") || 0;
      const rightTime = Date.parse(right.createdAt || "") || 0;
      return rightTime - leftTime || String(left.leadId).localeCompare(String(right.leadId));
    });

  await mkdir(".tmp", { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(records, null, 2)}\n`, "utf8");

  console.table(
    records.map((record) => ({
      leadId: record.leadId,
      leadName: record.leadName,
      pipelineStatus: record.pipelineStatus,
      priceUsd: record.priceUsd,
      paymentUrl: record.paymentUrl,
    })),
  );
  console.log(`\nSaved ${records.length} payment-ready leads to ${OUTPUT_PATH}`);
  return records;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  exportPaymentReady().catch((error) => {
    console.error("[payment-ready] fatal:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
