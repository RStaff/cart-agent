import fs from "node:fs";

function exists(path) {
  return fs.existsSync(path);
}

const capabilities = [
  {
    id: "shopifixer_audit_surface",
    purpose: "ShopiFixer public audit/surface page exists.",
    required_files: ["abando-frontend/app/shopifixer/page.tsx"],
    maturity_rule: "READY"
  },
  {
    id: "governed_change_loop",
    purpose: "StaffordOS can classify requests, verify owners, gate protected branches, and require verification.",
    required_files: ["staffordos/loop/staffordos_loop_v1.mjs"],
    maturity_rule: "READY"
  },
  {
    id: "registry_reality_audit",
    purpose: "StaffordOS can verify whether registered agents have real entrypoints.",
    required_files: ["staffordos/system_inventory/registry_reality_audit_v1.mjs"],
    maturity_rule: "READY"
  },
  {
    id: "scoped_registry_gate",
    purpose: "StaffordOS can block only on agents required for a scoped request.",
    required_files: ["staffordos/loop/staffordos_loop_v1.mjs"],
    required_content: ["scoped_registry_gate", "verifyScopedRegistry"],
    maturity_rule: "READY"
  },
  {
    id: "governed_outreach_packet",
    purpose: "ShopiFixer audit-to-outreach intent exists as approved packet path.",
    required_files: ["staffordos/packets/shopifixer_governed_outreach_packet_v1.json"],
    maturity_rule: "READY_TO_PACKET_ONLY"
  },
  {
    id: "lead_outreach_queue",
    purpose: "Existing queue where outreach candidates are stored.",
    required_files: ["staffordos/leads/outreach_queue.json"],
    maturity_rule: "READY"
  },
  {
    id: "approval_interface",
    purpose: "Operator can list/show/approve/reject/hold approval items.",
    required_files: ["staffordos/agents/approval_interface_v1.mjs"],
    maturity_rule: "READY"
  },
  {
    id: "audit_to_outreach_connector",
    purpose: "Connector from ShopiFixer audit result into governed outreach queue path.",
    required_files: ["staffordos/connectors/shopifixer_audit_to_outreach_v1.mjs"],
    maturity_rule: "NEEDS_CONNECTOR"
  },
  {
    id: "message_generation_agent",
    purpose: "Generates outbound message drafts from outreach queue.",
    required_files: ["staffordos/leads/message_generation_agent_v1.mjs"],
    maturity_rule: "NEEDS_AGENT_REPAIR"
  },
  {
    id: "message_validation_agent",
    purpose: "Validates generated outbound messages before approval/send.",
    required_files: ["staffordos/leads/message_validation_agent_v1.mjs"],
    maturity_rule: "NEEDS_AGENT_REPAIR"
  },
  {
    id: "send_execution_agent",
    purpose: "Sends approved messages only after approval gate.",
    required_files: ["staffordos/leads/send_execution_agent_v1.mjs"],
    maturity_rule: "BLOCKED_BY_MISSING_CAPABILITY"
  }
];

function contentOk(capability) {
  if (!capability.required_content) return true;
  return capability.required_content.every((needle) =>
    capability.required_files.some((file) =>
      exists(file) && fs.readFileSync(file, "utf8").includes(needle)
    )
  );
}

const evaluated = capabilities.map((capability) => {
  const fileChecks = capability.required_files.map((path) => ({
    path,
    exists: exists(path)
  }));

  const filesPresent = fileChecks.every((x) => x.exists);
  const contentPresent = contentOk(capability);

  let status = "READY";
  if (!filesPresent || !contentPresent) {
    status = capability.maturity_rule;
  }

  return {
    ...capability,
    status,
    files: fileChecks,
    content_present: contentPresent
  };
});

const report = {
  ok: true,
  artifact: "capability_matrix_v1",
  generated_at: new Date().toISOString(),
  summary: {
    total: evaluated.length,
    ready: evaluated.filter((x) => x.status === "READY").length,
    ready_to_packet_only: evaluated.filter((x) => x.status === "READY_TO_PACKET_ONLY").length,
    needs_connector: evaluated.filter((x) => x.status === "NEEDS_CONNECTOR").length,
    needs_agent_repair: evaluated.filter((x) => x.status === "NEEDS_AGENT_REPAIR").length,
    blocked_by_missing_capability: evaluated.filter((x) => x.status === "BLOCKED_BY_MISSING_CAPABILITY").length
  },
  decision: {
    next_safe_action: evaluated.find((x) => x.id === "audit_to_outreach_connector")?.status === "NEEDS_CONNECTOR"
      ? "Build the thin audit_to_outreach_connector only. Do not build send automation yet."
      : "Connector already exists. Verify before proceeding.",
    blocked_actions: [
      "Do not send outreach until send_execution_agent_v1 exists and approval path is proven.",
      "Do not modify ShopiFixer UI until connector contract is verified.",
      "Do not treat registered missing agents as executable."
    ]
  },
  capabilities: evaluated
};

fs.writeFileSync(
  "staffordos/capabilities/capability_matrix_v1.json",
  JSON.stringify(report, null, 2) + "\n"
);

console.log(JSON.stringify(report, null, 2));
