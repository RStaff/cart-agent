import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const registryPath = path.join(root, "staffordos/leads/lead_registry_v1.json");
const eventsPath = path.join(root, "staffordos/leads/lead_events_v1.json");
const queuePath = path.join(root, "staffordos/leads/follow_up_queue_v1.json");

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

function latestEventAt(events, leadId) {
  const matches = events
    .filter((event) => event.lead_id === leadId)
    .map((event) => event.created_at)
    .filter(Boolean)
    .sort();

  return matches[matches.length - 1] || null;
}

function chooseFollowup(lead) {
  const temp = lead.temperature || lead.status?.temperature || "cold";
  const stage = lead.lifecycle_stage || lead.status?.current_stage || "unknown";
  const email = lead.contact?.email || lead.email || lead.execution?.send_target || null;

  if (!email) return null;

  if (temp === "hot") {
    return {
      priority: "high",
      reason: "hot_lead_with_conversion_intent",
      channel: "email",
      subject: `Quick next step for ${lead.domain || lead.name}`,
      message: `Hi — I saw you reviewed the ShopiFixer audit/pricing path. The next best step is to lock the first fix, capture the baseline, and start the improvement work.`
    };
  }

  if (temp === "warm") {
    return {
      priority: "medium",
      reason: "warm_lead_viewed_audit_or_pricing",
      channel: "email",
      subject: `Following up on your ShopiFixer audit`,
      message: `Hi — following up on the ShopiFixer audit. The clearest next step is to review the highest-friction issue and decide whether it is worth fixing this week.`
    };
  }

  if (stage === "inbound_contact_ready") {
    return {
      priority: "normal",
      reason: "inbound_contact_ready_no_engagement_yet",
      channel: "email",
      subject: `Your ShopiFixer audit is ready`,
      message: `Hi — your ShopiFixer audit is ready. You can review the biggest conversion leak and the recommended first fix.`
    };
  }

  return null;
}

const registry = readJson(registryPath, { items: [] });
const eventLog = readJson(eventsPath, { events: [] });

const items = Array.isArray(registry.items) ? registry.items : [];
const events = Array.isArray(eventLog.events) ? eventLog.events : [];
const now = new Date().toISOString();

const queue = [];

for (const lead of items) {
  const leadId = lead.id || lead.lead_id;
  if (!leadId) continue;

  const plan = chooseFollowup(lead);
  if (!plan) continue;

  queue.push({
    id: `followup_${leadId}`,
    lead_id: leadId,
    lead_name: lead.name || lead.domain || leadId,
    domain: lead.domain || null,
    email: lead.contact?.email || lead.email || lead.execution?.send_target || null,
    lifecycle_stage: lead.lifecycle_stage || lead.status?.current_stage || "unknown",
    temperature: lead.temperature || lead.status?.temperature || "cold",
    conversion_score: lead.conversion_score || lead.status?.conversion_score || lead.score || 0,
    latest_event_at: latestEventAt(events, leadId),
    status: "needs_review",
    generated_at: now,
    ...plan
  });
}

queue.sort((a, b) => {
  const rank = { high: 3, medium: 2, normal: 1 };
  return (rank[b.priority] || 0) - (rank[a.priority] || 0);
});

writeJson(queuePath, {
  version: "follow_up_queue_v1",
  generated_at: now,
  source: "staffordos/leads/followup_planner_v1.mjs",
  count: queue.length,
  items: queue
});

console.log(JSON.stringify({
  ok: true,
  queue: queuePath,
  count: queue.length,
  top: queue[0] || null
}, null, 2));
