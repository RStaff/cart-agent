import { readFileSync, writeFileSync } from "node:fs";

const registry = JSON.parse(readFileSync("staffordos/clients/client_registry_v1.json", "utf8"));
const clients = registry.clients || [];
const now = new Date().toISOString();

const money = (n) => Number(n || 0);

const revenueGaps = clients
  .map(c => {
    const merchantRevenue = money(c.abando?.merchant_revenue_recovered);
    const staffordRevenue = money(c.revenue?.total_lifetime_value);
    return {
      client_id: c.client_id,
      merchant_shop: c.merchant_shop,
      merchant_revenue: merchantRevenue,
      stafford_revenue: staffordRevenue,
      gap: Math.max(0, merchantRevenue - staffordRevenue),
      action:
        merchantRevenue > 0 && staffordRevenue === 0
          ? "Convert proof/recovery value into paid ShopiFixer or Abando plan."
          : "Monitor."
    };
  })
  .filter(g => g.gap > 0)
  .sort((a, b) => b.gap - a.gap);

const actionableClients = clients
  .map(c => ({
    client_id: c.client_id,
    merchant_shop: c.merchant_shop,
    lifecycle_stage: c.lifecycle?.stage,
    priority_total: money(c.priority_score?.total),
    blocked: c.blocker_detection?.blocked || false,
    blocker_count: c.blocker_detection?.blocker_count || 0,
    next_action: c.next_action,
    merchant_revenue_recovered: money(c.abando?.merchant_revenue_recovered),
    stafford_ltv: money(c.revenue?.total_lifetime_value)
  }))
  .sort((a, b) => {
    if (a.blocked !== b.blocked) return a.blocked ? -1 : 1;
    const aGap = Math.max(0, a.merchant_revenue_recovered - a.stafford_ltv);
    const bGap = Math.max(0, b.merchant_revenue_recovered - b.stafford_ltv);
    if (aGap !== bGap) return bGap - aGap;
    return b.priority_total - a.priority_total;
  });

const primaryFocusClient = actionableClients[0] || null;

const primaryFocus = primaryFocusClient
  ? {
      client_id: primaryFocusClient.client_id,
      merchant_shop: primaryFocusClient.merchant_shop,
      reason: primaryFocusClient.blocked
        ? "Client has active blocker(s) preventing revenue progress."
        : primaryFocusClient.merchant_revenue_recovered > primaryFocusClient.stafford_ltv
          ? "Merchant value has been proven but Stafford revenue has not been captured."
          : "Highest-priority client by current operating model.",
      action: primaryFocusClient.blocked
        ? "Resolve blocker before continuing."
        : primaryFocusClient.merchant_revenue_recovered > primaryFocusClient.stafford_ltv
          ? "Convert recovered merchant value into paid plan or case-study close."
          : primaryFocusClient.next_action?.instructions || "Review client.",
      priority_total: primaryFocusClient.priority_total,
      blocked: primaryFocusClient.blocked,
      next_action: primaryFocusClient.next_action
    }
  : {
      client_id: null,
      merchant_shop: null,
      reason: "No clients available.",
      action: "Add or discover clients.",
      priority_total: 0,
      blocked: false,
      next_action: null
    };

const snapshot = {
  schema: "staffordos.operator_dashboard_snapshot.v1",
  generated_at: now,
  source: "staffordos/clients/client_registry_v1.json",

  primary_focus: primaryFocus,
  revenue_gaps: revenueGaps,

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
