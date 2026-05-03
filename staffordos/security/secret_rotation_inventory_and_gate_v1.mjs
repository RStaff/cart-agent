import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

const candidateFiles = [
  ".env",
  ".env.local",
  "web/.env",
  "web/.env.local",
  "web/shopify/.env",
  "frontend/.env.local",
  "abando-frontend/.env.local",
  "abando-frontend/.vercel/.env.production.local",
  "staffordos/ui/operator-frontend/.env.local",
  "staffordos/dev/.env.abando.local"
];

const secretPatterns = [
  { provider: "shopify", key: "SHOPIFY_API_SECRET", priority: 1 },
  { provider: "shopify", key: "SHOPIFY_SHARED_SECRET", priority: 1 },
  { provider: "database", key: "DATABASE_URL", priority: 2 },
  { provider: "twilio", key: "TWILIO_AUTH_TOKEN", priority: 3 },
  { provider: "twilio", key: "TWILIO_ACCOUNT_SID", priority: 3 },
  { provider: "twilio", key: "TWILIO_FROM", priority: 3 },
  { provider: "resend", key: "RESEND_API_KEY", priority: 4 },
  { provider: "vercel", key: "VERCEL_OIDC_TOKEN", priority: 5 },
  { provider: "stripe", key: "STRIPE_SECRET_KEY", priority: 6 },
  { provider: "smtp", key: "SMTP_PASS", priority: 7 },
  { provider: "smtp", key: "SMTP_USER", priority: 7 }
];

function hasValue(line, key) {
  const prefix = `${key}=`;
  if (!line.startsWith(prefix)) return false;
  const value = line.slice(prefix.length).trim().replace(/^["']|["']$/g, "");
  return value.length > 0 && !value.includes("REPLACE_ME") && value !== "";
}

const findings = [];

for (const file of candidateFiles) {
  if (!existsSync(file)) continue;
  const text = readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);

  for (const pattern of secretPatterns) {
    const matched = lines.some((line) => hasValue(line.trim(), pattern.key));
    if (matched) {
      findings.push({
        file,
        provider: pattern.provider,
        key: pattern.key,
        priority: pattern.priority,
        value_redacted: true,
        rotation_required: true
      });
    }
  }
}

const providers = [...new Set(findings.map((f) => f.provider))];

const report = {
  generated_at: new Date().toISOString(),
  check_name: "secret_rotation_inventory_and_gate_v1",
  status: findings.length ? "ROTATION_REQUIRED" : "NO_LOCAL_SECRETS_FOUND",
  total_findings: findings.length,
  affected_providers: providers,
  findings,
  required_rotation_order: [
    "shopify",
    "database",
    "twilio",
    "resend",
    "vercel",
    "stripe",
    "smtp"
  ],
  gate_policy: {
    production_real_merchant_proof_blocked_until: "rotation_completed_or_operator_waiver_recorded",
    never_print_secrets: true,
    never_commit_raw_secret_values: true
  },
  next_required_action:
    findings.length
      ? "Rotate affected provider credentials or create explicit temporary operator waiver."
      : "No local secret exposure found by this inventory."
};

mkdirSync("staffordos/system_inventory/proof_summaries", { recursive: true });
writeFileSync(
  "staffordos/system_inventory/proof_summaries/secret_rotation_inventory_latest.json",
  JSON.stringify(report, null, 2) + "\n"
);

console.log(JSON.stringify(report, null, 2));

if (findings.length) process.exit(2);
