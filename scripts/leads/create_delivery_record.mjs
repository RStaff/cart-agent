#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { loadLeads } from "./pipeline_manager.mjs";

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

export async function createDeliveryRecord(leadId) {
  if (!leadId) {
    throw new Error("Missing required --leadId");
  }

  const leads = await loadLeads();
  const lead = leads.find((item) => item.id === leadId);
  if (!lead) {
    throw new Error(`lead_not_found:${leadId}`);
  }

  const deliveries = await readDeliveries();
  const existing = deliveries.find((item) => item.leadId === leadId);
  if (existing) {
    console.log(`[delivery] existing record found for ${leadId}`);
    return existing;
  }

  const record = {
    deliveryId: `delivery_${leadId}_${Date.now()}`,
    leadId,
    status: "pending",
    createdAt: nowIso(),
    notes: [],
  };

  deliveries.push(record);
  await saveDeliveries(deliveries);

  console.table([
    {
      deliveryId: record.deliveryId,
      leadId: record.leadId,
      status: record.status,
      createdAt: record.createdAt,
    },
  ]);
  console.log(`\nSaved delivery record to ${DELIVERIES_PATH}`);
  return record;
}

async function main() {
  const leadId = parseLeadId(process.argv);
  await createDeliveryRecord(leadId);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error("[delivery] fatal:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
