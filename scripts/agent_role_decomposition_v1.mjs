import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

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

function classifyAgent(name = "", path = "") {
  const value = `${name} ${path}`.toLowerCase();

  if (value.includes("revenue") || value.includes("lead") || value.includes("outreach") || value.includes("reply") || value.includes("contact")) {
    return "revenue / marketing";
  }

  if (value.includes("hygiene") || value.includes("truth") || value.includes("inventory") || value.includes("system")) {
    return "system truth / hygiene";
  }

  if (value.includes("execution") || value.includes("router") || value.includes("gate") || value.includes("decision")) {
    return "execution / governance";
  }

  if (value.includes("audit") || value.includes("scorecard")) {
    return "audit / diagnostic";
  }

  return "unclassified";
}

function inferSurface(category) {
  if (category === "revenue / marketing") return "Leads / Revenue Command";
  if (category === "system truth / hygiene") return "System Map / Command Center";
  if (category === "execution / governance") return "Command Center";
  if (category === "audit / diagnostic") return "Capacity / System Map";
  return "System Map";
}

function extractRegistryAgents(registry) {
  if (!registry) return [];

  if (Array.isArray(registry.agents)) return registry.agents;
  if (Array.isArray(registry.items)) return registry.items;
  if (Array.isArray(registry)) return registry;

  return [];
}

const registryPath = "staffordos/agents/agent_registry_v1.json";
const registry = readJson(registryPath, {});
const registryAgents = extractRegistryAgents(registry);

const knownFiles = [
  "staffordos/agents/system_truth_sync_agent_v1.mjs",
  "staffordos/agents/run_agent_v1.mjs",
  "staffordos/agents/execution_driver_v1.mjs",
  "staffordos/agents/approval_interface_v1.mjs",
  "staffordos/leads/contact_enrichment_agent_v1.mjs",
  "staffordos/leads/send_execution_agent_v1.mjs",
  "staffordos/leads/send_ledger_agent_v1.mjs",
  "staffordos/revenue/revenue_truth_v1.json",
  "staffordos/system_inventory/registry_reality_audit_v1.mjs",
  "staffordos/system_inventory/shape_map_v1.mjs",
  "staffordos/system_inventory/shape_runtime_v1.mjs",
  "staffordos/system_inventory/shape_diff_v1.mjs",
  "staffordos/system_inventory/patch_gate_v1.mjs",
  "staffordos/connectors/shopifixer_audit_to_outreach_v1.mjs",
  "staffordos/scorecards/guidedAuditEngine.js",
  "staffordos/scorecards/runAuditResolver.js"
];

const fileAgents = knownFiles
  .filter(existsSync)
  .map((path) => ({
    id: basename(path).replace(/\.(mjs|js|json)$/i, ""),
    name: basename(path),
    path
  }));

const byId = new Map();

for (const raw of registryAgents) {
  const id = raw.id || raw.name || raw.agent || raw.path || `agent_${byId.size + 1}`;
  byId.set(id, {
    id,
    name: raw.name || raw.agent || id,
    path: raw.path || raw.file || "",
    source: registryPath,
    raw
  });
}

for (const raw of fileAgents) {
  if (!byId.has(raw.id)) {
    byId.set(raw.id, {
      ...raw,
      source: "filesystem_detected",
      raw
    });
  }
}

const agents = Array.from(byId.values()).map((agent) => {
  const category = classifyAgent(agent.name, agent.path);
  const filePath = agent.path && existsSync(agent.path) ? agent.path : "";
  const content = filePath ? readText(filePath).slice(0, 1200) : "";

  const hasWrites = /writeFileSync|save|append|update|commit|POST|fetch\(/i.test(content);
  const hasReads = /readFileSync|readJson|load|GET|fetch\(/i.test(content);

  return {
    id: agent.id,
    name: agent.name,
    path: agent.path || null,
    category,
    command_center_surface: inferSurface(category),
    evidence_source: agent.source,
    reads_data: hasReads,
    writes_data: hasWrites,
    control_status: "not_yet_operator_controlled",
    decomposition_status: "needs_input_output_contract",
    business_relevance:
      category === "revenue / marketing"
        ? "Supports closing deals and revenue creation."
        : category === "system truth / hygiene"
          ? "Supports trusted operation and prevents fake system state."
          : category === "execution / governance"
            ? "Supports safe execution and blocker/action control."
            : category === "audit / diagnostic"
              ? "Supports client/system diagnosis and service packaging."
              : "Needs classification."
  };
});

const grouped = agents.reduce((acc, agent) => {
  acc[agent.category] ||= [];
  acc[agent.category].push(agent);
  return acc;
}, {});

let md = `# StaffordOS Agent Role Decomposition v1

Generated: ${new Date().toISOString()}

## Purpose
Turn discovered agents/scripts into employee-like roles that can later be surfaced in the Command Center without guessing.

## Source Policy
Only agents from existing registry/files are included. This artifact does not claim agents are actively running unless execution evidence is later attached.

## Summary
- Agent registry found: ${existsSync(registryPath)}
- Registry agents detected: ${registryAgents.length}
- Filesystem agent-like files detected: ${fileAgents.length}
- Unique agent/capability records: ${agents.length}

---

## Grouped Agent Roles
`;

for (const [category, list] of Object.entries(grouped)) {
  md += `\n### ${category}\n\n`;
  for (const agent of list) {
    md += `#### ${agent.name}\n`;
    md += `- ID: ${agent.id}\n`;
    md += `- Path: ${agent.path || "not specified"}\n`;
    md += `- Evidence Source: ${agent.evidence_source}\n`;
    md += `- Command Center Surface: ${agent.command_center_surface}\n`;
    md += `- Reads Data: ${agent.reads_data}\n`;
    md += `- Writes Data: ${agent.writes_data}\n`;
    md += `- Control Status: ${agent.control_status}\n`;
    md += `- Decomposition Status: ${agent.decomposition_status}\n`;
    md += `- Business Relevance: ${agent.business_relevance}\n\n`;
  }
}

md += `---

## Required Next Synthesis

Before agents appear as controllable employees in Command Center, each agent needs:

1. Input contract
2. Output contract
3. Trigger mode
4. Last-run evidence
5. Risk level
6. Approval requirement
7. Owner surface
8. Business objective served

## Command Center Implication

The Command Center should not merely list agents. It should show:

- Which agents are active
- Which agents are blocked
- Which agents need Ross approval
- Which agents generated useful output
- Which agents directly support income
- Which agents support system health

`;

writeFileSync("staffordos/system_inventory/output/agent_role_decomposition_v1.md", md);

writeFileSync(
  "staffordos/system_inventory/output/agent_role_decomposition_v1.json",
  JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      registry_found: existsSync(registryPath),
      registry_agents_detected: registryAgents.length,
      filesystem_agent_files_detected: fileAgents.length,
      unique_agents: agents.length,
      grouped,
      agents
    },
    null,
    2
  ) + "\n"
);

console.log(JSON.stringify({
  ok: true,
  agents: agents.length,
  output_md: "staffordos/system_inventory/output/agent_role_decomposition_v1.md",
  output_json: "staffordos/system_inventory/output/agent_role_decomposition_v1.json"
}, null, 2));
