import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

const ROOT = path.resolve(process.cwd(), "../../..");

const REGISTRY_PATH = path.join(ROOT, "staffordos/leads/lead_registry_v1.json");
const LEDGER_PATH = path.join(ROOT, "staffordos/leads/send_ledger_v1.json");

function readJson(filePath: string, fallback: any) {
  try {
    if (!existsSync(filePath)) return fallback;
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

export async function GET() {
  const registry = readJson(REGISTRY_PATH, { items: [] });
  const ledger = readJson(LEDGER_PATH, { items: [] });

  const leads = Array.isArray(registry.items) ? registry.items : [];
  const proofs = Array.isArray(ledger.items) ? ledger.items : [];

  const sent = leads.filter((l: any) => l.engagement?.sent === true).length;
  const contactNeeded = leads.filter((l: any) => l.lifecycle_stage === "contact_needed").length;

  return NextResponse.json({
    ok: true,
    system: {
      total_leads: leads.length,
      contact_needed: contactNeeded,
      sent,
      proofs_total: proofs.length,
    },
    top_blocker:
      contactNeeded > 0
        ? "Missing contact info (emails)"
        : sent === 0
        ? "No outreach executed"
        : "Awaiting replies",
    next_actions: leads.slice(0, 10).map((l: any) => ({
      id: l.id,
      name: l.name,
      action: l.status?.next_action || "Review lead",
      stage: l.lifecycle_stage
    })),
    sources: {
      registry: "lead_registry_v1.json",
      ledger: "send_ledger_v1.json"
    }
  });
}
