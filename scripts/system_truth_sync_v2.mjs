import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

function run(cmd) {
  try {
    return execSync(cmd).toString().trim();
  } catch {
    return "";
  }
}

const timestamp = new Date().toISOString();

const truth = {
  generated_at: timestamp,

  git: {
    branch: run("git rev-parse --abbrev-ref HEAD"),
    status: run("git status --short"),
    last_commit: run("git log -1 --oneline")
  },

  system: {
    node_version: run("node -v"),
    npm_version: run("npm -v")
  },

  files: {
    lead_registry_exists: run("test -f staffordos/leads/lead_registry_v1.json && echo yes || echo no"),
    send_ledger_exists: run("test -f staffordos/leads/send_ledger_v1.json && echo yes || echo no"),
    revenue_truth_exists: run("test -f staffordos/revenue/revenue_truth_v1.json && echo yes || echo no"),
    agent_registry_exists: run("test -f staffordos/agents/agent_registry_v1.json && echo yes || echo no")
  },

  counts: {
    leads: Number(run("cat staffordos/leads/lead_registry_v1.json 2>/dev/null | jq '.items | length'") || 0),
    send_proofs: Number(run("cat staffordos/leads/send_ledger_v1.json 2>/dev/null | jq '.items | length'") || 0)
  }
};

writeFileSync(
  "staffordos/system_inventory/runtime_truth_v2.json",
  JSON.stringify(truth, null, 2)
);

console.log("✅ system truth synced");
