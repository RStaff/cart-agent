import fs from "node:fs";
import path from "node:path";

const QUEUE_PATH = path.resolve("staffordos/leads/outreach_queue.json");

function now() {
  return new Date().toISOString();
}

function loadQueue() {
  if (!fs.existsSync(QUEUE_PATH)) return [];
  return JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"));
}

function saveQueue(queue) {
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2) + "\n");
}

function buildLead(domain) {
  return {
    domain,
    email: "",
    status: "captured",
    channel: "email",
    message_type: "shopifixer_audit_invite",
    audit_link: `https://pay.abando.ai/audit?shop=${domain}`,
    experience_link: `https://pay.abando.ai/experience?shop=${domain}&eid=auto-${Date.now()}`,
    subject: "",
    body: "",
    approved: false,
    sent: false,
    replied: false,
    closed: false,
    notes: "shopifixer_audit_capture",
    updated_at: now()
  };
}

function existsInQueue(queue, domain) {
  return queue.some((x) => x.domain === domain);
}

function run(domain) {
  if (!domain) {
    console.error("❌ domain required");
    process.exit(1);
  }

  const queue = loadQueue();

  if (existsInQueue(queue, domain)) {
    console.log("⚠️ already exists in queue:", domain);
    return;
  }

  const lead = buildLead(domain);
  queue.push(lead);
  saveQueue(queue);

  console.log("✅ added to outreach queue:", domain);
}

const [, , domain] = process.argv;
run(domain);
