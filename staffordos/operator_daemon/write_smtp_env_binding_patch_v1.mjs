import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";

const outDir = "staffordos/operator_daemon/output";
mkdirSync(outDir, { recursive: true });

const envPath = "staffordos/dev/.env.abando.local";
const keys = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "FROM_EMAIL", "DEFAULT_FROM", "SMTP_FROM"];

let filePresent = existsSync(envPath);
let keysInFile = [];

if (filePresent) {
  const raw = readFileSync(envPath, "utf8");
  keysInFile = keys.filter(k => raw.includes(k));
}

const processPresence = Object.fromEntries(keys.map(k => [k, Boolean(process.env[k])]));

const smtpReady =
  Boolean(process.env.SMTP_HOST) &&
  Boolean(process.env.SMTP_PORT) &&
  Boolean(process.env.SMTP_USER) &&
  Boolean(process.env.SMTP_PASS) &&
  Boolean(process.env.FROM_EMAIL || process.env.DEFAULT_FROM || process.env.SMTP_FROM);

const result = {
  schema: "staffordos.smtp_env_binding_patch.v1",
  generated_at: new Date().toISOString(),
  status: smtpReady ? "operator_env_bound" : "operator_env_not_bound",
  env_source: envPath,
  env_source_present: filePresent,
  keys_detected_in_file_without_values: keysInFile,
  current_process_env_presence_without_values: processPresence,
  smtp_ready_minimum: smtpReady,
  proof: {
    did_not_print_secret_values: true,
    binding_check_only: true,
    real_send: false,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(`${outDir}/smtp_env_binding_patch_v1.json`, JSON.stringify(result, null, 2));

console.log("✅ SMTP env binding patch checked");
console.log(JSON.stringify(result, null, 2));
