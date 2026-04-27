import { existsSync, readFileSync, writeFileSync } from "node:fs";

const LEDGER = "staffordos/leads/send_ledger_v1.json";
const LOG = "staffordos/leads/reply_detection_log_v1.json";

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return fallback; }
}

function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
}

function detectType(text) {
  const lowered = String(text || "").toLowerCase();
  if (!lowered.trim()) return { reply_type: "none", confidence: 0, intent_summary: "No reply text present." };
  if (["unsubscribe", "stop", "remove me", "do not contact"].some(x => lowered.includes(x))) {
    return { reply_type: "unsubscribe", confidence: 0.95, intent_summary: "Lead asked not to be contacted." };
  }
  if (["yes", "interested", "sounds good", "send", "tell me more", "can you help"].some(x => lowered.includes(x))) {
    return { reply_type: "interested", confidence: 0.85, intent_summary: "Lead appears interested." };
  }
  if (["price", "cost", "expensive", "too much"].some(x => lowered.includes(x))) {
    return { reply_type: "pricing_objection", confidence: 0.8, intent_summary: "Lead is raising pricing concern." };
  }
  if (["later", "not now", "circle back", "busy"].some(x => lowered.includes(x))) {
    return { reply_type: "delay", confidence: 0.75, intent_summary: "Lead is delaying action." };
  }
  if (["no thanks", "not interested", "all set", "fixed"].some(x => lowered.includes(x))) {
    return { reply_type: "not_interested", confidence: 0.85, intent_summary: "Lead declined or no longer needs help." };
  }
  return { reply_type: "unclear", confidence: 0.4, intent_summary: "Reply exists but intent is unclear." };
}

const ledger = readJson(LEDGER, { version: "send_ledger_v1", items: [] });
ledger.version = "send_ledger_v1";
ledger.items = Array.isArray(ledger.items) ? ledger.items : [];
const log = readJson(LOG, []);

let checked = 0;
let detected = 0;

for (const item of ledger.items) {
  checked += 1;
  const replyText = String(item.reply_text || item.replyText || "").trim();

  if (!replyText) {
    item.reply_detected = false;
    item.reply_status = item.reply_status || "no_reply";
    continue;
  }

  const result = detectType(replyText);
  item.reply_detected = true;
  item.reply_status = "detected";
  item.reply_type = result.reply_type;
  item.reply_confidence = result.confidence;
  item.reply_intent_summary = result.intent_summary;
  item.reply_detected_at = item.reply_detected_at || new Date().toISOString();
  item.updated_at = new Date().toISOString();
  detected += 1;
}

writeJson(LEDGER, ledger);
log.push({ agent: "reply_detection_agent_v1", checked, detected, at: new Date().toISOString() });
writeJson(LOG, log);

console.log(JSON.stringify({ ok: true, agent: "reply_detection_agent_v1", checked, detected }, null, 2));
