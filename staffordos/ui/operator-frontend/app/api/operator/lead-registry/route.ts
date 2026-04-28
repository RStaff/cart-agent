import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

const ROOT = path.resolve(process.cwd(), "../../..");
const REGISTRY_PATH = path.join(ROOT, "staffordos/leads/lead_registry_v1.json");

type Lead = {
  id?: string;
  lead_id?: string;
  name?: string;
  domain?: string;
  product?: string;
  product_surface?: string;
  product_intent?: string;
  lifecycle_stage?: string;
  lead_state?: string;
  score?: number;
  status?: {
    current_stage?: string;
    current_bottleneck?: string;
    next_action?: string;
  };
  routing?: {
    primary_offer?: string;
    secondary_offer?: string;
    do_not_cross_sell_until?: string;
  };
  execution?: {
    send_target?: string | null;
    message?: string | null;
  };
  payment?: {
    status?: string | null;
    url?: string | null;
  };
  updated_at?: string;
  created_at?: string;
};

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!existsSync(filePath)) return fallback;
    return JSON.parse(readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function canonicalStage(lead: Lead): string {
  return (
    lead.lifecycle_stage ||
    lead.status?.current_stage ||
    lead.lead_state ||
    "unknown"
  ).toLowerCase();
}

function canonicalProduct(lead: Lead): string {
  if (lead.product) return lead.product;
  if (lead.product_intent) return lead.product_intent;
  if (lead.product_surface?.includes("shopifixer")) return "shopifixer";
  if (lead.routing?.primary_offer?.includes("shopifixer")) return "shopifixer";
  return "unknown";
}

function leadName(lead: Lead): string {
  return lead.name || lead.domain || lead.execution?.send_target || lead.id || lead.lead_id || "unknown";
}

export async function GET() {
  const registry = readJson<{ version?: string; schema?: string; source?: string; items?: Lead[] }>(
    REGISTRY_PATH,
    { version: "lead_registry_v1", schema: "canonical_lead_registry_v1", items: [] }
  );

  const items = Array.isArray(registry.items) ? registry.items : [];

  const lifecycle_counts = {
    contact_needed: 0,
    send_initial_outreach: 0,
    approved: 0,
    dry_run_ready: 0,
    sent: 0,
    engaged: 0,
    recovered_revenue: 0
  };

  const product_routing: Record<string, number> = {};
  const priority_leads = items.slice(0, 10).map((lead) => ({
    id: lead.id || lead.lead_id || leadName(lead),
    name: leadName(lead),
    product: canonicalProduct(lead),
    stage: canonicalStage(lead),
    next_action: lead.status?.next_action || lead.lifecycle_stage || "Review lead"
  }));

  for (const lead of items) {
    const stage = canonicalStage(lead);
    const product = canonicalProduct(lead);

    product_routing[product] = (product_routing[product] || 0) + 1;

    if (stage === "contact_needed") lifecycle_counts.contact_needed += 1;
    if (stage === "send_initial_outreach") lifecycle_counts.send_initial_outreach += 1;
    if (stage === "approved") lifecycle_counts.approved += 1;
    if (stage === "dry_run_ready") lifecycle_counts.dry_run_ready += 1;
    if (stage === "sent") lifecycle_counts.sent += 1;
    if (stage === "engaged" || lead.status?.current_stage === "replied") lifecycle_counts.engaged += 1;

    if (lead.payment?.status === "paid") {
      lifecycle_counts.recovered_revenue += 950;
    }
  }

  const bottleneck =
    lifecycle_counts.contact_needed > 0
      ? {
          stage: "contact_needed",
          next_action: "Find or add valid contact email."
        }
      : lifecycle_counts.send_initial_outreach > 0
        ? {
            stage: "send_initial_outreach",
            next_action: "Send or approve initial outreach."
          }
        : {
            stage: "none",
            next_action: "Review registry for next available action."
          };

  return NextResponse.json({
    ok: true,
    source: "staffordos/leads/lead_registry_v1.json",
    registry,
    lifecycle_counts,
    product_routing,
    priority_leads,
    bottleneck
  });
}
