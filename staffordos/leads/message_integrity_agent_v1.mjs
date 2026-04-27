import fs from "node:fs";

const QUEUE = "staffordos/leads/outreach_queue.json";
const LOG = "staffordos/leads/message_integrity_log_v1.json";

function readJson(path, fallback) {
  try { return JSON.parse(fs.readFileSync(path, "utf8")); } catch { return fallback; }
}
function writeJson(path, value) {
  fs.writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
}
function has(value, needle) {
  return String(value || "").toLowerCase().includes(String(needle || "").toLowerCase());
}

function inspectLead(lead) {
  const issues = [];

  if (!lead.domain) issues.push("missing_domain");
  if (!lead.subject) issues.push("missing_subject");
  if (!lead.body) issues.push("missing_body");
  if (!lead.audit_link) issues.push("missing_audit_link");
  if (lead.audit_link && !has(lead.body, lead.audit_link)) issues.push("body_missing_audit_link");
  if (lead.message_type === "shopifixer_audit_invite" && !has(lead.body, "ShopiFixer")) issues.push("missing_shopifixer_brand");
  if (lead.message_type === "shopifixer_audit_invite" && !has(lead.body, "Stafford Media")) issues.push("missing_stafford_media_brand");
  if (lead.message_type === "shopifixer_audit_invite" && has(lead.body, "Abando")) issues.push("abando_brand_drift");
  if (lead.sent === true) issues.push("already_sent");

  return {
    status: issues.length ? "fail" : "pass",
    score: Math.max(0, 100 - issues.length * 20),
    issues
  };
}

const queue = readJson(QUEUE, []);
const log = readJson(LOG, []);

let checked = 0;
let passed = 0;
let failed = 0;

for (const lead of queue) {
  if (!lead.subject && !lead.body) continue;

  const result = inspectLead(lead);
  lead.integrity_status = result.status;
  lead.integrity_score = result.score;
  lead.integrity_issues = result.issues;
  lead.integrity_checked_at = new Date().toISOString();

  checked += 1;
  if (result.status === "pass") passed += 1;
  else failed += 1;
}

writeJson(QUEUE, queue);
log.push({ agent: "message_integrity_agent_v1", checked, passed, failed, at: new Date().toISOString() });
writeJson(LOG, log);

console.log(JSON.stringify({ ok: true, agent: "message_integrity_agent_v1", checked, passed, failed }, null, 2));
