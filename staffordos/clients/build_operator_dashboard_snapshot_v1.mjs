import { readFileSync, writeFileSync } from "node:fs";

const registry = JSON.parse(readFileSync("staffordos/clients/client_registry_v1.json", "utf8"));
const clients = registry.clients || [];
const now = new Date().toISOString();

const money = (n) => Number(n || 0);

const snapshot = {
  schema: "staffordos.operator_dashboard_snapshot.v1",
  generated_at: now,
  source: "staffordos/clients/client_registry_v1.json",

  top_metrics: {
    total_clients: clients.length,
    active_revenue_clients: clients.filter(c => c.lifecycle?.stage === "revenue_active").length,
    blocked_clients: clients.filter(c => c.blocker_detection?.blocked).length,
    total_stafford_revenue: clients.reduce((sum, c) => sum + money(c.revenue?.total_lifetime_value), 0),
    total_merchant_revenue_recovered: clients.reduce((sum, c) => sum + money(c.abando?.merchant_revenue_recovered), 0)
  },

  revenue_summary: {
    stafford_revenue: clients.reduce((sum, c) => sum + money(c.revenue?.total_lifetime_value), 0),
    merchant_revenue_recovered: clients.reduce((sum, c) => sum + money(c.abando?.merchant_revenue_recovered), 0),
    recurring_mrr: clients.reduce((sum, c) => sum + money(c.revenue?.abando_recurring_mrr), 0),
    currency: "USD"
  },

  system_health_summary: {
    green: clients.filter(c =>
      Object.entries(c.system_health || {})
        .filter(([k]) => k !== "last_verified_at")
        .every(([, v]) => v === "green")
    ).length,
    red: clients.filter(c =>
      Object.entries(c.system_health || {})
        .some(([k, v]) => k !== "last_verified_at" && v === "red")
    ).length,
    unknown: clients.filter(c =>
      Object.entries(c.system_health || {})
        .some(([k, v]) => k !== "last_verified_at" && v === "unknown")
    ).length
  },

  priority_clients: clients
    .slice()
    .sort((a, b) => money(b.priority_score?.total) - money(a.priority_score?.total))
    .map(c => ({
      client_id: c.client_id,
      merchant_shop: c.merchant_shop,
      lifecycle_stage: c.lifecycle?.stage,
      priority_total: c.priority_score?.total || 0,
      next_action: c.next_action,
      blocked: c.blocker_detection?.blocked || false,
      merchant_revenue_recovered: c.abando?.merchant_revenue_recovered || 0,
      stafford_ltv: c.revenue?.total_lifetime_value || 0
    })),

  blocked_clients: clients
    .filter(c => c.blocker_detection?.blocked)
    .map(c => ({
      client_id: c.client_id,
      merchant_shop: c.merchant_shop,
      blockers: c.blocker_detection?.blockers || [],
      next_action: c.next_action
    })),

  next_actions: clients
    .map(c => ({
      client_id: c.client_id,
      owner: c.next_action?.owner,
      type: c.next_action?.type,
      instructions: c.next_action?.instructions,
      auto_executable: c.next_action?.auto_executable,
      priority_total: c.priority_score?.total || 0
    }))
    .sort((a, b) => money(b.priority_total) - money(a.priority_total))
};

writeFileSync(
  "staffordos/clients/operator_dashboard_snapshot_v1.json",
  JSON.stringify(snapshot, null, 2) + "\n"
);

console.log(JSON.stringify(snapshot, null, 2));
