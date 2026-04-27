import { existsSync, readFileSync, writeFileSync } from "node:fs";

const APPROVAL_QUEUE = "staffordos/leads/approval_queue_v1.json";
const LEDGER = "staffordos/leads/send_ledger_v1.json";
const LOG = "staffordos/leads/send_ledger_log_v1.json";

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return fallback; }
}

function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
}

const approvalQueue = readJson(APPROVAL_QUEUE, { version: "approval_queue_v1", items: [] });
const approvals = Array.isArray(approvalQueue.items) ? approvalQueue.items : [];

const ledger = readJson(LEDGER, { version: "send_ledger_v1", items: [] });
ledger.version = "send_ledger_v1";
ledger.items = Array.isArray(ledger.items) ? ledger.items : [];

const log = readJson(LOG, []);

let created = 0;

for (const item of approvals) {
  const eligible = item.status === "approved" && item.stage === "send_ready";
  if (!eligible) continue;

  const ledgerId = `send_${item.id}`;
  const exists = ledger.items.some((entry) => entry.id === ledgerId);

  if (exists) continue;

  ledger.items.push({
    id: ledgerId,
    approval_id: item.id,
    status: "pending_send",
    stage: "queued",
    domain: item.domain,
    email: item.email || "",
    channel: item.channel || "email",
    subject: item.subject,
    body: item.body,
    source_queue: APPROVAL_QUEUE,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  item.stage = "ledgered";
  item.ledger_id = ledgerId;
  item.updated_at = new Date().toISOString();

  created += 1;
}

writeJson(APPROVAL_QUEUE, { version: "approval_queue_v1", items: approvals });
writeJson(LEDGER, ledger);

log.push({
  agent: "send_ledger_agent_v1",
  pending_send_created: created,
  at: new Date().toISOString()
});
writeJson(LOG, log);

console.log(JSON.stringify({
  ok: true,
  agent: "send_ledger_agent_v1",
  pending_send_created: created
}, null, 2));
