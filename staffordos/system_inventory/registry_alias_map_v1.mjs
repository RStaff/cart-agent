import fs from "node:fs";

const aliases = [
  {
    missing_agent_id: "message_generation_agent_v1",
    missing_entrypoint: "staffordos/leads/message_generation_agent_v1.mjs",
    existing_candidates: ["staffordos/outreach/generateMessage.js", "staffordos/leads/outreach.js"],
    likely_action: "CREATE_WRAPPER_OR_REPOINT_REGISTRY",
    notes: "Existing message generation logic appears present under outreach/generateMessage.js."
  },
  {
    missing_agent_id: "send_execution_agent_v1",
    missing_entrypoint: "staffordos/leads/send_execution_agent_v1.mjs",
    existing_candidates: ["staffordos/outreach/send_outreach.mjs"],
    likely_action: "CREATE_APPROVAL_GATED_WRAPPER",
    notes: "Existing send function exists, but must stay gated. Do not send automatically."
  },
  {
    missing_agent_id: "reply_detection_agent_v1",
    missing_entrypoint: "staffordos/leads/reply_detection_agent_v1.mjs",
    existing_candidates: ["staffordos/replies/detect_reply_type.mjs"],
    likely_action: "CREATE_WRAPPER_OR_REPOINT_REGISTRY",
    notes: "Reply detection logic appears present in replies module."
  },
  {
    missing_agent_id: "send_ledger_agent_v1",
    missing_entrypoint: "staffordos/leads/send_ledger_agent_v1.mjs",
    existing_candidates: ["staffordos/leads/track_outcome.js", "staffordos/leads/outcomes.json"],
    likely_action: "CREATE_WRAPPER",
    notes: "Outcome tracking exists, but send ledger wrapper may still be needed."
  },
  {
    missing_agent_id: "approval_decision_agent_v1",
    missing_entrypoint: "staffordos/leads/approval_decision_agent_v1.mjs",
    existing_candidates: ["staffordos/agents/approval_interface_v1.mjs", "staffordos/optimization/operatorReviewQueue.js"],
    likely_action: "CREATE_DECISION_CORE_OR_REPOINT_APPROVAL_INTERFACE",
    notes: "Approval interface exists, but registry points to missing decision engine."
  },
  {
    missing_agent_id: "contact_research_agent_v1",
    missing_entrypoint: "staffordos/leads/contact_research_agent_v1.mjs",
    existing_candidates: ["staffordos/leads/contact_research.js"],
    likely_action: "CREATE_WRAPPER_OR_REPOINT_REGISTRY",
    notes: "Contact research implementation exists under older filename."
  },
  {
    missing_agent_id: "contact_enrichment_agent_v1",
    missing_entrypoint: "staffordos/leads/contact_enrichment_agent_v1.mjs",
    existing_candidates: ["staffordos/leads/enrich_stores.js", "staffordos/leads/contact_discovery.js"],
    likely_action: "CREATE_WRAPPER_OR_REPOINT_REGISTRY",
    notes: "Enrichment/discovery components exist under older filenames."
  },
  {
    missing_agent_id: "followup_agent_v1",
    missing_entrypoint: "staffordos/leads/followup_agent_v1.mjs",
    existing_candidates: ["staffordos/leads/outreach_templates.json", "staffordos/leads/track_outcome.js"],
    likely_action: "NEEDS_MORE_INSPECTION",
    notes: "Follow-up templates and outcome tracking exist, but no clear follow-up runner found yet."
  }
];

const evaluated = aliases.map((row) => ({
  ...row,
  candidates: row.existing_candidates.map((path) => ({
    path,
    exists: fs.existsSync(path)
  })),
  mapped: row.existing_candidates.some((path) => fs.existsSync(path))
}));

const report = {
  ok: true,
  artifact: "registry_alias_map_v1",
  mode: "inspect_only_alias_mapping",
  generated_at: new Date().toISOString(),
  summary: {
    total_missing_agents_mapped: evaluated.length,
    mapped_to_existing_candidates: evaluated.filter((x) => x.mapped).length,
    unmapped: evaluated.filter((x) => !x.mapped).length
  },
  next_safe_action: "Do not rebuild old systems. Create thin wrappers or registry repoints only after reviewing each candidate implementation.",
  aliases: evaluated
};

fs.writeFileSync(
  "staffordos/system_inventory/registry_alias_map_v1.json",
  JSON.stringify(report, null, 2) + "\n"
);

console.log(JSON.stringify(report, null, 2));
