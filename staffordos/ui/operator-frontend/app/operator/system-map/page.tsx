import PrimaryBlockerActionPanel from "../../../components/system-map/PrimaryBlockerActionPanel";
import SystemMapManifestPanel from "../../../components/system-map/SystemMapManifestPanel";
import { OperatorNav } from "../../../components/operator/OperatorNav";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

type AnyRecord = Record<string, any>;

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

function resolveRepoRoot() {
  const cwd = process.cwd();
  if (existsSync(path.join(cwd, SOURCES[0]))) return cwd;

  const fromOperatorFrontend = path.resolve(cwd, "../../..");
  if (existsSync(path.join(fromOperatorFrontend, SOURCES[0]))) {
    return fromOperatorFrontend;
  }

  return fromOperatorFrontend;
}

function readJson<T>(repoRoot: string, relativePath: string, fallback: T): T {
  const filePath = path.join(repoRoot, relativePath);

  if (!existsSync(filePath)) {
    return fallback;
  }

  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function getSystemMap() {
  const repoRoot = resolveRepoRoot();
  const leadRegistry = readJson<AnyRecord>(repoRoot, "staffordos/leads/lead_registry_v1.json", {});
  const sendLedger = readJson<AnyRecord>(repoRoot, "staffordos/leads/send_ledger_v1.json", {});
  const agentRegistry = readJson<AnyRecord>(repoRoot, "staffordos/agents/agent_registry_v1.json", {});

  const leads = Array.isArray(leadRegistry?.items) ? leadRegistry.items : [];
  const proofs = Array.isArray(sendLedger?.items) ? sendLedger.items : [];
  const agents = Array.isArray(agentRegistry?.agents)
    ? agentRegistry.agents
    : Array.isArray(agentRegistry?.items)
      ? agentRegistry.items
      : [];

  return {
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
      exists: existsSync(path.join(repoRoot, source))
    }))
  };
}

export default async function SystemMapPage() {
  const data = await getSystemMap();
  const nodes = Array.isArray(data.nodes) ? data.nodes : [];
  const edges = Array.isArray(data.edges) ? data.edges : [];
  const sources = Array.isArray(data.source_inventory) ? data.source_inventory : [];

  return (
    <main className="shell">
      <div className="container">
        <section className="panel">
          <div className="panelInner">
            <p className="eyebrow">StaffordOS System Map</p>
            <h1 className="title">True System Map</h1>
            <p className="subtitle">
              Read-only map of current StaffordOS surfaces, business engines, agents, files, and known data flow.
            </p>
            <OperatorNav activeHref="/operator/system-map" />
          </div>
        </section>

        <section className="panel">
          <div className="panelInner">
            <h2 className="sectionTitle">Operator Status</h2>
            <SystemMapManifestPanel />
          </div>
        </section>

        <section className="panel">
          <div className="panelInner">
            <h2 className="sectionTitle">Primary Blocker</h2>
            <div className="kv">
              <div><strong>Target:</strong> Abando Recovery Loop</div>
              <div><strong>Status:</strong> Partially Proven — Runtime Confirmation Required</div>
              <div><strong>Required proof:</strong> checkout captured → message delivered → return tracked → conversion/revenue attributed</div>
              <div><strong>Next action:</strong> Build and run controlled proof runner only after this UI slice is verified.</div>
            </div>
          </div>
        </section>


        <PrimaryBlockerActionPanel />


        <section className="panel">
          <div className="panelInner">
            <h2 className="sectionTitle">System Policy</h2>
            <div className="kv">
              <div><strong>Map version:</strong> {data.map_version}</div>
              <div><strong>Generated:</strong> {data.generated_at}</div>
              <div><strong>Policy:</strong> {data.source_policy}</div>
            </div>
          </div>
        </section>

        <details className="panel">
          <summary className="sectionTitle cursor-pointer">System Details (Raw Map)</summary>
          <div className="panelInner space-y-6">

        <section className="panel">
          <div className="panelInner">
            <h2 className="sectionTitle">Capabilities / Surfaces</h2>
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Node</th>
                    <th>Group</th>
                    <th>Status</th>
                    <th>Purpose</th>
                    <th>Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {nodes.map((node: any) => (
                    <tr key={node.id}>
                      <td>{node.label}</td>
                      <td>{node.group}</td>
                      <td>{node.status}</td>
                      <td>{node.purpose}</td>
                      <td>{(node.evidence || []).join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panelInner">
            <h2 className="sectionTitle">Known Data Flow</h2>
            <div className="kv">
              {edges.map((edge: any, index: number) => (
                <div key={`${edge.from}-${edge.to}-${index}`}>
                  <strong>{edge.from}</strong> → <strong>{edge.to}</strong>: {edge.label}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panelInner">
            <h2 className="sectionTitle">Source Inventory</h2>
            <div className="kv">
              {sources.map((source: any) => (
                <div key={source.source}>
                  <strong>{source.exists ? "FOUND" : "MISSING"}:</strong> {source.source}
                </div>
              ))}
            </div>
          </div>
        </section>

          </div>
        </details>
      </div>
      </main>
  );
}
