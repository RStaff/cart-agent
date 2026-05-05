import { readFileSync, writeFileSync, existsSync } from "fs";

const manifestPath = "staffordos/spine_authority/spine_authority_manifest_v1.json";
const outPath = "staffordos/operator_daemon/output/spine_sync_validator_v1.json";

let failures = [];

if (!existsSync(manifestPath)) {
  console.log("❌ spine manifest missing");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

for (const [key, path] of Object.entries(manifest.sources)) {
  if (!existsSync(path)) {
    failures.push(`missing_source:${key}`);
  }
}

const result = {
  schema: "staffordos.spine_sync_validator.v1",
  generated_at: new Date().toISOString(),
  status: failures.length ? "failed" : "passed",
  failures,
  proof: {
    validation_only: true,
    real_send: false,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));

if (failures.length) process.exit(1);
