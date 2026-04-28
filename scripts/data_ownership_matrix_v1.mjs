import { existsSync, readFileSync, writeFileSync } from "node:fs";

function readJson(path, fallback = {}) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

const files = [
  {
    name: "lead_registry",
    path: "staffordos/leads/lead_registry_v1.json",
    purpose: "source of truth for all leads"
  },
  {
    name: "lead_events",
    path: "staffordos/leads/lead_events_v1.json",
    purpose: "event history of leads"
  },
  {
    name: "send_ledger",
    path: "staffordos/leads/send_ledger_v1.json",
    purpose: "proof of outreach execution"
  },
  {
    name: "send_execution_log",
    path: "staffordos/leads/send_execution_log_v1.json",
    purpose: "execution log of sends"
  },
  {
    name: "revenue_truth",
    path: "staffordos/revenue/revenue_truth_v1.json",
    purpose: "revenue funnel + bottleneck truth"
  },
  {
    name: "agent_registry",
    path: "staffordos/agents/agent_registry_v1.json",
    purpose: "declared agent system"
  },
  {
    name: "environment_inventory",
    path: "staffordos/hygiene/environment_inventory_v1.json",
    purpose: "runtime environment truth"
  },
  {
    name: "system_map_truth",
    path: "staffordos/system_map/system_map_truth_v1.json",
    purpose: "full system snapshot"
  }
];

function detectOwnership(name) {
  switch (name) {
    case "lead_registry":
      return {
        writers: ["lead ingestion", "lead sync agent"],
        readers: ["leads UI", "revenue engine", "send system"]
      };

    case "send_ledger":
      return {
        writers: ["send_execution_agent", "manual mark_sent"],
        readers: ["revenue command", "proof display"]
      };

    case "revenue_truth":
      return {
        writers: ["revenue_agent"],
        readers: ["command center", "analytics"]
      };

    case "agent_registry":
      return {
        writers: ["developer / system"],
        readers: ["command center", "system map"]
      };

    case "system_map_truth":
      return {
        writers: ["system audit tools"],
        readers: ["system map UI", "operator"]
      };

    default:
      return {
        writers: ["unknown"],
        readers: ["unknown"]
      };
  }
}

const matrix = files.map(f => {
  const exists = existsSync(f.path);
  const ownership = detectOwnership(f.name);

  return {
    name: f.name,
    path: f.path,
    exists,
    purpose: f.purpose,
    writers: ownership.writers,
    readers: ownership.readers
  };
});

let md = `# StaffordOS Data Ownership Matrix v1

Generated: ${new Date().toISOString()}

---

## Purpose

Identify who writes and who reads each critical data artifact.

This defines control, dependencies, and where the system can break.

---

## Matrix
`;

for (const item of matrix) {
  md += `
### ${item.name}

- Path: ${item.path}
- Exists: ${item.exists}
- Purpose: ${item.purpose}

- Writers:
  ${item.writers.map(w => `- ${w}`).join("\n  ")}

- Readers:
  ${item.readers.map(r => `- ${r}`).join("\n  ")}
`;
}

md += `

---

## Key Insight

If a file has:
- NO clear writer → system cannot progress
- NO clear reader → system produces useless output
- MULTIPLE writers → risk of corruption
- MULTIPLE readers → high dependency surface

---

## Critical Observations

You must identify:

1. Which data drives revenue
2. Which data is blocking revenue
3. Which data is never used
4. Which data is duplicated

---

## Next Required Layer

After this:

→ Real vs Partial vs Placeholder Matrix (data-level)
→ Then Command Center becomes truly accurate

`;

writeFileSync(
  "staffordos/system_inventory/output/data_ownership_matrix_v1.md",
  md
);

writeFileSync(
  "staffordos/system_inventory/output/data_ownership_matrix_v1.json",
  JSON.stringify(matrix, null, 2)
);

console.log(JSON.stringify({
  ok: true,
  files_analyzed: matrix.length
}, null, 2));
