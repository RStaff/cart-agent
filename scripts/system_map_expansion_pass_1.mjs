import { existsSync, readFileSync, writeFileSync } from "node:fs";

function read(path, fallback = null) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return readFileSync(path, "utf8");
  }
}

const sources = {
  systemMapTruth: read("staffordos/system_map/system_map_truth_v1.json"),
  revenueTruth: read("staffordos/revenue/revenue_truth_v1.json"),
  revenueMarkdown: read("staffordos/revenue/revenue_truth_v1.md"),
  agentRegistry: read("staffordos/agents/agent_registry_v1.json"),
  envInventory: read("staffordos/hygiene/environment_inventory_v1.json"),
  envInventoryOutput: read("staffordos/hygiene/output/environment_inventory_v1.json"),
  objectiveBinding: read("staffordos/system_inventory/objective_binding_v1.json"),
  auditIndex: read("staffordos/system_inventory/output/audit_artifact_index_v1.md"),
  capabilityDecomposition: read("staffordos/system_inventory/output/capability_decomposition_v1.md"),
  brdFrdBinding: read("staffordos/system_inventory/output/brd_frd_command_center_binding_v1.md"),
  leadRegistry: read("staffordos/leads/lead_registry_v1.json"),
  sendLedger: read("staffordos/leads/send_ledger_v1.json"),
  sendExecutionLog: read("staffordos/leads/send_execution_log_v1.json")
};

function exists(path) {
  return existsSync(path);
}

const leads = Array.isArray(sources.leadRegistry?.items) ? sources.leadRegistry.items : [];
const proofs = Array.isArray(sources.sendLedger?.items) ? sources.sendLedger.items : [];
const agents = Array.isArray(sources.agentRegistry?.agents)
  ? sources.agentRegistry.agents
  : Array.isArray(sources.agentRegistry?.items)
    ? sources.agentRegistry.items
    : [];

const report = `# System Map Expansion Pass 1

Generated: ${new Date().toISOString()}

## Purpose
Populate the System Map Expansion Plan with verified evidence from existing committed audit/truth artifacts.

---

## 1. Local System Truth

### Status
${sources.systemMapTruth?.local ? "FOUND" : "NOT FOUND"}

### Evidence
- staffordos/system_map/system_map_truth_v1.json
- local.machine: ${sources.systemMapTruth?.local?.machine ? "present" : "missing"}
- local.branch: ${sources.systemMapTruth?.local?.branch || "missing"}
- local.recent_commits: ${sources.systemMapTruth?.local?.recent_commits ? "present" : "missing"}

### Interpretation
Local truth exists and should be represented in System Map as a first-class local runtime/code-state node.

---

## 2. Server / Infrastructure Truth

### Status
${sources.systemMapTruth?.server ? "FOUND" : "NOT FOUND"}

### Evidence
- server.reachable: ${sources.systemMapTruth?.server?.reachable}
- server.branch: ${sources.systemMapTruth?.server?.branch || "missing"}
- kubernetes present: ${sources.systemMapTruth?.kubernetes ? "yes" : "no"}
- argocd present: ${sources.systemMapTruth?.kubernetes?.argocd ? "yes" : "no"}
- cart-agent deployment present: ${sources.systemMapTruth?.kubernetes?.cart_agent ? "yes" : "no"}

### Interpretation
Server/Kubernetes/ArgoCD truth exists and must be shown separately from local truth to avoid confusing local development state with deployed state.

---

## 3. Product Capabilities

### Abando
Status: NEEDS DEDICATED PRODUCT PASS

Evidence found:
- system map references cart-agent backend / Kubernetes / ArgoCD
- revenue/system artifacts exist
- Abando-specific send/SMS/email truth is not fully mapped in this pass

### Shopifixer
Status: PARTIAL / PRESENT

Evidence found:
- staffordos/connectors/shopifixer_audit_to_outreach_v1.mjs: ${exists("staffordos/connectors/shopifixer_audit_to_outreach_v1.mjs") ? "FOUND" : "MISSING"}
- lead registry product values include shopifixer: ${leads.some(l => l.product === "shopifixer") ? "YES" : "NO"}

### StaffordOS Core
Status: REAL / PARTIAL

Evidence found:
- System Map truth exists
- Agent registry exists
- Objective binding exists
- Command Center surfaces exist
- Runtime/control completeness still requires deeper mapping

---

## 4. Agent System

### Status
${sources.agentRegistry ? "FOUND" : "NOT FOUND"}

### Evidence
- staffordos/agents/agent_registry_v1.json
- agent count detected: ${agents.length}

### Interpretation
Agent inventory exists but is not yet decomposed into employee-like roles, ownership, latest output, and command/control status.

---

## 5. Business Engines

### Leads Engine
Status: REAL
Evidence:
- lead_registry_v1.json found: ${exists("staffordos/leads/lead_registry_v1.json")}
- lead count: ${leads.length}

### Send Engine
Status: PARTIAL
Evidence:
- send_ledger_v1.json found: ${exists("staffordos/leads/send_ledger_v1.json")}
- proof count: ${proofs.length}
- live sends attempted: ${proofs.filter(p => p.live_send_attempted === true).length}
- dry-run proofs: ${proofs.filter(p => p.status === "dry_run_proof_recorded").length}

### Revenue Engine
Status: PARTIAL
Evidence:
- revenue_truth_v1.json found: ${exists("staffordos/revenue/revenue_truth_v1.json")}
- revenue_truth_v1.md found: ${exists("staffordos/revenue/revenue_truth_v1.md")}

### Decision Engine
Status: PARTIAL
Evidence:
- objective_binding_v1.json found
- brd_frd_command_center_binding_v1.md found
- system-truth API route exists

---

## 6. Data Flow

### Proven Flows
- Leads → Send Proof
- Send Proof → Revenue Command
- Audit Truth → System Map
- Objective Binding → BRD/FRD Binding

### Unproven / Needs More Evidence
- Abando checkout event → recovery send → revenue attribution
- Real email/SMS send → provider proof → registry writeback
- Agent execution → command center control surface
- Shopifixer client onboarding → service pack → fix proof

---

## 7. Real / Partial / Placeholder Classification

### REAL
- Lead registry
- Lead events
- System map truth artifact
- Audit artifact index
- Objective binding artifact

### PARTIAL
- Send proof / send engine
- Revenue truth
- Agent system
- Command Center
- Revenue Command
- System Map UI

### PLACEHOLDER / NOT FULLY BOUND
- Capacity
- Analytics
- Products
- Console as life/business chat layer

---

## 8. Objective / BRD / FRD Binding

### Status
FOUND

### Evidence
- objective_binding_v1.json
- brd_frd_command_center_binding_v1.md

### Interpretation
Strategic binding now exists as an artifact, but it is not yet enforced by System Map or Command Center.

---

## 9. Command Center Destination Mapping

### Current Destination Map
- Console → personal/business/system chat layer
- Command Center → blocker/decision/agent cockpit
- Capacity → Shopifixer service pack/client onboarding
- Leads → outreach/deal engine
- Revenue Command → income proof/pipeline
- Analytics → feedback loop
- Products → product portfolio state
- System Map → truth visualization

### Status
Defined but not fully implemented.

---

## 10. Gap Detection Layer

### Confirmed Gaps
1. System Map does not yet ingest the full deep audit artifact contents.
2. Agent registry is not yet surfaced as employee-like controllable units.
3. Abando product capability is not fully mapped.
4. Real email/SMS execution is not proven in the current send proof chain.
5. Capacity is not yet a real Shopifixer onboarding/service-pack cockpit.
6. Analytics does not yet show product or system performance.
7. Products page is not yet bound to product capability truth.
8. Command Center is not yet driven by BRD/FRD/objective binding.

---

## Expansion Pass 1 Conclusion

The current system already contains substantial audit truth:
- local system truth
- server/Kubernetes truth
- revenue truth
- lead registry truth
- send proof truth
- agent registry truth
- objective binding truth

The next pass should not build UI yet.

Next required synthesis:
1. Agent Role Decomposition
2. Product Capability Decomposition: Abando / Shopifixer / StaffordOS
3. Data Ownership Matrix
4. Real-vs-Partial-vs-Placeholder Matrix
5. Command Center Requirements v1
`;

writeFileSync("staffordos/system_inventory/output/system_map_expansion_pass_1.md", report);
console.log("✅ wrote staffordos/system_inventory/output/system_map_expansion_pass_1.md");
