import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const ROOT = process.cwd();

const APPROVAL_QUEUE_PATH = path.join(ROOT, "staffordos/leads/approval_queue_v1.json");
const LOG_PATH = path.join(ROOT, "staffordos/agents/approval_interface_log_v1.json");

const [, , command, approvalId, ...noteParts] = process.argv;
const note = noteParts.join(" ").trim();

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

function usage() {
  console.log(`Usage:
  node staffordos/agents/approval_interface_v1.mjs list
  node staffordos/agents/approval_interface_v1.mjs show <approval_id>
  node staffordos/agents/approval_interface_v1.mjs approve <approval_id> "note"
  node staffordos/agents/approval_interface_v1.mjs reject <approval_id> "note"
  node staffordos/agents/approval_interface_v1.mjs hold <approval_id> "note"

Examples:
  node staffordos/agents/approval_interface_v1.mjs list
  node staffordos/agents/approval_interface_v1.mjs show approval_store2_com_shopifixer_audit_invite
`);
}

function runDecision(action, id, decisionNote) {
  const args = [
    "staffordos/leads/approval_decision_agent_v1.mjs",
    action,
    id,
  ];

  if (decisionNote) args.push(decisionNote);

  const result = spawnSync("node", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });

  return {
    ok: result.status === 0,
    status: result.status,
    stdout: String(result.stdout || ""),
    stderr: String(result.stderr || ""),
  };
}

const queue = readJson(APPROVAL_QUEUE_PATH, {
  version: "approval_queue_v1",
  items: [],
});

const items = Array.isArray(queue.items) ? queue.items : [];
const log = readJson(LOG_PATH, []);

if (!command || command === "help") {
  usage();
  process.exit(command ? 0 : 1);
}

if (command === "list") {
  const pending = items
    .filter((item) => item.status === "pending_review")
    .map((item) => ({
      id: item.id,
      type: item.type || "outbound_message",
      domain: item.domain,
      email: item.email,
      product: item.product,
      subject: item.subject,
      status: item.status,
      source_intent: item.source_intent || null,
      recommended_action: item.recommended_action || null,
    }));

  const output = {
    ok: true,
    interface: "approval_interface_v1",
    counts: {
      pending_review: pending.length,
      approved: items.filter((i) => i.status === "approved").length,
      rejected: items.filter((i) => i.status === "rejected").length,
      hold: items.filter((i) => i.status === "hold").length,
      stale: items.filter((i) => i.status === "stale").length,
    },
    pending,
  };

  console.log(JSON.stringify(output, null, 2));
  process.exit(0);
}

if (command === "show") {
  if (!approvalId) {
    usage();
    process.exit(1);
  }

  const item = items.find((i) => i.id === approvalId);

  if (!item) {
    console.error(`❌ Approval item not found: ${approvalId}`);
    process.exit(1);
  }

  console.log(JSON.stringify({
    ok: true,
    interface: "approval_interface_v1",
    item: {
      id: item.id,
      type: item.type || "outbound_message",
      domain: item.domain,
      email: item.email,
      product: item.product,
      message_type: item.message_type,
      subject: item.subject,
      body: item.body,
      status: item.status,
      validation_status: item.validation_status,
      validation_issues: item.validation_issues || [],
      source_intent: item.source_intent || null,
      recommended_action: item.recommended_action || null,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }
  }, null, 2));
  process.exit(0);
}

if (["approve", "reject", "hold"].includes(command)) {
  if (!approvalId) {
    usage();
    process.exit(1);
  }

  const before = items.find((i) => i.id === approvalId);

  if (!before) {
    console.error(`❌ Approval item not found: ${approvalId}`);
    process.exit(1);
  }

  const result = runDecision(command, approvalId, note || `Decision from approval_interface_v1: ${command}`);

  const event = {
    generated_at: new Date().toISOString(),
    interface: "approval_interface_v1",
    command,
    approval_id: approvalId,
    note,
    ok: result.ok,
    exit_code: result.status,
    stdout_preview: result.stdout.slice(0, 1500),
    stderr_preview: result.stderr.slice(0, 1500),
  };

  log.push(event);
  writeJson(LOG_PATH, log);

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (!result.ok) {
    console.error(`❌ Approval decision failed: ${command} ${approvalId}`);
    process.exit(result.status || 1);
  }

  console.log(JSON.stringify({
    ok: true,
    interface: "approval_interface_v1",
    action: command,
    approval_id: approvalId,
    decision_logged: LOG_PATH,
  }, null, 2));

  process.exit(0);
}

usage();
process.exit(1);
