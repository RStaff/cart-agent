import fs from "fs";

const now = new Date().toISOString();

const requiredInputs = [
  "staffordos/system_inventory/output/asset_discovery_engine_v1.json",
  "staffordos/system_inventory/output/asset_triage_v1.json",
  "staffordos/system_inventory/output/system_map_truth_graph_v1.json",
  "staffordos/system_inventory/output/truth_graph_pass_4_promoted_v1.json",
  "staffordos/system_inventory/output/execution_proof_register_v1.json",
  "staffordos/system_inventory/output/discovery_sync_manifest_v1.json"
];

const status = {
  generated_at: now,
  runner: "discovery_sync_runner_v1",
  mode: "CANONICAL_SYNC_CHECK",
  inputs: requiredInputs.map(file => ({
    file,
    exists: fs.existsSync(file),
    updated_at: fs.existsSync(file) ? fs.statSync(file).mtime.toISOString() : null
  }))
};

status.ready_for_scheduler = status.inputs.every(i => i.exists);

status.next_action = status.ready_for_scheduler
  ? "Scheduler may call this runner."
  : "Missing required inputs. Do not schedule yet.";

fs.writeFileSync(
  "staffordos/system_inventory/output/discovery_sync_runner_status_v1.json",
  JSON.stringify(status, null, 2)
);

fs.writeFileSync(
  "staffordos/system_inventory/output/discovery_sync_runner_status_v1.md",
  `# Discovery Sync Runner Status v1

Generated: ${status.generated_at}

## Runner

${status.runner}

## Mode

${status.mode}

## Ready For Scheduler

${status.ready_for_scheduler ? "YES" : "NO"}

## Inputs

${status.inputs.map(i => `- ${i.exists ? "✅" : "❌"} ${i.file} ${i.updated_at ? `(updated ${i.updated_at})` : ""}`).join("\n")}

## Next Action

${status.next_action}
`
);

console.log("Discovery sync runner status written.");
console.log("Ready for scheduler:", status.ready_for_scheduler);
console.log("Output: staffordos/system_inventory/output/discovery_sync_runner_status_v1.json");
