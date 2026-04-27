import fs from "node:fs";
import { generatePaymentSuggestionMessage } from "../outreach/generateMessage.js";

const QUEUE = "staffordos/leads/outreach_queue.json";
const LOG = "staffordos/leads/message_generation_log_v1.json";

function readJson(path, fallback) {
  try { return JSON.parse(fs.readFileSync(path, "utf8")); } catch { return fallback; }
}
function writeJson(path, value) {
  fs.writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
}

const queue = readJson(QUEUE, []);
const log = readJson(LOG, []);

let updated = 0;

for (const lead of queue) {
  if (!lead.subject || !lead.body) {
    const generated = generatePaymentSuggestionMessage({
      lead,
      checkoutUrl: lead.audit_link || lead.experience_link || ""
    });

    lead.subject = generated.subject || lead.subject || "Quick idea for recovering missed checkout revenue";
    lead.body = generated.body || lead.body || generated.message || [
      `Hi — I noticed ${lead.domain} may be leaving checkout recovery revenue on the table.`,
      "",
      "I built ShopiFixer to surface checkout leaks and point merchants toward the fastest recovery opportunities.",
      "",
      `Here is the audit link: ${lead.audit_link || ""}`,
      "",
      "If helpful, I can send over the quick findings."
    ].join("\n");
    lead.status = lead.status || "message_generated";
    lead.updated_at = new Date().toISOString();
    updated += 1;
  }
}

writeJson(QUEUE, queue);
log.push({ agent: "message_generation_agent_v1", updated, at: new Date().toISOString() });
writeJson(LOG, log);

console.log(JSON.stringify({ ok: true, agent: "message_generation_agent_v1", updated }, null, 2));
