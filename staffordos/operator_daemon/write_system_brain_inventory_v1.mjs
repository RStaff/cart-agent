import { existsSync, readdirSync, statSync, writeFileSync, mkdirSync } from "fs";
import path from "path";

const outDir = "staffordos/operator_daemon/output";
mkdirSync(outDir, { recursive: true });

function walk(dir, results = []) {
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    if (["node_modules", ".git", ".next", "dist", "build"].includes(entry)) continue;
    const p = path.join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, results);
    else results.push(p);
  }
  return results;
}

const roots = ["staffordos", "ross_operator"];
const files = roots.flatMap(root => walk(root));

const brainFiles = files.filter(f =>
  /brain|self|heal|repair|decision|next_action|activation|router|selector|resolver|intelligence|learning|loop_d|feedback|memory|operator_command|command_router/i.test(f)
);

const result = {
  schema: "staffordos.system_brain_inventory.v1",
  generated_at: new Date().toISOString(),
  status: "inventory_complete",
  total_candidates: brainFiles.length,
  grouped: {
    brain_candidates: brainFiles.filter(f => /brain|intelligence/i.test(f)),
    decision_candidates: brainFiles.filter(f => /decision|next_action|selector|opportunity/i.test(f)),
    router_candidates: brainFiles.filter(f => /router|resolver|operator_command|command/i.test(f)),
    repair_candidates: brainFiles.filter(f => /repair|self|heal/i.test(f)),
    learning_candidates: brainFiles.filter(f => /loop_d|feedback|learning|memory/i.test(f)),
    activation_candidates: brainFiles.filter(f => /activation|agent_selector|task_to_agent/i.test(f))
  },
  recommendation: {
    next_step: "review_existing_brain_assets_before_building_option_c",
    do_not_create_duplicate_brain_layer: true
  },
  proof: {
    inventory_only: true,
    no_execution_changed: true,
    real_send: false,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(`${outDir}/system_brain_inventory_v1.json`, JSON.stringify(result, null, 2));
console.log("✅ system brain inventory written");
console.log(JSON.stringify(result, null, 2));
