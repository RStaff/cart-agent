import { readFileSync, existsSync } from "node:fs";

const inventoryFile = "staffordos/system_inventory/proof_summaries/secret_rotation_inventory_latest.json";
const waiverFile = "staffordos/security/operator_secret_rotation_waiver_v1.json";

if (!existsSync(inventoryFile)) {
  console.error("❌ Secret rotation inventory missing. Run secret_rotation_inventory_and_gate_v1 first.");
  process.exit(1);
}

const inventory = JSON.parse(readFileSync(inventoryFile, "utf8"));
const waiverExists = existsSync(waiverFile);

if (inventory.status === "ROTATION_REQUIRED" && !waiverExists) {
  console.error("❌ Secret rotation gate blocked execution.");
  console.error("Affected providers:", inventory.affected_providers || []);
  console.error("Next action:", inventory.next_required_action);
  console.error("To proceed temporarily, create an operator waiver file intentionally.");
  process.exit(1);
}

console.log("✅ Secret rotation gate passed");
