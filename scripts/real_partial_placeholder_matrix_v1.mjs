import { existsSync, readFileSync, writeFileSync } from "node:fs";

function readJson(path, fallback = null) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function exists(path) {
  return existsSync(path);
}

const leadRegistry = readJson("staffordos/leads/lead_registry_v1.json", { items: [] });
const sendLedger = readJson("staffordos/leads/send_ledger_v1.json", { items: [] });
const revenueTruth = readJson("staffordos/revenue/revenue_truth_v1.json", null);
const agentRegistry = readJson("staffordos/agents/agent_registry_v1.json", null);
const systemMapTruth = readJson("staffordos/system_map/system_map_truth_v1.json", null);

const leads = Array.isArray(leadRegistry.items) ? leadRegistry.items : [];
const proofs = Array.isArray(sendLedger.items) ? sendLedger.items : [];
const liveSends = proofs.filter((p) => p.live_send_attempted === true);
const dryRunProofs = proofs.filter((p) => p.status === "dry_run_proof_recorded");

const matrix = [
  {
    capability: "Local System Truth",
    status: systemMapTruth?.local ? "REAL" : "PLACEHOLDER",
    evidence: ["staffordos/system_map/system_map_truth_v1.json"],
    reason: systemMapTruth?.local
      ? "Local machine, branch, status, and recent commit truth exist."
      : "No local truth section found."
  },
  {
    capability: "Server / Kubernetes / ArgoCD Truth",
    status: systemMapTruth?.server && systemMapTruth?.kubernetes ? "REAL" : "PARTIAL",
    evidence: ["staffordos/system_map/system_map_truth_v1.json"],
    reason: systemMapTruth?.server && systemMapTruth?.kubernetes
      ? "Server, Kubernetes, cart-agent deployment, and ArgoCD truth exist."
      : "Some server/infra truth is missing."
  },
  {
    capability: "Lead Registry",
    status: leads.length > 0 ? "REAL" : "PLACEHOLDER",
    evidence: ["staffordos/leads/lead_registry_v1.json"],
    reason: `${leads.length} leads found in canonical registry.`
  },
  {
    capability: "Lead Events",
    status: exists("staffordos/leads/lead_events_v1.json") ? "REAL" : "PLACEHOLDER",
    evidence: ["staffordos/leads/lead_events_v1.json"],
    reason: "Lead event artifact exists and records lifecycle movement."
  },
  {
    capability: "Send Proof",
    status: proofs.length > 0 ? "PARTIAL" : "PLACEHOLDER",
    evidence: ["staffordos/leads/send_ledger_v1.json"],
    reason: `${proofs.length} send proofs found; ${dryRunProofs.length} dry-run proofs; ${liveSends.length} live sends proven.`
  },
  {
    capability: "Real Email Send",
    status: liveSends.length > 0 ? "REAL" : "PARTIAL",
    evidence: ["staffordos/leads/send_ledger_v1.json", "staffordos/leads/send_execution_log_v1.json"],
    reason: liveSends.length > 0
      ? "At least one live send is recorded."
      : "Current proof chain does not prove real provider-backed email send."
  },
  {
    capability: "Real SMS Send",
    status: "PARTIAL",
    evidence: ["staffordos/leads/send_ledger_v1.json"],
    reason: "SMS delivery is not proven by current send proof records."
  },
  {
    capability: "Revenue Truth",
    status: revenueTruth ? "PARTIAL" : "PLACEHOLDER",
    evidence: ["staffordos/revenue/revenue_truth_v1.json", "staffordos/revenue/revenue_truth_v1.md"],
    reason: revenueTruth
      ? "Revenue truth artifact exists, but paid conversion/recovered revenue is not yet fully operationalized."
      : "Revenue truth artifact missing."
  },
  {
    capability: "Agent Registry",
    status: agentRegistry ? "PARTIAL" : "PLACEHOLDER",
    evidence: ["staffordos/agents/agent_registry_v1.json"],
    reason: agentRegistry
      ? "Agents are discovered, but not yet controlled, trusted, or surfaced."
      : "Agent registry missing."
  },
  {
    capability: "Command Center",
    status: "PARTIAL",
    evidence: ["staffordos/ui/operator-frontend/app/operator/command-center"],
    reason: "UI exists, but is not yet fully driven by objective binding, agent control, and complete system truth."
  },
  {
    capability: "Leads Surface",
    status: leads.length > 0 ? "REAL" : "PARTIAL",
    evidence: ["staffordos/ui/operator-frontend/components/operator/LeadQueue.tsx"],
    reason: "Leads surface is bound to canonical registry and shows row-level proof fields."
  },
  {
    capability: "Revenue Command Surface",
    status: proofs.length > 0 ? "PARTIAL" : "PLACEHOLDER",
    evidence: ["staffordos/ui/operator-frontend/app/operator/revenue-command/page.tsx"],
    reason: "Revenue Command shows lead lifecycle and send proof, but not full income truth yet."
  },
  {
    capability: "Capacity Surface",
    status: "PLACEHOLDER",
    evidence: ["staffordos/ui/operator-frontend/app/operator/capacity"],
    reason: "Capacity is not yet bound to Shopifixer client onboarding or service packs."
  },
  {
    capability: "Analytics Surface",
    status: "PLACEHOLDER",
    evidence: ["staffordos/ui/operator-frontend/app/operator/analytics"],
    reason: "Analytics is not yet bound to product, revenue, send, or agent performance data."
  },
  {
    capability: "Products Surface",
    status: "PLACEHOLDER",
    evidence: ["staffordos/ui/operator-frontend/app/operator/products"],
    reason: "Products page is not yet bound to Abando, Shopifixer, StaffordOS product truth."
  },
  {
    capability: "System Map Surface",
    status: "PARTIAL",
    evidence: ["staffordos/ui/operator-frontend/app/operator/system-map/page.tsx"],
    reason: "System Map exists but must ingest deeper audit outputs and product/agent/data matrices."
  }
];

const grouped = matrix.reduce((acc, item) => {
  acc[item.status] ||= [];
  acc[item.status].push(item);
  return acc;
}, {});

let md = `# StaffordOS Real vs Partial vs Placeholder Matrix v1

Generated: ${new Date().toISOString()}

## Purpose
Classify each major StaffordOS capability so Command Center and System Map do not overstate what is actually working.

## Definitions

### REAL
Proven artifact or working flow exists and produces usable output.

### PARTIAL
Artifact or UI exists, but capability is incomplete, not fully wired, or lacks live proof.

### PLACEHOLDER
UI or concept exists, but no real operational backend/capability is currently proven.

---

## Summary
- REAL: ${(grouped.REAL || []).length}
- PARTIAL: ${(grouped.PARTIAL || []).length}
- PLACEHOLDER: ${(grouped.PLACEHOLDER || []).length}

---

## Matrix
`;

for (const item of matrix) {
  md += `
### ${item.capability}
- Status: ${item.status}
- Reason: ${item.reason}
- Evidence:
${item.evidence.map((e) => `  - ${e}`).join("\n")}
`;
}

md += `

---

## Command Center Rule

The Command Center must visually distinguish:

- REAL = usable now
- PARTIAL = usable with caution
- PLACEHOLDER = not operational

No surface should imply real capability without proof.

---

## Key Business Implication

The system has real structure and real assets, but income-generating operation is still partial until:

1. real email/SMS proof is confirmed
2. Abando recovery/revenue loop is mapped
3. Shopifixer service-pack onboarding is real
4. agents become controllable
5. revenue command shows true pipeline and paid outcomes

`;

writeFileSync(
  "staffordos/system_inventory/output/real_partial_placeholder_matrix_v1.md",
  md
);

writeFileSync(
  "staffordos/system_inventory/output/real_partial_placeholder_matrix_v1.json",
  JSON.stringify({ generated_at: new Date().toISOString(), matrix, grouped }, null, 2) + "\n"
);

console.log(JSON.stringify({
  ok: true,
  total: matrix.length,
  real: (grouped.REAL || []).length,
  partial: (grouped.PARTIAL || []).length,
  placeholder: (grouped.PLACEHOLDER || []).length
}, null, 2));
