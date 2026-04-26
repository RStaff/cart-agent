import fs from "node:fs";
import { execSync } from "node:child_process";

const root = process.cwd();

function sh(cmd) {
  try {
    return execSync(cmd, { cwd: root, encoding: "utf8" }).trim();
  } catch (e) {
    return String(e.stdout || e.stderr || e.message).trim();
  }
}

const policy = {
  SOURCE: {
    meaning: "Versioned, intentional system logic or human-readable truth.",
    commit_rule: "May be committed only on the correct scoped branch.",
    examples: [
      "staffordos/**/*.mjs",
      "staffordos/**/*.js",
      "staffordos/**/*.md",
      "staffordos/SYSTEM_RULES.md",
      "staffordos/system_map/system_map_truth_v1.md",
      "staffordos/system_map/system_map_truth_v1.json ONLY if manually maintained as canonical truth",
      "staffordos/agents/agent_registry_v1.json ONLY if manually maintained registry"
    ]
  },
  RUNTIME_OUTPUT: {
    meaning: "Generated report, log, queue, ledger, score, snapshot, or audit output.",
    commit_rule: "Do not commit by default. Restore, ignore, or archive only after approval.",
    examples: [
      "staffordos/**/*_log*.json",
      "staffordos/**/*_report*.json",
      "staffordos/**/*queue*.json",
      "staffordos/**/*ledger*.json",
      "staffordos/system_inventory/*classifier*.json",
      "staffordos/system_inventory/*split_plan*.json",
      "staffordos/system_inventory/*report*.json",
      "staffordos/hygiene/output/*",
      "staffordos/system_map/command_center_v2.html"
    ]
  },
  EVIDENCE_ARTIFACT: {
    meaning: "Generated output intentionally preserved as evidence for a decision or audit.",
    commit_rule: "May be committed only with explicit evidence label and reason.",
    examples: [
      "staffordos/system_inventory/system_map_v2_2_decision_register.json",
      "staffordos/system_inventory/system_map_v2_2_enforcement_mapping.json"
    ]
  },
  BACKUP: {
    meaning: "Timestamped or manual backup files.",
    commit_rule: "Do not commit. Archive or delete after approval.",
    examples: [
      "*.bak",
      "*.backup",
      "*pre_restore*",
      "*pre_recover*"
    ]
  },
  ACTIVE_PRODUCT_WORK: {
    meaning: "Product-facing implementation work tied to a specific branch and product outcome.",
    commit_rule: "Commit only on product branch after governance/runtime files are split away.",
    examples: [
      "abando-frontend/app/shopifixer/",
      "staffordos/agents/apply_shopifixer_*.mjs",
      "staffordos/surfaces/",
      "staffordos/packets/"
    ]
  }
};

const status = sh("git status --short");

const report = {
  ok: true,
  artifact: "source_runtime_policy_register_v1",
  mode: "policy_register_only_no_cleanup",
  generated_at: new Date().toISOString(),
  repo_root: root,
  branch: sh("git branch --show-current"),
  current_status: status || "clean",
  policy,
  approved_operating_rule: "Generated JSON is runtime output by default unless explicitly promoted to canonical truth or evidence artifact.",
  next_step: "Use this policy to revise the split plan before branch separation."
};

fs.writeFileSync(
  "staffordos/system_inventory/source_runtime_policy_register_v1.json",
  JSON.stringify(report, null, 2) + "\n"
);

const md = [
  "# Source vs Runtime Policy Register v1",
  "",
  `Generated: ${report.generated_at}`,
  `Branch: ${report.branch}`,
  "",
  "## Operating Rule",
  "",
  "**Generated JSON is runtime output by default unless explicitly promoted to canonical truth or evidence artifact.**",
  "",
  "## Policy",
  "",
  ...Object.entries(policy).flatMap(([name, value]) => [
    `### ${name}`,
    "",
    `**Meaning:** ${value.meaning}`,
    "",
    `**Commit rule:** ${value.commit_rule}`,
    "",
    "**Examples:**",
    ...value.examples.map((x) => `- \`${x}\``),
    ""
  ]),
  "## Next Step",
  "",
  "Use this policy to revise the split plan before branch separation.",
  ""
].join("\n");

fs.writeFileSync(
  "staffordos/system_inventory/source_runtime_policy_register_v1.md",
  md
);

console.log(JSON.stringify(report, null, 2));
