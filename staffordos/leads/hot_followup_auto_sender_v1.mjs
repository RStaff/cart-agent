import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const queuePath = path.join(root, "staffordos/leads/follow_up_queue_v1.json");
const eventsPath = path.join(root, "staffordos/leads/lead_events_v1.json");
const registryPath = path.join(root, "staffordos/leads/lead_registry_v1.json");

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

function readEnvValue(filePath, key) {
  if (!fs.existsSync(filePath)) return "";
  const line = fs.readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .find((l) => l.startsWith(`${key}=`));
  if (!line) return "";
  return line.slice(key.length + 1).trim().replace(/^["']|["']$/g, "");
}

const RESEND_API_KEY =
  process.env.RESEND_API_KEY ||
  readEnvValue(path.join(root, "web/.env"), "RESEND_API_KEY") ||
  readEnvValue(path.join(root, ".env"), "RESEND_API_KEY");

const DEFAULT_FROM =
  process.env.DEFAULT_FROM ||
  readEnvValue(path.join(root, "web/.env"), "DEFAULT_FROM") ||
  readEnvValue(path.join(root, ".env"), "DEFAULT_FROM");

if (!RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");
if (!DEFAULT_FROM) throw new Error("Missing DEFAULT_FROM");

const maxSends = Number(process.env.MAX_AUTO_SENDS || 1);
const now = new Date().toISOString();

const queue = readJson(queuePath, { items: [] });
const events = readJson(eventsPath, { events: [] });
const registry = readJson(registryPath, { items: [] });

const items = Array.isArray(queue.items) ? queue.items : [];
const eventItems = Array.isArray(events.events) ? events.events : [];
const leads = Array.isArray(registry.items) ? registry.items : [];

let sentCount = 0;
const results = [];

for (const item of items) {
  if (sentCount >= maxSends) break;

  const eligible =
    item.status === "needs_review" &&
    item.temperature === "hot" &&
    item.priority === "high" &&
    item.email &&
    item.subject &&
    item.message;

  if (!eligible) continue;

  const alreadySent = eventItems.some(
    (event) =>
      event.lead_id === item.lead_id &&
      event.event_type === "hot_followup_auto_sent" &&
      event.payload?.followup_id === item.id
  );

  if (alreadySent) {
    item.status = "already_sent";
    continue;
  }

  const html = `
    <p>${item.message}</p>
    <p><strong>Lead:</strong> ${item.domain || item.lead_name}</p>
    <p><strong>Reason:</strong> ${item.reason}</p>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: SHOPIFIXER_FROM_EMAIL,
      to: item.email,
      subject: item.subject,
      html
    })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    item.status = "send_failed";
    item.error = payload?.message || `resend_http_${response.status}`;
    results.push({ lead_id: item.lead_id, ok: false, error: item.error });
    continue;
  }

  item.status = "sent";
  item.sent_at = now;
  item.provider = "resend";
  item.provider_id = payload?.id || null;

  events.events.push({
    id: `event_${item.lead_id}_hot_followup_auto_sent_${Date.now()}`,
    lead_id: item.lead_id,
    event_type: "hot_followup_auto_sent",
    source: "staffordos_hot_followup_auto_sender",
    payload: {
      followup_id: item.id,
      provider: "resend",
      provider_id: payload?.id || null,
      email_present: true
    },
    created_at: now
  });

  const lead = leads.find((lead) => lead.id === item.lead_id || lead.lead_id === item.lead_id);
  if (lead) {
    lead.lifecycle_stage = "followup_sent";
    lead.status = {
      ...(lead.status || {}),
      current_stage: "followup_sent",
      current_bottleneck: "reply",
      next_action: "Wait for reply or track next click"
    };
    lead.engagement = {
      ...(lead.engagement || {}),
      sent: true
    };
    lead.updated_at = now;
  }

  sentCount += 1;
  results.push({ lead_id: item.lead_id, ok: true, provider_id: payload?.id || null });
}

queue.generated_at = now;
writeJson(queuePath, queue);
writeJson(eventsPath, events);
writeJson(registryPath, registry);

console.log(JSON.stringify({
  ok: true,
  attempted_limit: maxSends,
  sent_count: sentCount,
  results
}, null, 2));
