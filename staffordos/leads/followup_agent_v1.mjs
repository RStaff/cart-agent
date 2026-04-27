import { existsSync, readFileSync, writeFileSync } from "node:fs";

const LEDGER = "staffordos/leads/send_ledger_v1.json";
const APPROVAL_QUEUE = "staffordos/leads/approval_queue_v1.json";
const LOG = "staffordos/leads/followup_log_v1.json";

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return fallback; }
}

function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
}

function daysSince(value) {
  if (!value) return 999;
  const t = new Date(value).getTime();
  if (!Number.isFinite(t)) return 999;
  return Math.floor((Date.now() - t) / 86400000);
}

function draftFollowup(item) {
  return [
    `Hi — quick follow-up on the ShopiFixer audit for ${item.domain}.`,
    "",
    "The goal is simple: identify the clearest checkout or revenue leak and point to the fastest practical fix.",
    "",
    "Worth taking a quick look?"
  ].join("\n");
}

const ledger = readJson(LEDGER, { version: "send_ledger_v1", items: [] });
ledger.version = "send_ledger_v1";
ledger.items = Array.isArray(ledger.items) ? ledger.items : [];

const approvals = readJson(APPROVAL_QUEUE, { version: "approval_queue_v1", items: [] });
approvals.version = "approval_queue_v1";
approvals.items = Array.isArray(approvals.items) ? approvals.items : [];

const log = readJson(LOG, []);

let checked = 0;
let draftsCreated = 0;

for (const item of ledger.items) {
  checked += 1;

  const eligibleStatus = ["dry_run_ready", "sent"].includes(item.status);
  const hasReply = item.reply_detected === true || item.reply_status === "detected";
  const alreadyFollowed = item.followup_drafted === true;
  const ageDays = daysSince(item.sent_at || item.dry_run_checked_at || item.updated_at || item.created_at);

  if (!eligibleStatus || hasReply || alreadyFollowed || ageDays < 1) continue;

  const approvalId = `approval_followup_${String(item.domain || item.id).replace(/[^a-z0-9]/gi, "_")}`;

  if (approvals.items.some((x) => x.id === approvalId)) {
    item.followup_drafted = true;
    item.followup_approval_id = approvalId;
    item.updated_at = new Date().toISOString();
    continue;
  }

  approvals.items.push({
    id: approvalId,
    type: "followup_message",
    status: "pending_review",
    domain: item.domain,
    email: item.email || "",
    product: "ShopiFixer",
    message_type: "shopifixer_followup",
    subject: `Follow-up: ShopiFixer audit for ${item.domain}`,
    body: draftFollowup(item),
    validation_status: "followup_draft",
    validation_issues: [],
    source_intent: "no_reply_followup",
    recommended_action: "review_followup_before_send",
    source_queue: LEDGER,
    source_ledger_id: item.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  item.followup_drafted = true;
  item.followup_approval_id = approvalId;
  item.followup_drafted_at = new Date().toISOString();
  item.updated_at = new Date().toISOString();
  draftsCreated += 1;
}

writeJson(LEDGER, ledger);
writeJson(APPROVAL_QUEUE, approvals);

log.push({
  agent: "followup_agent_v1",
  checked,
  drafts_created: draftsCreated,
  at: new Date().toISOString()
});
writeJson(LOG, log);

console.log(JSON.stringify({
  ok: true,
  agent: "followup_agent_v1",
  checked,
  drafts_created: draftsCreated
}, null, 2));
