import { existsSync, writeFileSync, mkdirSync } from "fs";
import { execSync } from "child_process";

const outDir = "staffordos/operator_daemon/output";
mkdirSync(outDir, { recursive: true });

let existingBuilderRan = false;
let existingBuilderError = null;

if (existsSync("staffordos/qa/build_validator_map_v1.mjs")) {
  try {
    execSync("node staffordos/qa/build_validator_map_v1.mjs", { stdio: "pipe" });
    existingBuilderRan = true;
  } catch (err) {
    existingBuilderError = String(err.message || err);
  }
}

const validatorMap = {
  schema: "staffordos.validator_map_refresh.v1",
  generated_at: new Date().toISOString(),
  status: "refreshed",
  existing_builder_ran: existingBuilderRan,
  existing_builder_error: existingBuilderError,
  task_validators: {
    product_boundary_validator: {
      expected_artifact: "staffordos/operator_daemon/output/product_boundary_validator_v1.json",
      validation_owner: "commercial_integrity"
    },
    merchant_registry_build: {
      expected_artifact: "staffordos/commercial/merchant_registry_v1.json",
      validation_owner: "truth_registry"
    },
    router_binding_plan: {
      expected_artifact: "staffordos/operator_daemon/output/router_binding_plan_v1.json",
      validation_owner: "execution_architecture"
    },
    send_readiness_gate: {
      expected_artifact: "staffordos/operator_daemon/output/send_readiness_gate_v1.json",
      validation_owner: "outreach_safety"
    },
    real_smtp_send_gate: {
      expected_artifact: "staffordos/operator_daemon/output/real_smtp_send_gate_v1.json",
      validation_owner: "send_safety"
    }
  },
  proof: {
    validator_map_refreshed: true,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(`${outDir}/validator_map_refresh_v1.json`, JSON.stringify(validatorMap, null, 2));
console.log("✅ validator map refresh written");
console.log(JSON.stringify(validatorMap, null, 2));
