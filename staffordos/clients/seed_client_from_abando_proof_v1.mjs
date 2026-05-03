import { upsertClient } from "./client_registry_v1.mjs";

const shop = "cart-agent-dev.myshopify.com";

const client = upsertClient({
  client_id: shop,
  merchant_shop: shop,
  source: "abando_proof_loop",
  status: "proof_client",
  contact: {
    email: "rossstafford1@gmail.com"
  },
  deal: {
    type: "internal_proof",
    value: 0,
    currency: "USD",
    payment_status: "not_billable"
  },
  shopifixer: {
    audit_status: "not_started",
    fix_status: "not_started"
  },
  abando: {
    installed: true,
    install_status: "db_backed_green",
    checkout_events: 1,
    recovery_actions: 1,
    merchant_revenue_recovered: 100,
    currency: "USD",
    last_recovery_at: new Date().toISOString()
  },
  business: {
    stafford_revenue_earned: 0,
    stafford_recurring_revenue: 0,
    lifetime_value: 0,
    next_action: "Use proof loop to sell first external merchant."
  },
  notes: [
    {
      at: new Date().toISOString(),
      type: "proof",
      text: "Abando proof loop completed: install, checkout event, decision, trigger, email send, return, and revenue attribution."
    }
  ]
});

console.log(JSON.stringify(client, null, 2));
