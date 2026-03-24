#!/usr/bin/env node

import { appendMessage, loadLeads, saveLeads } from "./pipeline_manager.mjs";
import { buildFollowUpMessage } from "./generate_outreach_messages.mjs";

const DAY_MS = 24 * 60 * 60 * 1000;

function olderThan24Hours(iso) {
  const timestamp = new Date(iso || 0).getTime();
  if (Number.isNaN(timestamp)) return true;
  return Date.now() - timestamp > DAY_MS;
}

async function main() {
  const leads = await loadLeads();
  const due = leads.filter((lead) => lead.status === "contacted" && olderThan24Hours(lead.lastUpdated));

  for (let index = 0; index < due.length; index += 1) {
    const lead = due[index];
    const message = buildFollowUpMessage(lead.name, lead.problem, index);
    await appendMessage(lead.id, "followup", message);
  }

  const refreshed = await loadLeads();
  const updated = refreshed.filter((lead) => due.some((item) => item.id === lead.id));
  await saveLeads(refreshed);

  console.table(
    updated.map((lead) => ({
      name: lead.name,
      status: lead.status,
      lastUpdated: lead.lastUpdated,
    })),
  );

  console.log(`\nGenerated ${updated.length} follow-ups`);
}

main().catch((error) => {
  console.error("[followups] fatal:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
