#!/usr/bin/env node

import { appendMessage, loadLeads } from "./pipeline_manager.mjs";

function offerTarget(problem = "your Shopify dev setup") {
  const value = String(problem || "").trim();
  if (!value) return "your Shopify dev setup";
  if (/issue$/i.test(value)) {
    return `your ${value.replace(/\s+issue$/i, "")} setup`;
  }
  return `your ${value}`;
}

function buildOffer(problem = "your Shopify dev setup") {
  return `I can fix this for you and get ${offerTarget(problem)} stable — usually takes a few hours depending on setup. Happy to take a quick look and give you a clear path.`;
}

async function main() {
  const args = process.argv.slice(2);
  const idIndex = args.indexOf("--id");
  const id = idIndex >= 0 ? args[idIndex + 1] : "";

  if (!id) {
    console.log(buildOffer());
    return;
  }

  const leads = await loadLeads();
  const lead = leads.find((item) => item.id === id);
  if (!lead) {
    throw new Error(`Lead not found: ${id}`);
  }

  const message = buildOffer(lead.problem || "your Shopify dev environment");
  await appendMessage(id, "offer", message);
  console.log(JSON.stringify({ id, name: lead.name, message }, null, 2));
}

main().catch((error) => {
  console.error("[offer] fatal:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
