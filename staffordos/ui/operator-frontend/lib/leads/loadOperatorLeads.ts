import fs from "node:fs";
import path from "node:path";
import { canonicalLeadLifecycleStage, canonicalLifecyclePhase } from "../operator/lifecycleTerminology";
import { isStaffordMediaEligibleLead } from "../../../../leads/staffordmedia_revenue_transaction_v1.mjs";

const ROOT = path.resolve(process.cwd(), "../../..");

function readJson(relativePath: string, fallback: any) {
  try {
    const fullPath = path.join(ROOT, relativePath);
    if (!fs.existsSync(fullPath)) return fallback;
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch {
    return fallback;
  }
}

function normalizeOptionalCampaignId(value: any) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

function normalizeLead(input: any) {
  const id = String(input.id || input.lead_id || input.domain || input.name || "");
  const contact = input.contact || {};
  const engagement = input.engagement || {};
  const status = input.status || {};
  const businessUnit = String(input.businessUnit || input.business_unit || "").trim();
  const campaignId = normalizeOptionalCampaignId(input.campaignId || input.campaign_id || input.campaign?.campaign_id);
  const product = String(input.product || "").trim();
  const domain = String(input.domain || input.url || "");
  const productScope = businessUnit || product || (domain.endsWith(".myshopify.com") ? "SHOPIFIXER" : "UNSCOPED");
  const staffordmediaEligible = isStaffordMediaEligibleLead(input);

  return {
    id,
    name: String(input.name || input.domain || id || "unknown"),
    domain,
    campaign_id: campaignId,
    product_scope: productScope.toUpperCase(),
    staffordmedia_eligible: staffordmediaEligible,
    email: contact.email || input.email || input.send_target || null,
    source: String(input.source || "unknown"),
    lifecycle_stage: String(input.lifecycle_stage || status.current_stage || input.status || "new"),
    canonical_lifecycle_stage: canonicalLeadLifecycleStage(input),
    canonical_phase: canonicalLifecyclePhase(input, "lead"),
    next_action: String(status.next_action || input.nextAction || input.next_action || "Review lead"),
    score: typeof input.score === "number" ? input.score : null,
    temperature: input.temperature || input.status?.temperature || "cold",
    conversion_score: input.conversion_score || input.status?.conversion_score || input.score || 0,
    outreach_ready: Boolean(contact.email || input.email || input.send_target || input.message || input.nextMessage),
    queued: Boolean(input.refs?.outreach_queue || input.queued || input.status === "queued"),
    sent: Boolean(engagement.sent || input.sent),
    replied: Boolean(engagement.replied || input.replied),
    last_event_at: input.updated_at || input.generatedAt || input.created_at || null
  };
}

export async function loadOperatorLeads() {
  const registry = readJson("staffordos/leads/lead_registry_v1.json", { items: [] });
  const events = readJson("staffordos/leads/lead_events_v1.json", { events: [] });
  const sendLedger = readJson("staffordos/leads/send_ledger_v1.json", { items: [] });
  const revenueTransactions = readJson("staffordos/leads/staffordmedia_revenue_transactions_v1.json", { transactions: [] });
  const offerRegistry = readJson("staffordos/leads/staffordmedia_offer_registry_v1.json", { offers: [] });

  const sendQueue = readJson(".tmp/send_queue.json", []);
  const sendReady = readJson(".tmp/send_ready.json", []);
  const sendConsole = readJson(".tmp/send_console_data.json", []);

  const registryItems = Array.isArray(registry.items) ? registry.items : [];
  const queueItems = Array.isArray(sendQueue) ? sendQueue : [];
  const readyItems = Array.isArray(sendReady) ? sendReady : [];
  const consoleItems = Array.isArray(sendConsole) ? sendConsole : [];

  const byId = new Map<string, any>();
  const transactionByLead = new Map<string, any>();
  for (const transaction of Array.isArray(revenueTransactions.transactions) ? revenueTransactions.transactions : []) {
    const current = transactionByLead.get(transaction.leadId);
    if (!current || String(transaction.updatedAt || "") > String(current.updatedAt || "")) {
      transactionByLead.set(transaction.leadId, transaction);
    }
  }

  for (const item of [...registryItems, ...queueItems, ...readyItems, ...consoleItems]) {
    const lead = normalizeLead(item);
    if (!lead.id) continue;

    const existing = byId.get(lead.id);
    byId.set(lead.id, {
      ...(existing || {}),
      ...lead,
      sent: Boolean(existing?.sent || lead.sent),
      replied: Boolean(existing?.replied || lead.replied),
      queued: Boolean(existing?.queued || lead.queued),
      outreach_ready: Boolean(existing?.outreach_ready || lead.outreach_ready),
      product_scope: existing?.product_scope && existing.product_scope !== "UNSCOPED" ? existing.product_scope : lead.product_scope,
      staffordmedia_eligible: Boolean(existing?.staffordmedia_eligible || lead.staffordmedia_eligible),
      governed_transaction: transactionByLead.get(lead.id) || existing?.governed_transaction || null
    });
  }

  const leads = Array.from(byId.values());
  leads.sort((a, b) => (b.conversion_score || b.score || 0) - (a.conversion_score || a.score || 0));

  const summary = {
    total_leads: leads.length,
    contact_ready: leads.filter((l) => Boolean(l.email)).length,
    outreach_ready: leads.filter((l) => l.outreach_ready).length,
    queued: leads.filter((l) => l.queued).length,
    sent: leads.filter((l) => l.sent).length,
    engaged: leads.filter((l) => l.lifecycle_stage === "engaged" || l.replied).length,
    blocked: leads.filter((l) => !l.email && !l.outreach_ready).length,
    send_ledger_items: Array.isArray(sendLedger.items) ? sendLedger.items.length : 0,
    event_count: Array.isArray(events.events) ? events.events.length : 0,
    canonical_phase_counts: leads.reduce((counts: Record<string, number>, lead) => {
      const key = lead.canonical_phase || "Operator Control";
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {})
  };
  const offerRegistered = (Array.isArray(offerRegistry.offers) ? offerRegistry.offers : []).some((offer: any) =>
    offer.offerId === "STAFFORDMEDIA_AUTOMATION_OPPORTUNITY_ASSESSMENT_V1"
    && offer.businessUnit === "STAFFORDMEDIA"
    && offer.price?.currency === "USD"
    && offer.price?.amount === 750
  );

  return {
    ok: true,
    source_policy: "real_files_only",
    summary,
    leads,
    staffordmedia_revenue_operations: {
      offer_registered: offerRegistered,
      eligible_leads: leads.filter((lead) => lead.staffordmedia_eligible).length,
      transaction_records: Array.isArray(revenueTransactions.transactions) ? revenueTransactions.transactions.length : 0,
      real_send_enabled: process.env.STAFFORDOS_REAL_PROSPECT_SEND_ENABLED === "1"
    },
    sources: {
      registry: "staffordos/leads/lead_registry_v1.json",
      events: "staffordos/leads/lead_events_v1.json",
      send_queue: ".tmp/send_queue.json",
      send_ready: ".tmp/send_ready.json",
      send_console: ".tmp/send_console_data.json",
      send_ledger: "staffordos/leads/send_ledger_v1.json",
      revenue_transactions: "staffordos/leads/staffordmedia_revenue_transactions_v1.json",
      offer_registry: "staffordos/leads/staffordmedia_offer_registry_v1.json"
    }
  };
}
