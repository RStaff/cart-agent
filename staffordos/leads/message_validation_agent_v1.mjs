import fs from "node:fs";

const QUEUE = "staffordos/leads/outreach_queue.json";
const APPROVAL_QUEUE = "staffordos/leads/approval_queue_v1.json";
const LOG = "staffordos/leads/message_validation_log_v1.json";

function readJson(path, fallback) {
  try { return JSON.parse(fs.readFileSync(path, "utf8")); } catch { return fallback; }
}
function writeJson(path, value) {
  fs.writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
}

const queue = readJson(QUEUE, []);
const approvals = readJson(APPROVAL_QUEUE, []);
const log = readJson(LOG, []);

let created = 0;

for (const lead of queue) {
  const valid = Boolean(lead.domain && lead.subject && lead.body && !lead.sent);
  if (!valid) continue;

  const id = `approval_${String(lead.domain).replace(/[^a-z0-9]/gi, "_")}_${lead.message_type || "outreach"}`;
  const exists = approvals.some((item) => item.id === id);

  lead.validated = true;
  lead.status = lead.approved ? "approved" : "approval_needed";
  lead.updated_at = new Date().toISOString();

  if (!exists && !lead.approved) {
    approvals.push({
      id,
      type: "outreach_message",
      status: "pending_review",
      domain: lead.domain,
      channel: lead.channel || "email",
      subject: lead.subject,
      body: lead.body,
      source_queue: QUEUE,
      created_at: new Date().toISOString()
    });
    created += 1;
  }
}

writeJson(QUEUE, queue);
writeJson(APPROVAL_QUEUE, approvals);
log.push({ agent: "message_validation_agent_v1", approvals_created: created, at: new Date().toISOString() });
writeJson(LOG, log);

console.log(JSON.stringify({ ok: true, agent: "message_validation_agent_v1", approvals_created: created }, null, 2));
