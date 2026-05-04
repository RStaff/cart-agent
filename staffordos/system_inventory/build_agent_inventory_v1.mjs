import { readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const now = new Date().toISOString();

const ROOTS = [
  "staffordos",
  "scripts",
  "web/src",
  "ross_operator"
];

const EXCLUDE_DIRS = [
  "node_modules",
  ".next",
  ".git",
  "output",
  "proof_runs",
  "dist",
  "build"
];

const AGENT_PATTERNS = [
  "agent",
  "engine",
  "router",
  "planner",
  "executor",
  "validator",
  "gate",
  "decision",
  "workflow",
  "orchestrator"
];

const agents = [];

function shouldExclude(fullPath) {
  return EXCLUDE_DIRS.some(part => fullPath.split(path.sep).includes(part));
}

function walk(dir) {
  let results = [];
  if (shouldExclude(dir)) return results;

  for (const file of readdirSync(dir)) {
    const full = path.join(dir, file);
    if (shouldExclude(full)) continue;

    try {
      const stat = statSync(full);
      if (stat.isDirectory()) {
        results = results.concat(walk(full));
      } else if (/\.(mjs|js|ts|tsx|json|md)$/.test(full)) {
        results.push(full);
      }
    } catch {}
  }
  return results;
}

for (const root of ROOTS) {
  try {
    const files = walk(root);

    for (const f of files) {
      const name = f.toLowerCase();

      if (AGENT_PATTERNS.some(p => name.includes(p))) {
        agents.push({
          id: f.replace(/\//g, "_"),
          path: f,
          type: AGENT_PATTERNS.find(p => name.includes(p)) || "unknown",
          detected: true
        });
      }
    }
  } catch {}
}

const inventory = {
  schema: "staffordos.agent_inventory.v1",
  generated_at: now,
  total_agents: agents.length,
  excluded_dirs: EXCLUDE_DIRS,
  agents
};

writeFileSync(
  "staffordos/system_inventory/output/agent_inventory_v1.json",
  JSON.stringify(inventory, null, 2) + "\n"
);

console.log(JSON.stringify({
  ok: true,
  agents_found: agents.length
}, null, 2));
