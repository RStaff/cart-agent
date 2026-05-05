import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";

const outDir = "staffordos/operator_daemon/output";
mkdirSync(outDir, { recursive: true });

const queuePath = `${outDir}/approved_outreach_queue_v1.json`;

let queue = null;
if (existsSync(queuePath)) {
  queue = JSON.parse(readFileSync(queuePath, "utf8"));
}

const items = queue?.items || [];

const readiness = items.map(item => ({
  lead_id: item.lead_id,
  company: item.company,
  has_email: !!item.contact?.email,
  has_phone: !!item.contact?.phone,
  ready_to_send: !!item.contact?.email || !!item.contact?.phone
}));

const ready_count = readiness.filter(r => r.ready_to_send).length;

const result = {
  schema: "staffordos.send_readiness_gate.v1",
  generated_at: new Date().toISOString(),
  system: "shopifixer",
  status: items.length === 0
    ? "no_items"
    : ready_count > 0
    ? "partial_ready"
    : "not_ready",
  source: queuePath,
  total_items: items.length,
  ready_items: ready_count,
  readiness,
  proof: {
    queue_read: existsSync(queuePath),
    readiness_evaluated: true,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(
  `${outDir}/send_readiness_gate_v1.json`,
  JSON.stringify(result, null, 2)
);

console.log("✅ send readiness evaluated (NO SEND)");
console.log(JSON.stringify(result, null, 2));
