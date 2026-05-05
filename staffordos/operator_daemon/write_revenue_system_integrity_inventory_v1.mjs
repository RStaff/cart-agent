import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, statSync } from "fs";
import { join } from "path";

const outDir = "staffordos/operator_daemon/output";
mkdirSync(outDir, { recursive: true });

const roots = [
  "staffordos",
  "staffordos/operator_daemon",
  "staffordos/commercial",
  "staffordos/revenue",
  "staffordos/products",
  "staffordos/router",
  "staffordos/guards",
  "staffordos/qa",
  "staffordos/agents",
  "staffordos/system_inventory",
  "staffordos/ui",
  "web",
  "web/src",
  "web/src/routes",
  "web/src/lib",
  "staffordos/ui/operator-frontend",
  "../StaffordMediaConsulting/apps/website",
  "../StaffordMediaConsulting/apps/website/src",
  "../StaffordMediaConsulting/apps/website/app"
];

const terms = {
  post_patch_structural_validator: [
    "forbidden check",
    "forbidden action",
    "canonical safety",
    "commit_gate",
    "run_task_with_commit_gate",
    "resolver_preflight",
    "expected_artifact",
    "task_command_resolver",
    "validator_map"
  ],
  revenue_route_validator: [
    "revenue route",
    "route validator",
    "staffordmedia",
    "staffordmedia.ai",
    "shopifixer",
    "audit",
    "audit-result",
    "pricing",
    "payment",
    "stripe",
    "onboarding",
    "abando",
    "see recovery",
    "recovery"
  ],
  shopifixer_paid_client_flow: [
    "paid client",
    "client intake",
    "dev problem",
    "problem packet",
    "repo access",
    "simulator",
    "dry-run",
    "client delivery",
    "shopifixer codex"
  ],
  fix_learning_loop: [
    "learning",
    "fix memory",
    "root cause",
    "fix pattern",
    "playbook",
    "feedback",
    "memory",
    "repair_learning"
  ],
  multi_client_queue: [
    "client queue",
    "priority scoring",
    "queue",
    "codex task",
    "parallel",
    "simulator",
    "qa gate"
  ],
  abando_marketplace_readiness: [
    "marketplace",
    "shopify review",
    "oauth",
    "webhook",
    "billing",
    "privacy",
    "app listing",
    "embedded app",
    "script install",
    "email compliance",
    "sms compliance"
  ],
  operator_ui_workflow: [
    "operator",
    "command center",
    "revenue command",
    "system map",
    "execute-primary-action",
    "workflow",
    "ux"
  ]
};

function walk(dir, files = []) {
  if (!existsSync(dir)) return files;
  let entries = [];
  try { entries = readdirSync(dir); } catch { return files; }

  for (const entry of entries) {
    if (entry.startsWith(".git") || entry === "node_modules" || entry === ".next" || entry === "dist" || entry === "build") continue;

    const p = join(dir, entry);
    let st;
    try { st = statSync(p); } catch { continue; }

    if (st.isDirectory()) walk(p, files);
    else {
      if (/\.(js|mjs|ts|tsx|jsx|json|md|sh|html|css)$/i.test(p)) files.push(p);
    }
  }
  return files;
}

const allFiles = Array.from(new Set(roots.flatMap(r => walk(r))));

function safeRead(file) {
  try {
    const txt = readFileSync(file, "utf8");
    if (txt.length > 400000) return txt.slice(0, 400000);
    return txt;
  } catch {
    return "";
  }
}

const grouped = {};
for (const [group, needles] of Object.entries(terms)) {
  grouped[group] = [];

  for (const file of allFiles) {
    const lowerPath = file.toLowerCase();
    const text = safeRead(file);
    const lowerText = text.toLowerCase();

    const matched_terms = needles.filter(t =>
      lowerPath.includes(t.toLowerCase()) || lowerText.includes(t.toLowerCase())
    );

    if (matched_terms.length) {
      grouped[group].push({
        path: file,
        matched_terms: Array.from(new Set(matched_terms)).slice(0, 12)
      });
    }
  }
}

function classifyGroup(items) {
  if (!items.length) return "missing";
  if (items.length <= 3) return "partial_or_thin";
  return "assets_exist_needs_review";
}

const classification = Object.fromEntries(
  Object.entries(grouped).map(([k, v]) => [k, classifyGroup(v)])
);

const result = {
  schema: "staffordos.revenue_system_integrity_inventory.v1",
  generated_at: new Date().toISOString(),
  status: "inventory_complete",
  purpose: "Inventory existing assets before building Revenue Route + System Integrity Layer. No code route changes, no send, no revenue action.",
  searched_roots: roots.filter(existsSync),
  total_files_scanned: allFiles.length,
  grouped,
  classification,
  recommended_next_step: {
    task_type: "revenue_system_integrity_binding_plan",
    reason: "Review existing assets and decide what to bind, extend, or avoid duplicating before building new route/system integrity layer.",
    do_not_build_new_layer_yet: true
  },
  proof: {
    inventory_only: true,
    no_route_changes: true,
    no_ui_changes: true,
    no_send: true,
    real_send: false,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(`${outDir}/revenue_system_integrity_inventory_v1.json`, JSON.stringify(result, null, 2));
console.log("✅ revenue/system integrity inventory written");
console.log(JSON.stringify(result, null, 2));
