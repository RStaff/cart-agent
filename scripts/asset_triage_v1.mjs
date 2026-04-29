import { readFileSync, writeFileSync, existsSync } from "node:fs";

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return fallback; }
}

const discovery = readJson("staffordos/system_inventory/output/asset_discovery_engine_v1.json", { undiscovered: [] });
const pass3 = readJson("staffordos/system_inventory/output/system_map_expansion_pass_3_missed_systems.json", { groups: [] });

const pass3Files = new Set();
for (const group of pass3.groups || []) {
  for (const f of group.files || []) {
    if (f.path) pass3Files.add(f.path);
  }
}

const remaining = (discovery.undiscovered || []).filter((item) => !pass3Files.has(item.file));

function priority(item) {
  const f = item.file.toLowerCase();
  if (f.includes("shopifixer") || f.includes("revenue") || f.includes("recovery") || f.includes("checkout")) return "P1_income";
  if (f.includes("agent") || f.includes("execution") || f.includes("gate") || f.includes("router") || f.includes("loop")) return "P2_operations";
  if (f.includes("truth") || f.includes("inventory") || f.includes("audit") || f.includes("hygiene")) return "P3_system_truth";
  if (f.includes("command") || f.includes("operator") || f.includes("surface")) return "P4_ui_surface";
  return "P5_review_later";
}

const triaged = remaining.map((item) => ({
  ...item,
  priority: priority(item)
}));

const grouped = {};
for (const item of triaged) {
  grouped[item.priority] ||= [];
  grouped[item.priority].push(item);
}

const output = {
  version: "asset_triage_v1",
  generated_at: new Date().toISOString(),
  discovery_candidates: discovery.undiscovered?.length || 0,
  already_covered_by_pass3: (discovery.undiscovered || []).length - remaining.length,
  remaining_after_pass3: remaining.length,
  grouped,
  triaged
};

writeFileSync(
  "staffordos/system_inventory/output/asset_triage_v1.json",
  JSON.stringify(output, null, 2) + "\n"
);

let md = `# Asset Triage v1

Generated: ${output.generated_at}

## Purpose
Reduce noisy discovery results by removing assets already covered in System Map Expansion Pass 3, then prioritize remaining assets.

## Summary
- Discovery undiscovered candidates: ${output.discovery_candidates}
- Already covered by Pass 3: ${output.already_covered_by_pass3}
- Remaining after Pass 3: ${output.remaining_after_pass3}

---

`;

for (const key of ["P1_income", "P2_operations", "P3_system_truth", "P4_ui_surface", "P5_review_later"]) {
  const items = grouped[key] || [];
  md += `## ${key} (${items.length})\n`;
  for (const item of items.slice(0, 80)) {
    md += `- ${item.file} [${item.matched_terms.join(", ")}]\n`;
  }
  md += "\n";
}

md += `---

## Next Rule
Only P1 and P2 assets should be considered for Command Center mapping first.

P3 supports System Map / self-healing.
P4 supports UX only after truth is stable.
P5 waits.
`;

writeFileSync("staffordos/system_inventory/output/asset_triage_v1.md", md);

console.log(JSON.stringify({
  ok: true,
  remaining_after_pass3: output.remaining_after_pass3,
  p1_income: grouped.P1_income?.length || 0,
  p2_operations: grouped.P2_operations?.length || 0,
  p3_system_truth: grouped.P3_system_truth?.length || 0,
  p4_ui_surface: grouped.P4_ui_surface?.length || 0
}, null, 2));
