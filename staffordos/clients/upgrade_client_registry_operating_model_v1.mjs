import { readFileSync, writeFileSync, existsSync } from "node:fs";

const path = "staffordos/clients/client_registry_v1.json";

if (!existsSync(path)) {
  throw new Error("client_registry_v1.json not found");
}

const now = new Date().toISOString();
const registry = JSON.parse(readFileSync(path, "utf8"));

registry.schema = "staffordos.client_registry.v1";
registry.operating_model = {
  version: "operating_model_v1",
  purpose: "Separate StaffordOS business truth from ShopiFixer service truth and Abando merchant performance truth.",
  rules: [
    "Abando revenue is merchant revenue, not Stafford revenue.",
    "ShopiFixer tracks diagnosis and fix lifecycle.",
    "StaffordOS tracks client lifecycle, deal state, next actions, business revenue, and system health.",
    "Every client must have one lifecycle stage and one primary next action."
  ],
  lifecycle_stages: [
    "lead",
    "audit_requested",
    "audit_completed",
    "proposal_sent",
    "deal_won",
    "fix_in_progress",
    "fix_completed",
    "abando_installed",
    "revenue_active",
    "paused",
    "lost"
  ],
  next_action_types: [
    "discover",
    "outreach",
    "audit",
    "proposal",
    "close",
    "collect_payment",
    "fix",
    "install_abando",
    "trigger_recovery",
    "followup",
    "monitor",
    "none"
  ]
};

registry.generated_at = now;
registry.clients = (registry.clients || []).map((client) => {
  const previousNextAction =
    typeof client.business?.next_action === "string"
      ? client.business.next_action
      : client.business?.next_action?.instructions || null;

  const lifecycleStage =
    client.status === "proof_client"
      ? "revenue_active"
      : client.deal?.payment_status === "paid"
        ? "deal_won"
        : client.shopifixer?.audit_status === "completed"
          ? "audit_completed"
          : "lead";

  const upgraded = {
    ...client,
    updated_at: now,

    lifecycle: {
      stage: client.lifecycle?.stage || lifecycleStage,
      stage_updated_at: client.lifecycle?.stage_updated_at || now,
      blocked: client.lifecycle?.blocked ?? false,
      block_reason: client.lifecycle?.block_reason ?? null
    },

    next_action: {
      type: client.next_action?.type || "followup",
      owner: client.next_action?.owner || "ross",
      due_at: client.next_action?.due_at || null,
      instructions:
        client.next_action?.instructions ||
        previousNextAction ||
        "Review client and choose next revenue action.",
      auto_executable: client.next_action?.auto_executable ?? false,
      created_at: client.next_action?.created_at || now,
      updated_at: now
    },

    revenue: {
      shopifixer_one_time: client.revenue?.shopifixer_one_time ?? client.deal?.value ?? 0,
      shopifixer_collected: client.revenue?.shopifixer_collected ?? client.deal?.payment_status === "paid",
      abando_recurring_mrr: client.revenue?.abando_recurring_mrr ?? 0,
      abando_percentage: client.revenue?.abando_percentage ?? 0,
      total_lifetime_value:
        client.revenue?.total_lifetime_value ??
        client.business?.lifetime_value ??
        client.deal?.value ??
        0,
      currency: client.revenue?.currency || client.deal?.currency || "USD"
    },

    problem_profile: {
      type: client.problem_profile?.type || null,
      severity: client.problem_profile?.severity ?? null,
      detected_by: client.problem_profile?.detected_by || null,
      recommended_fix: client.problem_profile?.recommended_fix || null,
      fix_template_id: client.problem_profile?.fix_template_id || null
    },

    system_health: {
      abando_install:
        client.system_health?.abando_install ||
        (client.abando?.installed ? "green" : "unknown"),
      event_ingestion:
        client.system_health?.event_ingestion ||
        (client.abando?.checkout_events > 0 ? "green" : "unknown"),
      recovery_trigger:
        client.system_health?.recovery_trigger ||
        (client.abando?.recovery_actions > 0 ? "green" : "unknown"),
      email_send: client.system_health?.email_send || "green",
      return_tracking:
        client.system_health?.return_tracking ||
        (client.abando?.merchant_revenue_recovered > 0 ? "green" : "unknown"),
      last_verified_at: client.system_health?.last_verified_at || now
    }
  };

  if (upgraded.business) {
    delete upgraded.business.next_action;
  }

  return upgraded;
});

writeFileSync(path, JSON.stringify(registry, null, 2) + "\n");

console.log(JSON.stringify({
  ok: true,
  upgraded_at: now,
  clients: registry.clients.length,
  required_layers: [
    "lifecycle",
    "next_action",
    "revenue",
    "problem_profile",
    "system_health"
  ]
}, null, 2));
