#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { main as findLeads } from "./find_shopify_dev_leads.mjs";
import { main as generateOutreach } from "./generate_outreach_messages.mjs";
import { loadLeads } from "./pipeline_manager.mjs";
import { main as exportSendReady } from "./export_send_ready.mjs";

async function readArray(path) {
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

export async function main() {
  await findLeads();
  const pipeline = await loadLeads();

  await generateOutreach();
  const outreach = await readArray(".tmp/shopify_outreach.json");

  await exportSendReady();
  const sendReady = await readArray(".tmp/send_ready.json");
  const rawLeads = await readArray(".tmp/shopify_dev_leads.json");

  console.log("\n== Client Machine Summary ==");
  console.log(`Leads found: ${rawLeads.length}`);
  console.log(`Pipeline count: ${pipeline.length}`);
  console.log(`Outreach generated count: ${outreach.length}`);
  console.log(`Send-ready exported count: ${sendReady.length}`);
  console.log("Send-ready path: .tmp/send_ready.json");

  console.table(
    sendReady.map((lead) => ({
      id: lead.id,
      name: lead.name,
      score: lead.score,
      status: lead.status,
      nextAction: lead.nextAction,
      url: lead.url,
    })),
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error("[client-machine] fatal:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
