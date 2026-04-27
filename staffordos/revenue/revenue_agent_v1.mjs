import { existsSync, readFileSync, writeFileSync } from "node:fs";

const OUTREACH_QUEUE = "staffordos/leads/outreach_queue.json";
const APPROVAL_QUEUE = "staffordos/leads/approval_queue_v1.json";
const SEND_LEDGER = "staffordos/leads/send_ledger_v1.json";
const OUTCOMES = "staffordos/leads/outcomes.json";
const TRUTH_JSON = "staffordos/revenue/revenue_truth_v1.json";
const TRUTH_MD = "staffordos/revenue/revenue_truth_v1.md";

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return fallback; }
}

function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
}

function countBy(items, predicate) {
  return items.filter(predicate).length;
}

const outreach = readJson(OUTREACH_QUEUE, []);
const approvalsDoc = readJson(APPROVAL_QUEUE, { version: "approval_queue_v1", items: [] });
const approvals = Array.isArray(approvalsDoc.items) ? approvalsDoc.items : [];
const ledgerDoc = readJson(SEND_LEDGER, { version: "send_ledger_v1", items: [] });
const ledger = Array.isArray(ledgerDoc.items) ? ledgerDoc.items : [];
const outcomes = readJson(OUTCOMES, []);

const stages = {
  captured: countBy(outreach, x => x.status === "captured"),
  message_generated: countBy(outreach, x => Boolean(x.subject && x.body)),
  integrity_passed: countBy(outreach, x => x.integrity_status === "pass"),
  approval_needed: countBy(approvals, x => x.status === "pending_review"),
  approved: countBy(approvals, x => x.status === "approved"),
  send_ready: countBy(approvals, x => x.stage === "send_ready"),
  pending_send: countBy(ledger, x => x.status === "pending_send"),
  dry_run_ready: countBy(ledger, x => x.status === "dry_run_ready"),
  sent: countBy(ledger, x => x.status === "sent") + countBy(outcomes, x => x.sent === true),
  replies: countBy(outcomes, x => x.replied === true),
  customers: countBy(outcomes, x => x.customer === true || x.closed === true)
};

let current_bottleneck = "unknown";
let next_action = "Run the governed outreach dry path and inspect the current queue state.";

if (stages.approval_needed > 0) {
  current_bottleneck = "approval";
  next_action = "Review pending approval items and approve, reject, or hold them.";
} else if (stages.approved > 0 && stages.pending_send === 0 && stages.dry_run_ready === 0) {
  current_bottleneck = "send_ledger";
  next_action = "Run send_ledger_agent_v1 to convert approved/send_ready items into pending_send ledger entries.";
} else if (stages.pending_send > 0) {
  current_bottleneck = "send_execution_dry_run";
  next_action = "Run send_execution_agent_v1 with approval gate to mark pending sends as dry_run_ready.";
} else if (stages.dry_run_ready > 0) {
  current_bottleneck = "live_send_unlock";
  next_action = "Do not live send yet. Verify SMTP/live-send policy before unlocking real send.";
} else if (stages.captured > 0 && stages.message_generated === 0) {
  current_bottleneck = "message_generation";
  next_action = "Run message_generation_agent_v1.";
} else if (stages.message_generated > 0 && stages.integrity_passed === 0) {
  current_bottleneck = "message_integrity";
  next_action = "Run message_integrity_agent_v1 before validation.";
} else {
  current_bottleneck = "lead_supply_or_contact_quality";
  next_action = "Add stronger real leads or valid contact emails.";
}

const truth = {
  ok: true,
  artifact: "revenue_truth_v1",
  generated_at: new Date().toISOString(),
  funnel: {
    outreach_queue: outreach.length,
    approval_items: approvals.length,
    send_ledger_items: ledger.length,
    outcomes: outcomes.length
  },
  stages,
  current_bottleneck,
  next_actions: [
    {
      priority: 1,
      action: next_action,
      expected_outcome: "Move at least one item to the next real funnel state."
    }
  ],
  sources: {
    outreach_queue: OUTREACH_QUEUE,
    approval_queue: APPROVAL_QUEUE,
    send_ledger: SEND_LEDGER,
    outcomes: OUTCOMES
  }
};

writeJson(TRUTH_JSON, truth);

writeFileSync(TRUTH_MD, `# Revenue Truth v1

Generated at: ${truth.generated_at}

## Funnel

- Outreach queue: ${truth.funnel.outreach_queue}
- Approval items: ${truth.funnel.approval_items}
- Send ledger items: ${truth.funnel.send_ledger_items}
- Outcomes: ${truth.funnel.outcomes}

## Stages

${Object.entries(stages).map(([key, value]) => `- ${key}: ${value}`).join("\n")}

## Current Bottleneck

- ${current_bottleneck}

## Next Action

- ${next_action}

## Sources

- ${OUTREACH_QUEUE}
- ${APPROVAL_QUEUE}
- ${SEND_LEDGER}
- ${OUTCOMES}

No fake metrics. This reflects local truth files only.
`);

console.log(JSON.stringify({
  ok: true,
  agent: "revenue_agent_v1",
  current_bottleneck,
  next_action
}, null, 2));
