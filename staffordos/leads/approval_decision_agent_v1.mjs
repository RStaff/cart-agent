import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const QUEUE_PATH = path.join(ROOT, "staffordos/leads/approval_queue_v1.json");

const [, , action, approvalId, note] = process.argv;

function readJson(file, fallback) {
  if (!existsSync(file)) return fallback;
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

if (!action || !approvalId) {
  console.error("Usage: node approval_decision_agent_v1.mjs <approve|reject|hold> <approval_id> [note]");
  process.exit(1);
}

const queue = readJson(QUEUE_PATH, { version: "approval_queue_v1", items: [] });
const items = queue.items || [];

const item = items.find(i => i.id === approvalId);

if (!item) {
  console.error(`❌ Approval not found: ${approvalId}`);
  process.exit(1);
}

const now = new Date().toISOString();

if (action === "approve") {
  item.status = "approved";
  item.stage = "send_ready";
  item.approved_at = now;
  item.approval_note = note || null;
}

if (action === "reject") {
  item.status = "rejected";
  item.stage = "stopped";
  item.rejected_at = now;
  item.rejection_note = note || null;
}

if (action === "hold") {
  item.status = "hold";
  item.stage = "paused";
  item.hold_at = now;
  item.hold_note = note || null;
}

item.updated_at = now;

writeJson(QUEUE_PATH, queue);

console.log(JSON.stringify({
  ok: true,
  agent: "approval_decision_agent_v1",
  action,
  approval_id: approvalId,
  new_status: item.status,
  new_stage: item.stage
}, null, 2));
