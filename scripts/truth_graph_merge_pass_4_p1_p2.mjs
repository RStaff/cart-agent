import { existsSync, readFileSync, writeFileSync } from "node:fs";

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return fallback; }
}

const graphPath = "staffordos/system_inventory/output/system_map_truth_graph_v1.json";
const triagePath = "staffordos/system_inventory/output/asset_triage_v1.json";

const graph = readJson(graphPath, { nodes: [], edges: [] });
const triage = readJson(triagePath, { grouped: {} });

const p1 = triage.grouped?.P1_income || [];
const p2 = triage.grouped?.P2_operations || [];

function groupAssets(items, type) {
  const groups = {};

  for (const item of items) {
    const f = item.file.toLowerCase();

    let id = "misc";
    let label = "Miscellaneous";

    if (f.includes("checkout")) {
      id = "checkout_events";
      label = "Checkout Event System";
    } else if (f.includes("recovery")) {
      id = "abando_recovery";
      label = "Abando Recovery System";
    } else if (f.includes("shopifixer")) {
      id = "shopifixer_revenue";
      label = "ShopiFixer Revenue / Fix System";
    } else if (f.includes("revenue")) {
      id = "revenue_engine";
      label = "Revenue Engine";
    } else if (f.includes("agent")) {
      id = "agent_workforce";
      label = "Agent Workforce";
    } else if (f.includes("gate")) {
      id = "execution_gates";
      label = "Execution Gates";
    } else if (f.includes("loop")) {
      id = "runtime_loops";
      label = "Runtime Loops";
    } else if (f.includes("packet") || f.includes("execution")) {
      id = "execution_packets";
      label = "Execution Packets";
    }

    groups[id] ||= {
      id,
      label,
      type,
      files: [],
      status: "DISCOVERED_REQUIRES_REVIEW"
    };

    groups[id].files.push(item.file);
  }

  return Object.values(groups);
}

const incomeGroups = groupAssets(p1, "income_capability");
const opsGroups = groupAssets(p2, "operations_capability");

const mergedGroups = [...incomeGroups, ...opsGroups];

const existingNodeIds = new Set((graph.nodes || []).map((n) => n.id));
const newNodes = [];

for (const group of mergedGroups) {
  const nodeId = `pass4_${group.id}`;

  const node = {
    id: nodeId,
    label: group.label,
    type: group.type,
    status: group.status,
    count: group.files.length,
    evidence: group.files,
    summary:
      group.type === "income_capability"
        ? "P1 income asset group discovered by asset triage; requires evidence review before UI trust."
        : "P2 operations asset group discovered by asset triage; requires control/read-write mapping before UI trust."
  };

  if (!existingNodeIds.has(nodeId)) {
    newNodes.push(node);
    graph.nodes.push(node);
  }
}

const edgesToAdd = [
  ...incomeGroups.map((g) => ({
    from: `pass4_${g.id}`,
    to: "revenue_truth",
    relationship: "income asset may contribute to revenue truth after review"
  })),
  ...opsGroups.map((g) => ({
    from: `pass4_${g.id}`,
    to: "agent_system",
    relationship: "operations asset may contribute to agent/control system after review"
  })),
  {
    from: "asset_triage",
    to: "system_map",
    relationship: "discovers unmapped assets for graph review"
  }
];

graph.edges ||= [];

const edgeKey = (e) => `${e.from}->${e.to}:${e.relationship}`;
const existingEdges = new Set(graph.edges.map(edgeKey));

for (const edge of edgesToAdd) {
  if (!existingEdges.has(edgeKey(edge))) {
    graph.edges.push(edge);
  }
}

graph.version = "system_map_truth_graph_v1_pass4_p1_p2_merged";
graph.updated_at = new Date().toISOString();
graph.pass4_summary = {
  p1_income_assets: p1.length,
  p2_operations_assets: p2.length,
  new_nodes_added: newNodes.length,
  merged_groups: mergedGroups.map((g) => ({
    id: `pass4_${g.id}`,
    label: g.label,
    type: g.type,
    files: g.files.length
  }))
};

writeFileSync(graphPath, JSON.stringify(graph, null, 2) + "\n");

let md = `# Truth Graph Merge Pass 4 — P1 Income + P2 Operations

Generated: ${graph.updated_at}

## Purpose
Merge prioritized P1 income and P2 operations assets into the System Map truth graph as review-required capability groups.

## Rule
These are not declared fully trusted. They are now visible in the graph as discovered assets requiring review.

---

## Summary
- P1 income assets: ${p1.length}
- P2 operations assets: ${p2.length}
- New graph nodes added: ${newNodes.length}

---

## Merged Capability Groups
`;

for (const group of mergedGroups) {
  md += `

### ${group.label}
- Graph Node: pass4_${group.id}
- Type: ${group.type}
- Status: ${group.status}
- Files: ${group.files.length}

#### Evidence Files
${group.files.map((f) => `- ${f}`).join("\n")}
`;
}

md += `

---

## Next Required Step
Review each PASS 4 group and classify:

1. Real operational capability
2. Partial / needs proof
3. Duplicate / legacy
4. UI-worthy now
5. System-map-only

After that, System Map UI can read from the graph without hiding these assets.
`;

writeFileSync(
  "staffordos/system_inventory/output/truth_graph_merge_pass_4_p1_p2.md",
  md
);

writeFileSync(
  "staffordos/system_inventory/output/truth_graph_merge_pass_4_p1_p2.json",
  JSON.stringify({
    generated_at: graph.updated_at,
    p1_income_assets: p1.length,
    p2_operations_assets: p2.length,
    merged_groups: mergedGroups,
    new_nodes: newNodes
  }, null, 2) + "\n"
);

console.log(JSON.stringify({
  ok: true,
  p1_income_assets: p1.length,
  p2_operations_assets: p2.length,
  new_nodes_added: newNodes.length
}, null, 2));
