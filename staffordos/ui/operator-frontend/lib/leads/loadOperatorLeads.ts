import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "../../..");

function readJson(relativePath: string, fallback: any) {
  try {
    const fullPath = path.join(ROOT, relativePath);
    if (!fs.existsSync(fullPath)) return fallback;
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch {
    return fallback;
  }
}

function normalizeLead(input: any) {
  const id = String(input.id || input.lead_id || input.domain || input.name || "");
  const contact = input.contact || {};
  const engagement = input.engagement || {};
  const status = input.status || {};

  return {
    id,
    name: String(input.name || input.domain || id || "unknown"),
    domain: String(input.domain || input.url || ""),
    email: contact.email || input.email || input.send_target || null,
    source: String(input.source || "unknown"),
    lifecycle_stage: String(input.lifecycle_stage || status.current_stage || input.status || "new"),
    next_action: String(status.next_action || input.nextAction || input.next_action || "Review lead"),
    score: typeof input.score === "number" ? input.score : null,
    outreach_ready: Boolean(contact.email || input.email || input.send_target || input.message || input.nextMessage),
    queued: Boolean(input.refs?.outreach_queue || input.queued || input.status === "queued"),
    sent: Boolean(engagement.sent || input.sent),
    replied: Boolean(engagement.replied || input.replied),
    last_event_at: input.updated_at || input.generatedAt || input.created_at || null
  };
}

export async function loadOperatorLeads() {
  const registry = readJson("staffordos/leads/lead_registry_v1.json", { items: [] });
  const events = readJson("staffordos/leads/lead_events_v1.json", { events: [] });
  const sendLedger = readJson("staffordos/leads/send_ledger_v1.json", { items: [] });

  const sendQueue = readJson(".tmp/send_queue.json", []);
  const sendReady = readJson(".tmp/send_ready.json", []);
  const sendConsole = readJson(".tmp/send_console_data.json", []);

  const registryItems = Array.isArray(registry.items) ? registry.items : [];
  const queueItems = Array.isArray(sendQueue) ? sendQueue : [];
  const readyItems = Array.isArray(sendReady) ? sendReady : [];
  const consoleItems = Array.isArray(sendConsole) ? sendConsole : [];

  const byId = new Map<string, any>();

  for (const item of [...registryItems, ...queueItems, ...readyItems, ...consoleItems]) {
    const lead = normalizeLead(item);
    if (!lead.id) continue;

    const existing = byId.get(lead.id);
    byId.set(lead.id, {
      ...(existing || {}),
      ...lead,
      sent: Boolean(existing?.sent || lead.sent),
      replied: Boolean(existing?.replied || lead.replied),
      queued: Boolean(existing?.queued || lead.queued),
      outreach_ready: Boolean(existing?.outreach_ready || lead.outreach_ready)
    });
  }

  const leads = Array.from(byId.values());

  const summary = {
    total_leads: leads.length,
    contact_ready: leads.filter((l) => Boolean(l.email)).length,
    outreach_ready: leads.filter((l) => l.outreach_ready).length,
    queued: leads.filter((l) => l.queued).length,
    sent: leads.filter((l) => l.sent).length,
    engaged: leads.filter((l) => l.lifecycle_stage === "engaged" || l.replied).length,
    blocked: leads.filter((l) => !l.email && !l.outreach_ready).length,
    send_ledger_items: Array.isArray(sendLedger.items) ? sendLedger.items.length : 0,
    event_count: Array.isArray(events.events) ? events.events.length : 0
  };

  return {
    ok: true,
    source_policy: "real_files_only",
    summary,
    leads,
    sources: {
      registry: "staffordos/leads/lead_registry_v1.json",
      events: "staffordos/leads/lead_events_v1.json",
      send_queue: ".tmp/send_queue.json",
      send_ready: ".tmp/send_ready.json",
      send_console: ".tmp/send_console_data.json",
      send_ledger: "staffordos/leads/send_ledger_v1.json"
    }
  };
}
