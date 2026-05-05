import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "fs";
import path from "path";

const outDir = "staffordos/operator_daemon/output";
mkdirSync(outDir, { recursive: true });

const envKeys = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "FROM_EMAIL",
  "DEFAULT_FROM",
  "SMTP_FROM"
];

const presence = Object.fromEntries(envKeys.map(k => [k, Boolean(process.env[k])]));

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

const files = [
  ...walk(".").filter(f =>
    /(^|\/)\.env($|\.|local|production|development)|email|smtp|sender|mail/i.test(f)
  )
];

const safeFiles = files.map(f => {
  let hits = [];
  try {
    const raw = readFileSync(f, "utf8");
    hits = envKeys.filter(k => raw.includes(k));
  } catch {}
  return {
    path: f,
    mentions_smtp_keys: hits.length > 0,
    keys_mentioned: hits
  };
}).filter(x => x.mentions_smtp_keys || /email|smtp|sender|mail/i.test(x.path));

const smtpReady =
  Boolean(process.env.SMTP_HOST) &&
  Boolean(process.env.SMTP_PORT) &&
  Boolean(process.env.SMTP_USER) &&
  Boolean(process.env.SMTP_PASS) &&
  Boolean(process.env.FROM_EMAIL || process.env.DEFAULT_FROM || process.env.SMTP_FROM);

const result = {
  schema: "staffordos.smtp_env_discovery.v1",
  generated_at: new Date().toISOString(),
  status: smtpReady ? "smtp_env_visible_to_operator" : "smtp_env_not_visible_to_operator",
  current_process_env_presence_without_values: presence,
  smtp_ready_minimum: smtpReady,
  config_file_candidates_without_secret_values: safeFiles,
  binding_recommendation: smtpReady
    ? {
        action: "keep_current_env_binding",
        reason: "The operator process can see required SMTP env vars."
      }
    : {
        action: "bind_operator_daemon_to_existing_env_source",
        reason: "SMTP may be configured elsewhere, but current StaffordOS operator process cannot see required env vars.",
        next_task: "smtp_env_binding_patch"
      },
  proof: {
    did_not_print_secret_values: true,
    discovery_only: true,
    real_send: false,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(`${outDir}/smtp_env_discovery_v1.json`, JSON.stringify(result, null, 2));

console.log("✅ SMTP env discovery written");
console.log(JSON.stringify(result, null, 2));
