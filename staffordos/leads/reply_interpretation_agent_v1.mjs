import { existsSync, readFileSync, writeFileSync } from "node:fs";

const LEDGER = "staffordos/leads/send_ledger_v1.json";
const INTERPRETATION = "staffordos/leads/reply_interpretation_v1.json";
const LOG = "staffordos/leads/reply_interpretation_log_v1.json";

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return fallback; }
}

function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
}

function recommendedAction(replyType) {
  if (replyType === "interested") return "draft_positive_next_step";
  if (replyType === "pricing_objection") return "draft_value_clarification";
  if (replyType === "delay") return "draft_light_followup";
  if (replyType === "unsubscribe") return "stop_contact";
  if (replyType === "not_interested") return "stop_contact";
  return "draft_clarifying_response";
}

const ledger = readJson(LEDGER, { version: "send_ledger_v1", items: [] });
ledger.items = Array.isArray(ledger.items) ? ledger.items : [];

const interpretation = readJson(INTERPRETATION, { version: "reply_interpretation_v1", items: [] });
interpretation.version = "reply_interpretation_v1";
interpretation.items = Array.isArray(interpretation.items) ? interpretation.items : [];

const log = readJson(LOG, []);
let interpreted = 0;

for (const item of ledger.items) {
  if (!item.reply_detected || item.reply_status !== "detected") continue;

  const id = `reply_${item.id}`;
  if (interpretation.items.some(x => x.id === id)) continue;

  const action = recommendedAction(item.reply_type);

  interpretation.items.push({
    id,
    ledger_id: item.id,
    approval_id: item.approval_id || "",
    domain: item.domain,
    email: item.email || "",
    reply_text: item.reply_text || item.replyText || "",
    reply_type: item.reply_type || "unclear",
    confidence: item.reply_confidence || 0,
    intent_summary: item.reply_intent_summary || "",
    recommended_action: action,
    status: action === "stop_contact" ? "closed_no_response" : "interpreted",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  item.reply_interpreted = true;
  item.reply_interpreted_at = new Date().toISOString();
  item.updated_at = new Date().toISOString();
  interpreted += 1;
}

writeJson(LEDGER, ledger);
writeJson(INTERPRETATION, interpretation);
log.push({ agent: "reply_interpretation_agent_v1", interpreted, at: new Date().toISOString() });
writeJson(LOG, log);

console.log(JSON.stringify({ ok: true, agent: "reply_interpretation_agent_v1", interpreted }, null, 2));
