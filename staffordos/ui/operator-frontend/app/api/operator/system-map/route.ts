import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

const ROOT = path.resolve(process.cwd(), "../../..");

const SOURCES = [
  "staffordos/leads/lead_registry_v1.json",
  "staffordos/leads/lead_events_v1.json",
  "staffordos/leads/send_ledger_v1.json",
  "staffordos/leads/send_execution_log_v1.json",
  "staffordos/agents/agent_registry_v1.json",
  "staffordos/system_inventory/registry_alias_map_v1.mjs",
  "staffordos/system_inventory/registry_reality_audit_v1.mjs",
  "staffordos/control_spine/contracts/ross_operator_contract_v1.json",
  "staffordos/control_spine/contracts/pm_agent_contract_v1.json",
  "staffordos/control_spine/contracts/codex_executor_contract_v1.json",
  "staffordos/control_spine/contracts/claude_architect_contract_v1.json"
];

function readJson(relPath: string) {
  const full = path.join(ROOT, relPath);
  if (!existsSync(full)) return null;
  try {
    return JSON.parse(readFileSync(full, "utf8"));
  } catch {
    return null;
  }
}

function exists(relPath: string) {
  return existsSync(path.join(ROOT, relPath));
}

export async function GET() {
  const leadRegistry = readJson("staffordos/leads/lead_registry_v1.json");
  const sendLedger = readJson("staffordos/leads/send_ledger_v1.json");
  const agentRegistry = readJson("staffordos/agents/agent_registry_v1.json");

  const leads = Array.isArray(leadRegistry?.items) ? leadRegistry.items : [];
  const proofs = Array.isArray(sendLedger?.items) ? sendLedger.items : [];
  const agents = Array.isArray(agentRegistry?.agents)
    ? agentRegistry.agents
    : Array.isArray(agentRegistry?.items)
      ? agentRegistry.items
      : [];

  return NextResponse.json({
    ok: true,
    generated_at: new Date().toISOString(),
    map_version: "system_map_v1_read_only",
    source_policy: "Only reports files that exist or APIs that respond. No fabricated state.",
    nodes: [
      {
        id: "console",
        label: "Console",
        group: "operator_ui",
        status: "partial",
        purpose: "Natural-language operator interface for life, family, business, and StaffordOS questions.",
        evidence: ["/operator"]
      },
      {
        id: "command_center",
        label: "Command Center",
        group: "operator_ui",
        status: "partial",
        purpose: "Dev truth, self-healing, experiment control, execution packets, and system decisions.",
        evidence: ["/operator/command-center"]
      },
      {
        id: "capacity",
        label: "Capacity",
        group: "operator_ui",
        status: "placeholder",
        purpose: "Service capacity and future Shopifixer client onboarding/service pack view.",
        evidence: ["/operator/capacity"]
      },
      {
        id: "leads",
        label: "Leads",
        group: "business_engine",
        status: leads.length ? "real" : "empty",
        purpose: "Cross-product lead routing, prioritization, outreach state, and operator follow-up.",
        count: leads.length,
        evidence: ["staffordos/leads/lead_registry_v1.json", "/operator/leads"]
      },
      {
        id: "send_proof",
        label: "Send Proof",
        group: "business_engine",
        status: proofs.length ? "real" : "empty",
        purpose: "Proof-backed outreach ledger. Current records are dry-run/operator-marked unless live send is proven.",
        count: proofs.length,
        evidence: ["staffordos/leads/send_ledger_v1.json"]
      },
      {
        id: "revenue_command",
        label: "Revenue Command",
        group: "business_engine",
        status: "partial",
        purpose: "Revenue-facing view. Currently lead registry + send proof; should evolve into pipeline/revenue truth.",
        evidence: ["/operator/revenue-command"]
      },
      {
        id: "analytics",
        label: "Analytics",
        group: "operator_ui",
        status: "placeholder",
        purpose: "Future cross-product metrics: leads, Abando recovery, Shopifixer close rate, StaffordOS execution.",
        evidence: ["/operator/analytics"]
      },
      {
        id: "products",
        label: "Products",
        group: "operator_ui",
        status: "placeholder",
        purpose: "Future product summaries for Abando, Shopifixer, Actinventory, and StaffordOS.",
        evidence: ["/operator/products"]
      },
      {
        id: "agents",
        label: "Agents",
        group: "automation_layer",
        status: agents.length ? "partial" : "unknown",
        purpose: "Discovered agent registry / automation workers.",
        count: agents.length,
        evidence: ["staffordos/agents/agent_registry_v1.json"]
      }
    ],
    edges: [
      { from: "leads", to: "send_proof", label: "mark_sent creates proof" },
      { from: "send_proof", to: "revenue_command", label: "proof displayed in revenue command" },
      { from: "leads", to: "revenue_command", label: "lead lifecycle aggregates" },
      { from: "agents", to: "command_center", label: "future agent status/control surface" },
      { from: "products", to: "analytics", label: "future product metric summaries" },
      { from: "capacity", to: "products", label: "future client service packs" }
    ],
    source_inventory: SOURCES.map((source) => ({
      source,
      exists: exists(source)
    }))
  });
}
