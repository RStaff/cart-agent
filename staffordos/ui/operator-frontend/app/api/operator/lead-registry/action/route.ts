import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

const ROOT = path.resolve(process.cwd(), "../../..");
const REGISTRY_PATH = path.join(ROOT, "staffordos/leads/lead_registry_v1.json");
const EVENTS_PATH = path.join(ROOT, "staffordos/leads/lead_events_v1.json");

function readJson(filePath: string, fallback: any) {
  try {
    if (!existsSync(filePath)) return fallback;
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath: string, value: any) {
  writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n");
}

function nextState(action: string) {
  if (action === "move_to_outreach") {
    return {
      stage: "send_initial_outreach",
      next_action: "Send initial outreach"
    };
  }

  if (action === "mark_sent") {
    return {
      stage: "sent",
      next_action: "Wait for reply"
    };
  }

  if (action === "mark_engaged") {
    return {
      stage: "engaged",
      next_action: "Qualify reply and prepare offer"
    };
  }

  return null;
}

export async function POST(req: Request) {
  const body = await req.json();
  const leadId = String(body?.leadId || "");
  const action = String(body?.action || "");

  const transition = nextState(action);

  if (!leadId || !transition) {
    return NextResponse.json(
      { ok: false, error: "Invalid leadId or action" },
      { status: 400 }
    );
  }

  const registry = readJson(REGISTRY_PATH, {
    version: "lead_registry_v1",
    schema: "canonical_lead_registry_v1",
    items: []
  });

  const items = Array.isArray(registry.items) ? registry.items : [];
  const idx = items.findIndex((lead: any) => lead.id === leadId || lead.lead_id === leadId);

  if (idx === -1) {
    return NextResponse.json(
      { ok: false, error: "Lead not found" },
      { status: 404 }
    );
  }

  const now = new Date().toISOString();
  const lead = items[idx];

  items[idx] = {
    ...lead,
    lifecycle_stage: transition.stage,
    status: {
      ...(lead.status || {}),
      current_stage: transition.stage,
      next_action: transition.next_action
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
    from_stage: lead.lifecycle_stage || lead.status?.current_stage || "unknown",
    to_stage: transition.stage,
    source: "operator_leads_ui",
    created_at: now
  });

  writeJson(EVENTS_PATH, {
    version: "lead_events_v1",
    events
  });

  return NextResponse.json({
    ok: true,
    lead: items[idx]
  });
}
