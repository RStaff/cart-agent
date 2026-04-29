import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

function run(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function readJson(path, fallback = {}) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

const graph = readJson("staffordos/system_inventory/output/system_map_truth_graph_v1.json", {
  nodes: [],
  sources: []
});

const knownEvidence = new Set();

for (const node of graph.nodes || []) {
  for (const e of node.evidence || []) knownEvidence.add(e);
}

for (const s of graph.sources || []) {
  if (s.path) knownEvidence.add(s.path);
}

const searchTerms = [
  "agent",
  "loop",
  "router",
  "gate",
  "packet",
  "audit",
  "scorecard",
  "recovery",
  "onboarding",
  "shopifixer",
  "abando",
  "revenue",
  "truth",
  "inventory",
  "hygiene",
  "execution",
  "command",
  "surface",
  "connector",
  "workflow",
  "worker",
  "scheduler",
  "approval",
  "repair",
  "self"
];

const allFiles = run(
  `find staffordos scripts web abando-frontend -type f 2>/dev/null | grep -vi "node_modules\\|.next\\|dist\\|build\\|coverage\\|.git"`
)
  .split("\n")
  .filter(Boolean);

const candidates = [];

for (const file of allFiles) {
  const lower = file.toLowerCase();
  const matches = searchTerms.filter((term) => lower.includes(term));

  if (!matches.length) continue;

  const alreadyKnown =
    knownEvidence.has(file) ||
    Array.from(knownEvidence).some((known) => known && file.includes(known));

  candidates.push({
    file,
    matched_terms: matches,
    already_in_truth_graph: alreadyKnown,
    likely_value:
      matches.includes("revenue") || matches.includes("shopifixer") || matches.includes("recovery")
        ? "income"
        : matches.includes("agent") || matches.includes("loop") || matches.includes("execution")
          ? "operations"
          : matches.includes("truth") || matches.includes("inventory") || matches.includes("hygiene")
            ? "system_truth"
            : "unknown"
  });
}

const undiscovered = candidates.filter((c) => !c.already_in_truth_graph);

const output = {
  version: "asset_discovery_engine_v1",
  generated_at: new Date().toISOString(),
  total_files_scanned: allFiles.length,
  candidates_found: candidates.length,
  undiscovered_candidates: undiscovered.length,
  known_candidates: candidates.length - undiscovered.length,
  search_terms: searchTerms,
  candidates,
  undiscovered
};

writeFileSync(
  "staffordos/system_inventory/output/asset_discovery_engine_v1.json",
  JSON.stringify(output, null, 2) + "\n"
);

let md = `# Asset Discovery Engine v1

Generated: ${output.generated_at}

## Purpose
Continuously find potentially valuable StaffordOS / Abando / ShopiFixer assets that are not yet represented in the System Map truth graph.

## Summary
- Total files scanned: ${output.total_files_scanned}
- Candidate assets found: ${output.candidates_found}
- Already represented: ${output.known_candidates}
- Potentially undiscovered: ${output.undiscovered_candidates}

---

## Potentially Undiscovered Assets
`;

for (const item of undiscovered.slice(0, 300)) {
  md += `
### ${item.file}
- Matched terms: ${item.matched_terms.join(", ")}
- Likely value: ${item.likely_value}
`;
}

md += `

---

## Rule
Potentially undiscovered assets are NOT automatically treated as real capabilities.

They require:
1. Classification
2. Evidence review
3. Capability grouping
4. Truth graph merge
5. UI mapping decision

`;

writeFileSync(
  "staffordos/system_inventory/output/asset_discovery_engine_v1.md",
  md
);

console.log(JSON.stringify({
  ok: true,
  total_files_scanned: output.total_files_scanned,
  candidates_found: output.candidates_found,
  undiscovered_candidates: output.undiscovered_candidates
}, null, 2));
