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

const candidates = files.filter(f =>
  /neck|router|route|decision|selector|intent|command|prompt|workbench|next_action|activation|agent/i.test(f)
);

const grouped = {
  neck_candidates: candidates.filter(f => /neck/i.test(f)),
  router_candidates: candidates.filter(f => /router|route|intent|command/i.test(f)),
  decision_candidates: candidates.filter(f => /decision|selector|next_action|activation/i.test(f)),
  console_prompt_candidates: candidates.filter(f => /prompt|workbench|console/i.test(f)),
  agent_candidates: candidates.filter(f => /agent/i.test(f))
};

const result = {
  schema: "staffordos.neck_router_inventory.v1",
  generated_at: new Date().toISOString(),
  status: "inventory_complete",
  total_candidates: candidates.length,
  grouped,
  recommendation: {
    next_step: "review_existing_router_assets_before_building_new_agent_activation_layer",
    do_not_create_duplicate_router: true
  },
  proof: {
    inventory_only: true,
    no_code_execution_routing_changed: true,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(`${outDir}/neck_router_inventory_v1.json`, JSON.stringify(result, null, 2));

console.log("✅ neck/router inventory written");
console.log(JSON.stringify(result, null, 2));
