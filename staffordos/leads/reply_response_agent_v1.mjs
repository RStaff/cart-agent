import { existsSync, readFileSync, writeFileSync } from "node:fs";

const INTERPRETATION = "staffordos/leads/reply_interpretation_v1.json";
const APPROVAL_QUEUE = "staffordos/leads/approval_queue_v1.json";
const LOG = "staffordos/leads/reply_response_log_v1.json";

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return fallback; }
}

function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
}

function draftBody(item) {
  if (item.reply_type === "interested") {
    return `Thanks — I can send over the quick ShopiFixer findings for ${item.domain} and the clearest next fix.`;
  }
  if (item.reply_type === "pricing_objection") {
    return `Totally understand. The goal is not a vague retainer — it is a focused ShopiFixer read on the biggest checkout/revenue leak and the fastest practical fix.`;
  }
  if (item.reply_type === "delay") {
    return `No problem. I can circle back later with a short ShopiFixer summary so you have the findings when timing is better.`;
  }
  return `Thanks for the reply. Can you share the main checkout or conversion issue you want me to look at first?`;
}

const interpretation = readJson(INTERPRETATION, { version: "reply_interpretation_v1", items: [] });
interpretation.items = Array.isArray(interpretation.items) ? interpretation.items : [];

const approvalQueue = readJson(APPROVAL_QUEUE, { version: "approval_queue_v1", items: [] });
approvalQueue.version = "approval_queue_v1";
approvalQueue.items = Array.isArray(approvalQueue.items) ? approvalQueue.items : [];

const log = readJson(LOG, []);
let draftsCreated = 0;

for (const item of interpretation.items) {
  if (item.status !== "interpreted") continue;
  if (item.recommended_action === "stop_contact") continue;

  const approvalId = `approval_response_${String(item.domain || item.id).replace(/[^a-z0-9]/gi, "_")}_${item.reply_type}`;
  if (approvalQueue.items.some(x => x.id === approvalId)) continue;

  approvalQueue.items.push({
    id: approvalId,
    type: "reply_response",
    status: "pending_review",
    domain: item.domain,
    email: item.email || "",
    product: "ShopiFixer",
    message_type: "shopifixer_reply_response",
    subject: `Re: ShopiFixer audit for ${item.domain}`,
    body: draftBody(item),
    validation_status: "reply_response_draft",
    validation_issues: [],
    source_intent: item.reply_type,
    recommended_action: item.recommended_action,
    source_queue: INTERPRETATION,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  item.status = "response_drafted";
  item.response_approval_id = approvalId;
  item.updated_at = new Date().toISOString();
  draftsCreated += 1;
}

writeJson(INTERPRETATION, interpretation);
writeJson(APPROVAL_QUEUE, approvalQueue);
log.push({ agent: "reply_response_agent_v1", drafts_created: draftsCreated, at: new Date().toISOString() });
writeJson(LOG, log);

console.log(JSON.stringify({ ok: true, agent: "reply_response_agent_v1", drafts_created: draftsCreated }, null, 2));
