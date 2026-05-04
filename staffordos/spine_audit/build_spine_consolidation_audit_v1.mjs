import { existsSync, readFileSync, writeFileSync, statSync } from "node:fs";

const now = new Date().toISOString();

const candidates = [
  "staffordos/execution/run_agent_loop.mjs",
  "staffordos/agents/execution_driver_v1.mjs",
  "staffordos/execution/validate_required_agents_v1.mjs",
  "staffordos/preflight/run_preflight_check_v1.mjs",
  "staffordos/system_inventory/shape_runtime_v1.mjs",
  "staffordos/system_inventory/patch_gate_v1.mjs",
  "staffordos/qa/runtime_qa_agent_v1.mjs",
  "staffordos/qa/validate_command_center_primary_action_v1.mjs",
  "staffordos/agents/system_truth_sync_agent_v1.mjs",
  "staffordos/leads/lead_registry_sync_agent_v1.mjs",
  "staffordos/system_inventory/runners/discovery_sync_runner_v1.mjs",
  "staffordos/slices/run_slice_v1.py",
  "staffordos/slices/verify_slices_v1.py",
  "staffordos/loop_d/build_loop_d_feedback_v1.mjs",
  "staffordos/agents/agent_selector_v1.json",
  "staffordos/agents/task_to_agent_map_v1.json",
  "staffordos/qa/validator_map_v1.json",
  "staffordos/system_inventory/output/execution_support_agent_search_v1/execution_support_agents_inventory_v1.json"
];

function classify(path) {
  const lower = path.toLowerCase();

  if (lower.includes("run_agent_loop")) return "candidate_canonical_spine";
  if (lower.includes("execution_driver")) return "execution_driver";
  if (lower.includes("preflight")) return "preflight_gate";
  if (lower.includes("required_agents")) return "agent_gate";
  if (lower.includes("shape") || lower.includes("patch_gate")) return "safe_landing_gate";
  if (lower.includes("runtime_qa") || lower.includes("validate")) return "qa_gate";
  if (lower.includes("sync") || lower.includes("runner")) return "runtime_sync";
  if (lower.includes("slice")) return "slice_precision_layer";
  if (lower.includes("loop_d")) return "learning_feedback_loop";
  if (lower.includes("agent_selector") || lower.includes("task_to_agent")) return "agent_selection_contract";
  return "supporting_artifact";
}

function readPreview(path) {
  try {
    const raw = readFileSync(path, "utf8");
    return raw.slice(0, 1200);
  } catch {
    return "";
  }
}

const items = candidates.map((path) => {
  const exists = existsSync(path);
  const preview = exists ? readPreview(path) : "";
  const size = exists ? statSync(path).size : 0;

  const signals = {
    imports_fs: preview.includes("readFileSync") || preview.includes("writeFileSync"),
    runs_process: preview.includes("exec") || preview.includes("spawn"),
    writes_output: preview.includes("writeFileSync"),
    has_schema: preview.includes("schema"),
    has_status: preview.includes("status"),
    has_gate_language: /gate|blocked|GO|BLOCKED|validate/i.test(preview),
    has_runtime_language: /runtime|sync|scheduler|runner/i.test(preview),
    has_slice_language: /slice|packet|verify/i.test(preview)
  };

  let leverage = 0;
  if (exists) leverage += 20;
  if (signals.writes_output) leverage += 10;
  if (signals.has_gate_language) leverage += 15;
  if (signals.has_runtime_language) leverage += 10;
  if (signals.has_slice_language) leverage += 10;
  if (signals.runs_process) leverage += 10;
  if (path.includes("run_agent_loop")) leverage += 25;
  if (path.includes("task_to_agent_map")) leverage += 20;

  return {
    path,
    exists,
    category: classify(path),
    size_bytes: size,
    leverage_score: Math.min(100, leverage),
    signals,
    recommendation: exists
      ? "inspect_and_promote_or_wire"
      : "missing_expected_artifact"
  };
});

const byCategory = {};
for (const item of items) {
  byCategory[item.category] ||= [];
  byCategory[item.category].push(item.path);
}

const likelyCanonical = items
  .filter(i => i.exists)
  .sort((a, b) => b.leverage_score - a.leverage_score)
  .slice(0, 8);

const report = {
  schema: "staffordos.spine_consolidation_audit.v1",
  generated_at: now,
  summary: {
    candidates_checked: items.length,
    existing: items.filter(i => i.exists).length,
    missing: items.filter(i => !i.exists).length,
    categories: Object.fromEntries(Object.entries(byCategory).map(([k, v]) => [k, v.length]))
  },
  likely_canonical_spine_stack: likelyCanonical,
  categories: byCategory,
  items,
  recommended_next_move: "Open and inspect run_agent_loop.mjs, execution_driver_v1.mjs, shape_runtime_v1.mjs, patch_gate_v1.mjs, runtime_qa_agent_v1.mjs, and verify_slices_v1.py. Promote one canonical spine and wire partial high-leverage gates into it instead of creating another spine."
};

writeFileSync(
  "staffordos/spine_audit/output/spine_consolidation_audit_v1.json",
  JSON.stringify(report, null, 2) + "\n"
);

let md = `# StaffordOS Spine Consolidation Audit v1\n\nGenerated: ${now}\n\n`;
md += `## Summary\n\n`;
for (const [k, v] of Object.entries(report.summary)) {
  md += `- **${k}**: ${typeof v === "object" ? JSON.stringify(v) : v}\n`;
}

md += `\n## Likely Canonical Spine Stack\n\n`;
for (const item of likelyCanonical) {
  md += `- **${item.category}** — \`${item.path}\` — leverage ${item.leverage_score}\n`;
}

md += `\n## Recommended Next Move\n\n${report.recommended_next_move}\n\n`;

md += `## Full Candidate List\n\n`;
for (const item of items) {
  md += `- ${item.exists ? "✅" : "❌"} **${item.category}** — \`${item.path}\` — leverage ${item.leverage_score}\n`;
}

writeFileSync(
  "staffordos/spine_audit/output/spine_consolidation_audit_v1.md",
  md
);

console.log(JSON.stringify(report.summary, null, 2));
console.log("\nTop spine candidates:");
for (const item of likelyCanonical) {
  console.log(`- ${item.leverage_score} ${item.category}: ${item.path}`);
}
