import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

const ROOT = path.resolve(process.cwd(), "../../..");
const LEADS_DIR = path.join(ROOT, "staffordos/leads");
const REGISTRY_PATH = path.join(LEADS_DIR, "lead_registry_v1.json");
const EVENTS_PATH = path.join(LEADS_DIR, "lead_events_v1.json");
const SEND_LEDGER_PATH = path.join(LEADS_DIR, "send_ledger_v1.json");
const SEND_EXECUTION_LOG_PATH = path.join(LEADS_DIR, "send_execution_log_v1.json");

function readJson(filePath: string, fallback: any) {
  try {
    if (!existsSync(filePath)) return fallback;
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath: string, value: any) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n");
}

function nextState(action: string) {
  if (action === "move_to_outreach") {
    return { stage: "send_initial_outreach", next_action: "Send initial outreach" };
  }
  if (action === "mark_sent") {
    return { stage: "sent", next_action: "Wait for reply" };
  }
  if (action === "mark_engaged") {
    return { stage: "engaged", next_action: "Qualify reply and prepare offer" };
  }
  return null;
}

function recordDryRunSendProof(lead: any, now: string) {
  const ledger = readJson(SEND_LEDGER_PATH, { version: "send_ledger_v1", items: [] });
  ledger.items = Array.isArray(ledger.items) ? ledger.items : [];

  const sendId = `send_${lead.id || lead.lead_id}_${Date.now()}`;

  ledger.items.push({
    id: sendId,
    lead_id: lead.id || lead.lead_id,
    lead_name: lead.name || lead.domain || "unknown",
    channel: lead.execution?.channel || "manual",
    send_target: lead.execution?.send_target || lead.contact?.email || null,
    message: lead.execution?.message || null,
    status: "dry_run_proof_recorded",
    stage: "sent_marked_by_operator",
    live_send_attempted: false,
    proof_type: "operator_mark_sent",
    created_at: now,
    updated_at: now
  });

  writeJson(SEND_LEDGER_PATH, ledger);

  const log = readJson(SEND_EXECUTION_LOG_PATH, []);
  const nextLog = Array.isArray(log) ? log : [];

  nextLog.push({
    id: `send_execution_${Date.now()}`,
    lead_id: lead.id || lead.lead_id,
    send_id: sendId,
    agent: "operator_lead_action_api",
    mode: "dry_run_proof_only",
    live_send_attempted: false,
    result: "registry_writeback_allowed_with_dry_run_proof",
    at: now
  });

  writeJson(SEND_EXECUTION_LOG_PATH, nextLog);

  return sendId;
}

export async function POST(req: Request) {
  const body = await req.json();
  const leadId = String(body?.leadId || "");
  const action = String(body?.action || "");
  const transition = nextState(action);

  if (!leadId || !transition) {
    return NextResponse.json({ ok: false, error: "Invalid leadId or action" }, { status: 400 });
  }

  const registry = readJson(REGISTRY_PATH, {
    version: "lead_registry_v1",
    schema: "canonical_lead_registry_v1",
    items: []
  });

  const items = Array.isArray(registry.items) ? registry.items : [];
  const idx = items.findIndex((lead: any) => lead.id === leadId || lead.lead_id === leadId);

  if (idx === -1) {
    return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const lead = items[idx];
  const previousStage = lead.lifecycle_stage || lead.status?.current_stage || "unknown";

  let sendLedgerId: string | null = null;
  if (action === "mark_sent") {
    sendLedgerId = recordDryRunSendProof(lead, now);
  }

  items[idx] = {
    ...lead,
    lifecycle_stage: transition.stage,
    status: {
      ...(lead.status || {}),
      current_stage: transition.stage,
      next_action: transition.next_action
    },
    engagement: {
      ...(lead.engagement || {}),
      sent: action === "mark_sent" ? true : Boolean(lead.engagement?.sent),
      replied: action === "mark_engaged" ? true : Boolean(lead.engagement?.replied)
    },
    refs: {
      ...(lead.refs || {}),
      send_ledger_ids: sendLedgerId
        ? [...(Array.isArray(lead.refs?.send_ledger_ids) ? lead.refs.send_ledger_ids : []), sendLedgerId]
        : (Array.isArray(lead.refs?.send_ledger_ids) ? lead.refs.send_ledger_ids : [])
    },
    updated_at: now
  };

  registry.items = items;
  registry.updated_at = now;
  writeJson(REGISTRY_PATH, registry);

  const eventsRaw = readJson(EVENTS_PATH, { version: "lead_events_v1", events: [] });
  const events = Array.isArray(eventsRaw.events) ? eventsRaw.events : [];

  events.push({
    id: `event_${Date.now()}`,
    lead_id: leadId,
    type: action,
    from_stage: previousStage,
    to_stage: transition.stage,
    send_ledger_id: sendLedgerId,
    source: "operator_leads_ui",
    created_at: now
  });

  writeJson(EVENTS_PATH, { version: "lead_events_v1", events });

  return NextResponse.json({
    ok: true,
    lead: items[idx],
    send_ledger_id: sendLedgerId
  });
}
