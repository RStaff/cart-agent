import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import path from "path";

const ROOT = process.cwd();
const outPath = "staffordos/operator_daemon/output/revenue_route_validator_v1.json";

const files = [];

function walk(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (p.includes("node_modules") || p.includes(".git") || p.includes(".next")) continue;
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(js|mjs|ts|tsx|json|md|sh)$/.test(p)) files.push(p);
  }
}

[
  "staffordos",
  "web/src",
  "web/routes",
  "web/lib",
  "staffordos/ui",
  "staffordos/operator_daemon",
  "staffordos/outreach",
  "staffordos/leads",
  "staffordos/system_map",
  "staffordos/system_inventory"
].forEach(walk);

function read(p) {
  try { return readFileSync(p, "utf8"); } catch { return ""; }
}

function find(patterns) {
  const hits = [];
  for (const f of files) {
    const s = read(f);
    for (const pattern of patterns) {
      if (s.includes(pattern) || new RegExp(pattern, "i").test(s)) {
        hits.push({ file: f, match: pattern });
        break;
      }
    }
  }
  return hits;
}

function check(name, patterns, required = true) {
  const hits = find(patterns);
  return {
    name,
    required,
    status: hits.length ? "present" : required ? "missing" : "not_found",
    hits: hits.slice(0, 12)
  };
}

const shopifixerRoute = [
  check("staffordmedia_entry", ["staffordmedia", "Stafford Media", "staffordmedia.ai"], false),
  check("shopifixer_audit_entry", ["shopifixer", "/shopifixer", "ShopiFixer"]),
  check("audit_summary_or_result", ["audit-result", "audit summary", "audit result", "/audit-result"]),
  check("email_full_audit_link", ["full audit", "email", "audit link"]),
  check("paid_service_950", ["950", "$950", "pricing"]),
  check("client_onboarding_intake", ["onboarding", "intake", "client intake"]),
  check("dev_problem_packet", ["problem packet", "dev issue", "store/admin", "repo/access"], false),
  check("shopifixer_codex_fix_path", ["codex", "fix path", "simulator", "dry-run"], false),
  check("client_delivery", ["client delivery", "delivery back", "deliver"], false),
  check("fix_memory_learning", ["fix memory", "root cause", "reusable playbook", "learning"], false)
];

const abandoRoute = [
  check("abando_entry", ["abando", "Abando", "see recovery"]),
  check("merchant_email_sms_input", ["email", "sms", "phone"]),
  check("recovery_preview_demo", ["recovery preview", "demo", "experience", "/experience"]),
  check("subscription_cta_or_billing", ["subscription", "billing", "pricing", "CTA"]),
  check("shopify_install_onboarding", ["install", "Shopify", "onboarding", "OAuth"]),
  check("webhooks", ["webhook", "webhooks"]),
  check("script_install", ["abando.js", "ScriptTag", "script install"]),
  check("recovery_flow", ["recovery", "abandoned", "return tracking"])
];

const integrityChecks = [
  check("resolver_preflight_guard", ["resolver_preflight_guard_v1.mjs"]),
  check("post_patch_structural_validator", ["post_patch_structural_validator_v1.mjs"]),
  check("commit_gate", ["commit_gate_v1.sh"]),
  check("truth_graph", ["truth_graph_pass_4_promoted_v1"]),
  check("execution_proof_register", ["execution_proof_register_v1"]),
  check("system_map_truth", ["system_map_truth_v1"])
];

const assumptions = [];

function addAssumption(condition, text) {
  if (condition) assumptions.push(text);
}

const allShopPresent = shopifixerRoute.every(x => x.status === "present" || !x.required);
const allAbandoPresent = abandoRoute.every(x => x.status === "present" || !x.required);

addAssumption(!find(["Stripe", "payment_intent", "checkout.session.completed"]).length, "Payment may be assumed but Stripe/payment confirmation proof was not found.");
addAssumption(!find(["send_ledger", "provider_message_id"]).length, "Email/SMS delivery may be assumed but immutable send ledger/provider proof is weak or missing.");
addAssumption(!find(["client intake", "problem packet", "repo/access"]).length, "Paid ShopiFixer onboarding may be assumed but client problem packet flow is not proven.");
addAssumption(!find(["Shopify marketplace", "app listing", "privacy policy"]).length, "Abando Shopify Marketplace readiness may be assumed but listing/privacy/review proof is not found.");
addAssumption(!find(["fix memory", "reusable playbook", "root cause"]).length, "Self-learning after fixes may be assumed but reusable fix-memory loop is not proven.");

const falseNoticeRisks = [];
if (allShopPresent && assumptions.some(a => a.includes("Paid ShopiFixer"))) {
  falseNoticeRisks.push("ShopiFixer route may appear complete while paid-client onboarding/proof is missing.");
}
if (allAbandoPresent && assumptions.some(a => a.includes("Marketplace"))) {
  falseNoticeRisks.push("Abando route may appear complete while Shopify Marketplace readiness proof is missing.");
}

const gaps = [
  ...shopifixerRoute.filter(x => x.required && x.status !== "present").map(x => `shopifixer.${x.name}`),
  ...abandoRoute.filter(x => x.required && x.status !== "present").map(x => `abando.${x.name}`),
  ...integrityChecks.filter(x => x.required && x.status !== "present").map(x => `integrity.${x.name}`)
];

const result = {
  schema: "staffordos.revenue_route_validator.v1",
  generated_at: new Date().toISOString(),
  status: gaps.length ? "gaps_detected" : "passed_with_assumption_review",
  summary: {
    files_scanned: files.length,
    shopifixer_required_steps_present: shopifixerRoute.filter(x => x.required && x.status === "present").length,
    abando_required_steps_present: abandoRoute.filter(x => x.required && x.status === "present").length,
    gaps: gaps.length,
    hidden_assumptions: assumptions.length,
    false_notice_risks: falseNoticeRisks.length
  },
  routes: {
    shopifixer_paid_service_route: shopifixerRoute,
    abando_subscription_route: abandoRoute
  },
  integrity: integrityChecks,
  gaps,
  hidden_assumptions: assumptions,
  false_notice_risks: falseNoticeRisks,
  recommendation: gaps.length
    ? "Do not build new revenue UI yet. Repair missing route/proof gaps first."
    : "Route structure exists. Next validate live URLs, payment confirmation, onboarding packet, and delivery proof.",
  proof: {
    validation_only: true,
    command_executed: false,
    real_send: false,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));

if (gaps.length) process.exit(1);
