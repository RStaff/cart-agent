import { existsSync, readFileSync, writeFileSync } from "node:fs";

function fileExists(path) {
  return existsSync(path);
}

const groups = [
  {
    id: "loops",
    label: "Control / Worker Loops",
    business_value: "Keeps system processes running, checking, or completing work.",
    command_center_surface: "Command Center / System Map",
    files: [
      "staffordos/loop/staffordos_loop_v1.mjs",
      "staffordos/loop/STAFFORDOS_LOOP_V1.md",
      "staffordos/hygiene/run_hygiene_control_loop.js",
      "staffordos/proof_loop/run_merchant_proof_loop_completion_pack.js",
      "staffordos/proof_loop/merchant_proof_loop_completion_pack_v1.js",
      "web/src/lib/send-worker-loop.js"
    ]
  },
  {
    id: "shopifixer_audit",
    label: "ShopiFixer Audit / Diagnostic System",
    business_value: "Finds storefront issues and creates a paid fix path.",
    command_center_surface: "Capacity / Products / Revenue Command",
    files: [
      "staffordos/connectors/shopifixer_audit_to_outreach_v1.mjs",
      "staffordos/scorecards/guidedAuditEngine.js",
      "staffordos/scorecards/runAuditResolver.js",
      "staffordos/scorecards/verify_guided_audit.js",
      "staffordos/scorecards/verify_run_audit.js",
      "web/src/routes/runAudit.esm.js",
      "web/src/routes/guidedAudit.esm.js",
      "abando-frontend/app/run-audit/page.tsx",
      "abando-frontend/app/free-audit/page.tsx",
      "abando-frontend/app/audit-result/page.tsx",
      "abando-frontend/app/api/audit/start/route.ts",
      "abando-frontend/app/api/audit/status/route.ts",
      "abando-frontend/app/api/audit/preview/[storeId]/route.ts"
    ]
  },
  {
    id: "shopifixer_execution",
    label: "ShopiFixer Execution / Page Upgrade System",
    business_value: "Turns audit findings into actual fixes or upgrade packets.",
    command_center_surface: "Capacity / Command Center",
    files: [
      "staffordos/agents/apply_shopifixer_conversion_v2.mjs",
      "staffordos/agents/apply_shopifixer_page_upgrade_v2.mjs",
      "staffordos/packets/shopifixer_governed_outreach_packet_v1.json",
      "staffordos/packets/shopifixer_page_upgrade_packet_v2.json",
      "staffordos/surfaces/staffordmedia_shopifixer_prod_surface_change_packet_v1.json"
    ]
  },
  {
    id: "execution_packets",
    label: "Execution Packet System",
    business_value: "Packages decisions into governed work units.",
    command_center_surface: "Command Center",
    files: [
      "staffordos/optimization/packetTemplates.js",
      "staffordos/optimization/executionPacketGenerator.js",
      "staffordos/optimization/executionPacketRepository.js",
      "staffordos/optimization/verifyExecutionPacketPersistence.js",
      "staffordos/optimization/persistExecutionPacket.js",
      "staffordos/optimization/executionPacketRegistry.json",
      "staffordos/packets/conversion_upgrade_packet_v2.json"
    ]
  },
  {
    id: "gates",
    label: "Execution / Revenue / Patch Gates",
    business_value: "Prevents unsafe execution and validates readiness.",
    command_center_surface: "Command Center / System Map",
    files: [
      "staffordos/gates/revenue_gate_v1.mjs",
      "staffordos/system_inventory/patch_gate_v1.mjs",
      "staffordos/optimization/paymentGate.js",
      "staffordos/hygiene/branch_scope_gate_v1.js",
      "staffordos/hygiene/run_branch_scope_gate.js",
      "staffordos/hygiene/run_worktree_cleanup_gate.js",
      "staffordos/revenue/revenue_gate.js",
      "staffordos/revenue/verify_revenue_gate.js",
      "web/src/middleware/usageGate.js"
    ]
  },
  {
    id: "onboarding",
    label: "Onboarding System",
    business_value: "Collects client/store setup information for service or app activation.",
    command_center_surface: "Capacity / Products",
    files: [
      "scripts/leads/send_onboarding_message.mjs",
      "scripts/patch_onboarding_page.sh",
      "web/src/public/onboarding/index.html",
      "abando-frontend/src/app_legacy/onboarding/OnboardingForm.tsx",
      "abando-frontend/src/app_legacy/onboarding/Client.tsx",
      "abando-frontend/src/app_legacy/onboarding/page.tsx"
    ]
  },
  {
    id: "recovery",
    label: "Abando Recovery System",
    business_value: "Recovers abandoned carts and attributes revenue.",
    command_center_surface: "Products / Revenue Command / Analytics",
    files: [
      "staffordos/deploy/check_recovery_link_base.js",
      "web/lib/composeRecoveryMessage.js",
      "web/src/lib/recoveryAttribution.js",
      "web/src/lib/recoveryMessageEngine.js",
      "abando-frontend/app/api/abando/activation/trigger-test-recovery/route.ts",
      "abando-frontend/src/components/dashboard/RecoveryOpportunityCard.tsx",
      "abando-frontend/src/components/RecoveryEntryCta.tsx"
    ]
  },
  {
    id: "routers",
    label: "Routing System",
    business_value: "Routes leads, stores, tasks, or actions to the correct workflow.",
    command_center_surface: "System Map / Command Center",
    files: [
      "staffordos/leads/router.js",
      "staffordos/router/router_v1_real_store_worksheet.mjs",
      "staffordos/router/router_v1_harness.mjs",
      "staffordos/router/router_v1_1.js",
      "staffordos/router/router_v1.js"
    ]
  },
  {
    id: "execution_control",
    label: "Execution Control System",
    business_value: "Determines allowed automation scope and execution mode.",
    command_center_surface: "Command Center",
    files: [
      "staffordos/execution/verifyExecutionControl.js",
      "staffordos/execution/automationScope.js",
      "staffordos/execution/resolveExecutionMode.js",
      "staffordos/agents/execution_driver_v1.mjs"
    ]
  },
  {
    id: "legacy_command_center",
    label: "Legacy / Earlier Command Center Surfaces",
    business_value: "Older UI assets that may contain useful UX or state patterns.",
    command_center_surface: "System Map / Command Center",
    files: [
      "staffordos/ui/command-center/styles.css",
      "staffordos/ui/command-center/app.js",
      "staffordos/ui/operator-frontend/app/api/operator/ross-command-center/route.ts",
      "staffordos/ui/operator-frontend/app/operator/command-center/page.tsx",
      "abando-frontend/src/app_legacy/command-center/StatusPanel.tsx",
      "abando-frontend/src/app_legacy/command-center/page.tsx"
    ]
  }
];

const enriched = groups.map((group) => {
  const files = group.files.map((path) => ({ path, exists: fileExists(path) }));
  const found = files.filter((f) => f.exists).length;
  return {
    ...group,
    files,
    found_count: found,
    total_count: files.length,
    status: found === 0 ? "MISSING" : found === files.length ? "REAL" : "PARTIAL"
  };
});

const output = {
  version: "system_map_expansion_pass_3_missed_systems_v1",
  generated_at: new Date().toISOString(),
  purpose: "Convert missed systems discovery into capability groups that can be merged into the truth graph and eventually rendered in System Map.",
  groups: enriched
};

writeFileSync(
  "staffordos/system_inventory/output/system_map_expansion_pass_3_missed_systems.json",
  JSON.stringify(output, null, 2) + "\n"
);

let md = `# System Map Expansion Pass 3 — Missed Systems → Capability Groups

Generated: ${output.generated_at}

## Purpose
Convert missed systems discovery into capability groups that can be merged into the System Map truth graph.

## Rule
No UI build yet. This pass only classifies already discovered assets.

---

## Capability Groups
`;

for (const group of enriched) {
  md += `

### ${group.label}
- ID: ${group.id}
- Status: ${group.status}
- Files Found: ${group.found_count}/${group.total_count}
- Business Value: ${group.business_value}
- Command Center Surface: ${group.command_center_surface}

#### Files
${group.files.map((f) => `- ${f.exists ? "FOUND" : "MISSING"}: ${f.path}`).join("\n")}
`;
}

md += `

---

## Required Truth Graph Update
These groups must be added to:

- system_map_truth_graph_v1.json
- System Map UI
- Command Center requirements
- Product capability decomposition
- Data ownership matrix where files read/write state

## Important Finding
The previous truth graph was incomplete because it did not fully represent:
- loops
- ShopiFixer audit/fix workflow
- execution packets
- gates
- onboarding
- Abando recovery
- routing
- execution control
- older command center assets

`;

writeFileSync(
  "staffordos/system_inventory/output/system_map_expansion_pass_3_missed_systems.md",
  md
);

console.log(JSON.stringify({
  ok: true,
  groups: enriched.length,
  real: enriched.filter(g => g.status === "REAL").length,
  partial: enriched.filter(g => g.status === "PARTIAL").length,
  missing: enriched.filter(g => g.status === "MISSING").length
}, null, 2));
