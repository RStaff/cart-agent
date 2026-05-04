import { readFileSync, writeFileSync } from "node:fs";

const now = new Date().toISOString();

const inventory = JSON.parse(
  readFileSync("staffordos/system_inventory/output/agent_inventory_v1.json", "utf8")
);

const validators = inventory.agents
  .filter(a =>
    a.path.includes("qa") ||
    a.path.includes("validate") ||
    a.path.includes("gate")
  )
  .map(a => ({
    validator_id: a.id,
    path: a.path,
    type: "validator"
  }));

const map = {
  schema: "staffordos.validator_map.v1",
  generated_at: now,
  total_validators: validators.length,
  validators,
  rules: [
    "All outputs must be validated before UI exposure",
    "Primary action must pass QA gate",
    "UX must pass integrity validator",
    "Preflight must pass before execution"
  ]
};

writeFileSync(
  "staffordos/qa/validator_map_v1.json",
  JSON.stringify(map, null, 2)
);

console.log(JSON.stringify({
  ok: true,
  validators_found: validators.length
}, null, 2));
