import { existsSync, readFileSync, writeFileSync } from "node:fs";

function readJson(path, fallback = null) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function readText(path, fallback = "") {
  if (!existsSync(path)) return fallback;
  return readFileSync(path, "utf8");
}

const sources = {
  systemMapTruth: "staffordos/system_map/system_map_truth_v1.json",
  auditIndex: "staffordos/system_inventory/output/audit_artifact_index_v1.md",
  expansionPlan: "staffordos/system_inventory/output/system_map_expansion_plan_v1.md",
  expansionPass1: "staffordos/system_inventory/output/system_map_expansion_pass_1.md",
  capabilityDecomposition: "staffordos/system_inventory/output/capability_decomposition_v1.md",
  brdFrdBinding: "staffordos/system_inventory/output/brd_frd_command_center_binding_v1.md",
  objectiveBinding: "staffordos/system_inventory/objective_binding_v1.json",
  agentDecomposition: "staffordos/system_inventory/output/agent_role_decomposition_v1.json",
  agentControlRequirements: "staffordos/system_inventory/output/agent_control_requirements_v1.md",
  dataOwnership: "staffordos/system_inventory/output/data_ownership_matrix_v1.json",
  realPartialPlaceholder: "staffordos/system_inventory/output/real_partial_placeholder_matrix_v1.json",
  leadRegistry: "staffordos/leads/lead_registry_v1.json",
  sendLedger: "staffordos/leads/send_ledger_v1.json",
  revenueTruth: "staffordos/revenue/revenue_truth_v1.json",
  agentRegistry: "staffordos/agents/agent_registry_v1.json"
};

const systemMapTruth = readJson(sources.systemMapTruth, {});
const objectiveBinding = readJson(sources.objectiveBinding, {});
const agentDecomposition = readJson(sources.agentDecomposition, { agents: [] });
const dataOwnership = readJson(sources.dataOwnership, []);
const realPartialPlaceholder = readJson(sources.realPartialPlaceholder, { matrix: [] });
const leadRegistry = readJson(sources.leadRegistry, { items: [] });
const sendLedger = readJson(sources.sendLedger, { items: [] });
const revenueTruth = readJson(sources.revenueTruth, {});
const agentRegistry = readJson(sources.agentRegistry, {});

const leads = Array.isArray(leadRegistry.items) ? leadRegistry.items : [];
const proofs = Array.isArray(sendLedger.items) ? sendLedger.items : [];
const agents = Array.isArray(agentDecomposition.agents) ? agentDecomposition.agents : [];
const capabilities = Array.isArray(realPartialPlaceholder.matrix) ? realPartialPlaceholder.matrix : [];

const nodes = [
  {
    id: "local_system",
    label: "Local System",
    type: "runtime",
    status: systemMapTruth.local ? "REAL" : "UNKNOWN",
    evidence: [sources.systemMapTruth],
    summary: "Local repo/runtime truth from committed system map truth artifact."
  },
  {
    id: "server_infra",
    label: "Server / Kubernetes / ArgoCD",
    type: "runtime",
    status: systemMapTruth.server && systemMapTruth.kubernetes ? "REAL" : "PARTIAL",
    evidence: [sources.systemMapTruth],
    summary: "Server, Kubernetes, and ArgoCD truth."
  },
  {
    id: "lead_registry",
    label: "Lead Registry",
    type: "data_store",
    status: leads.length > 0 ? "REAL" : "PLACEHOLDER",
    count: leads.length,
    evidence: [sources.leadRegistry],
    summary: "Canonical lead registry."
  },
  {
    id: "send_proof",
    label: "Send Proof Ledger",
    type: "data_store",
    status: proofs.length > 0 ? "PARTIAL" : "PLACEHOLDER",
    count: proofs.length,
    evidence: [sources.sendLedger],
    summary: "Proof ledger for outreach. Current records may be dry-run/operator proof unless live provider proof exists."
  },
  {
    id: "revenue_truth",
    label: "Revenue Truth",
    type: "business_engine",
    status: revenueTruth ? "PARTIAL" : "PLACEHOLDER",
    evidence: [sources.revenueTruth],
    summary: "Revenue funnel and blocker truth."
  },
  {
    id: "agent_system",
    label: "Agent System",
    type: "automation_layer",
    status: agents.length > 0 ? "PARTIAL" : "PLACEHOLDER",
    count: agents.length,
    evidence: [sources.agentDecomposition, sources.agentRegistry],
    summary: "Discovered agents/capabilities, not yet fully controlled."
  },
  {
    id: "objective_binding",
    label: "Objective / BRD / FRD Binding",
    type: "strategy_layer",
    status: objectiveBinding ? "REAL" : "PLACEHOLDER",
    evidence: [sources.objectiveBinding, sources.brdFrdBinding],
    summary: "Personal objectives, business objectives, requirements, and UI binding."
  }
];

for (const cap of capabilities) {
  nodes.push({
    id: `capability_${String(cap.capability || "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    label: cap.capability,
    type: "capability",
    status: cap.status,
    evidence: cap.evidence || [],
    summary: cap.reason || ""
  });
}

const edges = [
  { from: "local_system", to: "system_map", relationship: "feeds truth" },
  { from: "server_infra", to: "system_map", relationship: "feeds truth" },
  { from: "lead_registry", to: "send_proof", relationship: "lead actions create proof" },
  { from: "send_proof", to: "revenue_truth", relationship: "send proof informs revenue progress" },
  { from: "lead_registry", to: "revenue_truth", relationship: "lead lifecycle informs revenue state" },
  { from: "agent_system", to: "command_center", relationship: "future controllable workforce" },
  { from: "objective_binding", to: "command_center", relationship: "defines command center purpose" },
  { from: "objective_binding", to: "system_map", relationship: "defines why assets matter" },
  { from: "data_ownership", to: "system_map", relationship: "defines readers/writers" },
  { from: "real_partial_placeholder", to: "system_map", relationship: "defines capability truth status" }
];

const truthGraph = {
  version: "system_map_truth_graph_v1",
  generated_at: new Date().toISOString(),
  source_policy: "Derived only from existing audit/truth artifacts. No manual claims without source evidence.",
  sources: Object.entries(sources).map(([key, path]) => ({
    key,
    path,
    exists: existsSync(path)
  })),
  metrics: {
    leads: leads.length,
    send_proofs: proofs.length,
    agents: agents.length,
    capabilities: capabilities.length,
    real_capabilities: capabilities.filter((c) => c.status === "REAL").length,
    partial_capabilities: capabilities.filter((c) => c.status === "PARTIAL").length,
    placeholder_capabilities: capabilities.filter((c) => c.status === "PLACEHOLDER").length
  },
  nodes,
  edges,
  data_ownership: dataOwnership,
  agent_groups: agentDecomposition.grouped || {},
  command_center_destinations: objectiveBinding.ui_binding || {},
  known_gaps: [
    "System Map UI is not yet fully driven by this truth graph.",
    "Agent control is defined but not yet implemented.",
    "Abando capability still needs dedicated product decomposition.",
    "Real email/SMS provider-backed send proof still needs confirmation.",
    "Capacity is not yet bound to Shopifixer onboarding/service-pack workflow.",
    "Analytics and Products are not yet bound to capability truth."
  ]
};

writeFileSync(
  "staffordos/system_inventory/output/system_map_truth_graph_v1.json",
  JSON.stringify(truthGraph, null, 2) + "\n"
);

let md = `# System Map Expansion Pass 2 — Truth Graph Build

Generated: ${truthGraph.generated_at}

## Purpose
Create a unified truth graph from existing audit/truth artifacts so the System Map can become derived, current, and harder to fake.

## Source Policy
${truthGraph.source_policy}

---

## Source Coverage
${truthGraph.sources.map((s) => `- ${s.exists ? "FOUND" : "MISSING"}: ${s.path}`).join("\n")}

---

## Metrics
- Leads: ${truthGraph.metrics.leads}
- Send proofs: ${truthGraph.metrics.send_proofs}
- Agents/capabilities: ${truthGraph.metrics.agents}
- Capability records: ${truthGraph.metrics.capabilities}
- REAL capabilities: ${truthGraph.metrics.real_capabilities}
- PARTIAL capabilities: ${truthGraph.metrics.partial_capabilities}
- PLACEHOLDER capabilities: ${truthGraph.metrics.placeholder_capabilities}

---

## Truth Graph Nodes
${truthGraph.nodes.map((n) => `### ${n.label}
- ID: ${n.id}
- Type: ${n.type}
- Status: ${n.status}
- Count: ${n.count ?? "n/a"}
- Summary: ${n.summary}
- Evidence:
${(n.evidence || []).map((e) => `  - ${e}`).join("\n")}
`).join("\n")}

---

## Truth Graph Edges
${truthGraph.edges.map((e) => `- ${e.from} → ${e.to}: ${e.relationship}`).join("\n")}

---

## Known Gaps
${truthGraph.known_gaps.map((g) => `- ${g}`).join("\n")}

---

## Required Next Step
System Map UI should read this truth graph directly:

\`staffordos/system_inventory/output/system_map_truth_graph_v1.json\`

No Command Center rebuild should happen until this graph is visible and reviewable.
`;

writeFileSync(
  "staffordos/system_inventory/output/system_map_expansion_pass_2_truth_graph.md",
  md
);

console.log(JSON.stringify({
  ok: true,
  graph: "staffordos/system_inventory/output/system_map_truth_graph_v1.json",
  report: "staffordos/system_inventory/output/system_map_expansion_pass_2_truth_graph.md",
  nodes: truthGraph.nodes.length,
  edges: truthGraph.edges.length
}, null, 2));
